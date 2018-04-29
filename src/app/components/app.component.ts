import { Component, OnInit } from "@angular/core";
import { AppService } from "../services/app.service";
import { FirebaseService } from "../services/firebase.service";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-root",
  templateUrl: "../views/app.component.html",
  styleUrls: ["../styles/app.scss"],
  providers: [AppService, FirebaseService]
})
export class AppComponent implements OnInit {
  // Forms
  public addSeriesForm: FormGroup;
  public searchForm: FormGroup;
  // Error message
  public statusInfo: any;

  public currentSeriesIndex: number;
  public watchList: Array<any>;


  public constructor(
    private formBuilder: FormBuilder,
    private appService: AppService,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.searchForm = new FormGroup({
      inputName: new FormControl({value: "", disabled: true}, Validators.required),
      inputSeason: new FormControl("", Validators.required),
      inputEpisode: new FormControl("", Validators.required)
    });

    this.addSeriesForm = new FormGroup({
      inputName: new FormControl("", Validators.required),
      inputWikiLink: new FormControl("", Validators.required)
    });

    this.statusInfo = {
      type: "",
      message: ""
    };

    this.retrieveMySeries();
  }

  public selectSeries = (index: number): void => {
    this.currentSeriesIndex = index;
    this.searchForm.controls["inputName"].setValue(this.watchList[index].name);
    this.searchForm.controls["inputSeason"].setValue(this.watchList[index].season);
    this.searchForm.controls["inputEpisode"].setValue(this.watchList[index].episode);
  }


  // ----------------------------------------------- STATUS INFO BOX --------------------------------------------------- //

  public isStatusInfoHidden = (): boolean => !(this.statusInfo && this.statusInfo.type && this.statusInfo.message);

  public getStatusInfoClass = (): any => {
    const statusInfoObj: any = {};

    if (!this.isStatusInfoHidden()) {

      switch (this.statusInfo.type) {
        case "error":
          statusInfoObj["isError"] = true;
          break;

        case "info":
          statusInfoObj["isInfo"] = true;
          break;

        case "success":
          statusInfoObj["isSuccess"] = true;
          break;
      }
    }

    return statusInfoObj;
  }

  public setStatusInfo = (type: string, message: string) => {
    this.statusInfo.type = type;
    this.statusInfo.message = message;
  }


  // --------------------------------------------------- SERVICES ------------------------------------------------------- //
  public retrieveMySeries = () => {
    this.firebaseService.retrieveMySeries().subscribe(
      response => {

        this.setStatusInfo("info", "Retrieving watchlist...");

        if (response && response.length > 0) {
          // Clean watchlist from empty entries
          this.watchList = response.filter((wEntry: any) => !!wEntry)
          // Sort watchlist by series name
            .sort((a, b) => a.name < b.name ? -1 : 1);

          // Retrieve last aired dates
          this.watchList.forEach((series: any) => {
            this.retrieveNextAiringEpisode(series);
          });

          this.setStatusInfo("success", "Watchlist retrieved successfully!");
        } else {
          this.setStatusInfo("error", "Error retrieving watchlist, or watchlist empty!");
        }
      },
      error => this.setStatusInfo("error", <any>error)
    );
  }

  public uploadCurrentSeries = () => {
    const currentSeries: any = this.watchList[this.currentSeriesIndex];

    // Update currently selected series
    currentSeries.season = this.searchForm.controls["inputSeason"].value;
    currentSeries.episode = this.searchForm.controls["inputEpisode"].value;

    // Remove unuseful fields from the series object before uploading it
    delete currentSeries.nextAiringEpisode;

    // Upload current series to firebase
    this.firebaseService.updateSeries(currentSeries, this.currentSeriesIndex).subscribe(
      response => {
        console.log("series uploaded successfully!");
        this.retrieveNextAiringEpisode(currentSeries);
      },
      error => this.setStatusInfo("error", <any>error)
    );
  }

