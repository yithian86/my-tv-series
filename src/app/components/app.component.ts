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
  public errorMessage: string;
  public searchForm: FormGroup;
  public searchResult: any;
  public titleResult: any;
  public dateResult: any;
  public seedersResult: any;
  public sizeResult: any;
  public mySeriesList: Array<any>;
  public currentSeriesIndex: number;

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

    this.retrieveMySeries(true);
  }

  public selectSeries = (series: any, index: number): void => {
    this.currentSeriesIndex = index;
    this.searchForm.controls["inputName"].setValue(series.name);
    this.searchForm.controls["inputSeason"].setValue(series.season);
    this.searchForm.controls["inputEpisode"].setValue(series.episode);
  }

  public hasAlreadyAired = (series): boolean => {
    return series.nextAiringEpisode && series.nextAiringEpisode.ep > series.episode + 1;
  }

  public airsToday = (series: any): boolean => {
    if (series.nextAiringEpisode && series.nextAiringEpisode.date) {
      const seriesDate: Date = new Date(series.nextAiringEpisode.date);
      const today: Date = new Date();
      return today.getDate() === seriesDate.getDate() &&
        today.getMonth() === seriesDate.getMonth() &&
        today.getFullYear() === seriesDate.getFullYear();
    }
  }

  public isFinished = (series: any): boolean => {
    return series.nextAiringEpisode
      && Number(series.episode) === Number(series.nextAiringEpisode.totalEpisodes);
  }


  // ----------------------------------------------- GETTERS AND SETTERS -------------------------------------------------- //
  public getMagnetTitle = (title: string) => title ? title.replace(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=/g, "") : "";

  public getMagnetDate = (date: string) => date ? date.replace("<td class=\"center\" title=\"", "").replace("&nbsp;", "-") : "";

  public getMagnetLink = (dirtyLink: string) => {
    const cleanLink: string = dirtyLink
      .replace("data-nop title=\"Torrent magnet link\" href=\"", "")
      .replace("&dn=", "")
      .substring(0, dirtyLink.length - 3);
    // Remove 'unsafe' string from link and other unwanted crap
    return this.sanitizer.bypassSecurityTrustUrl(cleanLink);
  }

  public getMagnetSeeders = (date: string) => date ? date.replace("<td class=\"green center\">", "") : "";

  public getMagnetSize = (size: string) => size ? size.replace("<td class=\"nobr center\"> ", "").replace("&nbsp;", " ") : "";

  public getSeriesNumberValue = (value: string) => Number(value) < 10 ? "0" + value : value;

  public getNextAiringEpisodeTitle = (series: any): string => {
    if (series.nextAiringEpisode && series.nextAiringEpisode.ep) {
      return `${this.getSeriesNumberValue(series.nextAiringEpisode.ep)} - ${series.nextAiringEpisode.title}`;
    } else {
      return "-";
    }
  }

  public getNextAiringEpisodeDate = (series: any): number => series.nextAiringEpisode && series.nextAiringEpisode.date ? series.nextAiringEpisode.date : -1;

  public getWatchlistClasses = (series: any): any => {
    return {
      "clickable": true,
      "HasAlreadyAired": this.hasAlreadyAired(series),
      "AirsToday": this.airsToday(series),
      "IsFinished": this.isFinished(series)
    };
  }

  public getAiredMessage = (series: any): string => {
    if (this.hasAlreadyAired(series)) {
      return "Aired!";
    } else if (this.airsToday(series)) {
      return "Airs today!";
    } else if (this.isFinished(series)) {
      return "Finished!";
    } else {
      return "";
    }
  }


// ------------------------------------------------------ ACTIONS -------------------------------------------------------- //
public searchBtnAction = (): void => {
    this.errorMessage = undefined;

    // Retrieve input values
    const inputNameString: string = this.searchForm.controls["inputName"].value;

    let inputSeasonString: string = this.searchForm.controls["inputSeason"].value;
    if (Number(inputSeasonString) < 10) {
      inputSeasonString = "0" + inputSeasonString;
    }

    let inputEpisodeString: string = this.searchForm.controls["inputEpisode"].value;
    if (Number(inputEpisodeString) < 10) {
      inputEpisodeString = "0" + inputEpisodeString;
    }

    // Compose search string
    const searchString: string = `${inputNameString} s${inputSeasonString}e${inputEpisodeString}`;
    this.searchTorrents(searchString);
  }


  // --------------------------------------------------- SERVICES ------------------------------------------------------- //
  public retrieveMySeries = (isFirstLoading?: boolean) => {
    this.firebaseService.retrieveMySeries().subscribe(
      response => {
        if (response && response.length > 0) {
          this.mySeriesList = response.sort((a, b) => a.name < b.name ? -1 : 1);
          // console.log(this.mySeriesList);
          // retrieve last aired dates
          this.retrieveNextAiringEpisodes();

          if (isFirstLoading) {
            this.selectSeries(this.mySeriesList[0], 0);
          }
        } else {
          this.errorMessage = "Error retrieving watchlist, or watchlist empty!";
        }
      },
      error => this.errorMessage = <any>error
    );
  }

  public updateMySeries = () => {
    // Update series list
    this.mySeriesList[this.currentSeriesIndex].season = this.searchForm.controls["inputSeason"].value;
    this.mySeriesList[this.currentSeriesIndex].episode = this.searchForm.controls["inputEpisode"].value;

    // Remove unuseful fields from the list before update
    this.mySeriesList.forEach(series => delete series.nextAiringEpisode);

    // Update file
    this.firebaseService.updateMySeries(this.mySeriesList).subscribe(
      response => {
        console.log("Watchlist updated successfully!");
        this.retrieveMySeries();
      },
      error => this.errorMessage = <any>error
    );
  }

  public searchTorrents = (searchString: string) => {
    this.appService.searchTorrents(searchString).subscribe(
      response => {
        this.searchResult = response["_body"].match(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=/g);
        this.titleResult = response["_body"].match(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=[a-zA-Z0-9.+-]*/g);
        this.dateResult = response["_body"].match(/<td class="center" title="[0-9 -]*&nbsp;[0-9]*/g);
        this.seedersResult = response["_body"].match(/<td class="green center">[0-9]*/g);
        this.sizeResult = response["_body"].match(/<td class="nobr center"> [0-9.]*&nbsp;[a-zA-Z]*/g);

        if (!(this.searchResult && this.searchResult.length > 0)) {
          this.errorMessage = "Sorreh! No episodes available.";
        }
      },
      error => this.errorMessage = <any>error
    );
  }

  public retrieveNextAiringEpisodes = () => {
    const today: number = new Date().getTime();

    this.mySeriesList.forEach((series: any) => {
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
            const table: string = tableList && tableList.length > 0  ? tableList[tableList.length - 1] : "";

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
  private getUniqueList = (arr: Array<any>) => {
    return arr.filter((elem, index, self) => index === self.indexOf(elem));
  }

  // TODO: uncomment
  // public hasError = (formControlName: string) => {
  //   return !this.searchForm.controls[formControlName].valid && this.searchForm.controls[formControlName].touched;
  // };
}
