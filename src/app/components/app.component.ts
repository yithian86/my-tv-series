import { Component, OnInit } from "@angular/core";
import { AppService } from "../services/app.service";
import { FirebaseService } from "../services/firebase.service";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-root",
  templateUrl: "../views/app.component.html",
  styleUrls: ["../styles/app.component.css"],
  providers: [AppService, FirebaseService]
})
export class AppComponent implements OnInit {
  public addSeriesForm: FormGroup;
  public searchForm: FormGroup;
  public currentSeriesIndex: number;
  public errorMessage: string;
  public watchList: Array<any>;


  public constructor(
    private formBuilder: FormBuilder,
    private appService: AppService,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.searchForm = new FormGroup({
      inputName: new FormControl("", Validators.required),
      inputSeason: new FormControl("", Validators.required),
      inputEpisode: new FormControl("", Validators.required)
    });

    this.addSeriesForm = new FormGroup({
      inputName: new FormControl("", Validators.required),
      inputWikiLink: new FormControl("", Validators.required)
    });

    this.retrieveMySeries();
  }

  public selectSeries = (index: number): void => {
    this.currentSeriesIndex = index;
    this.searchForm.controls["inputName"].setValue(this.watchList[index].name);
    this.searchForm.controls["inputSeason"].setValue(this.watchList[index].season);
    this.searchForm.controls["inputEpisode"].setValue(this.watchList[index].episode);
  }


  // --------------------------------------------------- SERVICES ------------------------------------------------------- //
  public retrieveMySeries = () => {
    this.firebaseService.retrieveMySeries().subscribe(
      response => {
        if (response && response.length > 0) {
          this.watchList = response.sort((a, b) => a.name < b.name ? -1 : 1);
          // console.log(this.watchList);
          // retrieve last aired dates
          this.retrieveNextAiringEpisodes();
        } else {
          this.errorMessage = "Error retrieving watchlist, or watchlist empty!";
        }
      },
      error => this.errorMessage = <any>error
    );
  }

  public updateMySeries = (updateEpNumbers?: boolean) => {
    // Update series list
    if (updateEpNumbers) {
      this.watchList[this.currentSeriesIndex].season = this.searchForm.controls["inputSeason"].value;
      this.watchList[this.currentSeriesIndex].episode = this.searchForm.controls["inputEpisode"].value;
    }

    // Remove unuseful fields from the list before update
    this.watchList.forEach(series => delete series.nextAiringEpisode);

    // Update file
    this.firebaseService.updateMySeries(this.watchList).subscribe(
      response => {
        console.log("Watchlist updated successfully!");
        this.retrieveMySeries();
      },
      error => this.errorMessage = <any>error
    );
  }

  public retrieveNextAiringEpisodes = () => {
    const today: number = new Date().getTime();

    this.watchList.forEach((series: any) => {
      if (!!series.wikiLink) {
        // Go to the wikipedia page with the list of episodes
        this.appService.searchEpisodes(series.wikiLink).subscribe(
          response => {
            const nextAiringEpisode: any = {
              date: "",
              ep: -1,
              title: "",
              totalEpisodes: -1
            };
            let nextEpIndex: number = -1;
            const tableList: Array<string> = response["_body"]
              .replace(/<table class="plainlinks metadata ambox ambox-style ambox-Plot" role="presentation">(?:.|\n)*?<\/table>/g, "")
              .match(/<table class="wikitable plainrowheaders wikiepisodetable[^>]*>(?:.|\n)*?(Directed by)(?:.|\n)*?(Original air date)(?:.|\n)*?<\/table>/g);
            // const table: string = tableList && tableList.length > 0  ? tableList[tableList.length - 1] : "";
            const seasonIndex: number = (series.season <= tableList.length ? series.season : tableList.length) - 1;
            const table: string = tableList && tableList.length > 0 ? tableList[seasonIndex] : "";

            // Next airing episode date
            let nextDates: Array<any> = !!table ? table.match(/(([0-9]+)-([0-9]+)-([0-9]+)){1,}/g) : [];
            if (nextDates && nextDates.length > 0) {
              nextDates.forEach((date: string, i: number) => nextDates[i] = new Date(date).getTime());
              nextDates = nextDates.sort();
              nextAiringEpisode.date = nextDates.find((date: number, index: number) => {
                nextEpIndex = index;
                return today < date;
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

            // if (series.name === "the walking dead") {
            //   console.log(series.nextAiringTitle);
            //   console.log(response["_body"]);
            //   console.log(nextTitles);
            // }
          },
          error => this.errorMessage = <any>error
        );
      }
    });
  }


  // ----------------------------------------------------- UTILS ------------------------------------------------------- //
  // private getUniqueList = (arr: Array<any>) => {
  //   return arr.filter((elem, index, self) => index === self.indexOf(elem));
  // }

  // TODO: uncomment
  // public hasError = (formControlName: string) => {
  //   return !this.searchForm.controls[formControlName].valid && this.searchForm.controls[formControlName].touched;
  // };
}