  public uploadWatchlist = (updateEpNumbers?: boolean) => {
    // Update currently selected series
    if (updateEpNumbers) {
      this.watchList[this.currentSeriesIndex].season = this.searchForm.controls["inputSeason"].value;
      this.watchList[this.currentSeriesIndex].episode = this.searchForm.controls["inputEpisode"].value;
    }

    // Remove unuseful fields from the list before uploading it
    this.watchList.forEach(series => delete series.nextAiringEpisode);

    // Upload watchlist to firebase
    this.firebaseService.updateWatchlist(this.watchList).subscribe(
      response => {
        console.log("Watchlist updated successfully!");
        this.retrieveMySeries();
      },
      error => this.setStatusInfo("error", <any>error)
    );
  }

  public retrieveNextAiringEpisode = (series: any) => {
    const today: Date = new Date();
    today.setHours(0, 0, 0, 0);

    if (!!series.wikiLink) {
      const pageRef: string = encodeURIComponent(series.wikiLink.replace("https://en.wikipedia.org/wiki/", ""));
      // Go to the wikipedia page with the list of episodes
      this.appService.searchEpisodes(pageRef).subscribe(
        response => {
          const nextAiringEpisode: any = {
            date: "",
            ep: -1,
            title: "",
            totalEpisodes: -1
          };
          let nextEpIndex: number = -1;
          const tableList: Array<string> = JSON.parse(response).parse.text["*"]
            .replace(/<table class="plainlinks metadata ambox ambox-style ambox-Plot" role="presentation">(?:.|\n)*?<\/table>/g, "")
            .match(/<table class="wikitable plainrowheaders wikiepisodetable[^>]*>(?:.|\n)*?(Directed by)(?:.|\n)*?(Original air date)(?:.|\n)*?<\/table>/g);
          const seasonIndex: number = (series.season <= tableList.length ? series.season : tableList.length) - 1;
          const table: string = tableList && tableList.length > 0 ? tableList[seasonIndex] : "";

          // Next airing episode date
          let nextDates: Array<any> = !!table ? table.match(/(([0-9]+)-([0-9]+)-([0-9]+)){1,}/g) : [];
          if (nextDates && nextDates.length > 0) {
            //// Remove 'extra' date when wikipedia adds more than one date for the first episode (broadcast, online, ...)
            if (table.match("broadcast") && nextDates.length > 1) {
              nextDates.splice(0, 1);
            }

            nextDates.forEach((date: string, i: number) => nextDates[i] = new Date(date).getTime());
            nextDates = nextDates.sort();
            nextAiringEpisode.date = nextDates.find((date: number, index: number) => {
              nextEpIndex = index;
              return today.getTime() <= date;
            });
            if (!nextAiringEpisode.date) {
              nextAiringEpisode.date = nextDates[nextDates.length - 1];
            }
          }

          // Next airing episode title and number
          const nextTitles: Array<any> = !!table ? table.match(/<td class="summary" style="text-align:left">(?:.|\n)*?<\/td>/g) : [];
          if (nextTitles && nextTitles.length > 0) {
            nextAiringEpisode.title = nextEpIndex !== -1 ? nextTitles[nextEpIndex] : nextTitles[nextTitles.length - 1];
            nextAiringEpisode.title = nextAiringEpisode.title
              .replace(/<td class="summary" style="text-align:left">/, "")
              .replace(/<\/td>/, "")
              .replace(/<sup id="cite_ref-(?:.|\n)*?<\/sup>/, "")
              .replace(/<a href="(?:.|\n)*?" title="(?:.|\n)*?">/, "")
              .replace(/<\/a>/, "")
              .replace(/<img alt=(?:.|\n)*?\/>/, "");
            nextAiringEpisode.ep = (nextEpIndex !== -1 ? nextEpIndex + 1 : nextTitles.length - 1).toString();
            nextAiringEpisode.totalEpisodes = nextTitles.length;
          }

          series.nextAiringEpisode = nextAiringEpisode;
        },
        error => this.setStatusInfo("error", <any>error)
      );
    }
  }
}
