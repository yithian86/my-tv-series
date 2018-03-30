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

    this.retrieveMySeries();
  }

  public selectSeries = (series: any, index: number): void => {
    this.currentSeriesIndex = index;
    this.searchForm.controls["inputName"].setValue(series.name);
    this.searchForm.controls["inputSeason"].setValue(series.season);
    this.searchForm.controls["inputEpisode"].setValue(series.episode);
  }

  public getMagnetLink = (dirtyLink: string) => {
    const cleanLink: string = dirtyLink
      .replace("data-nop title=\"Torrent magnet link\" href=\"", "")
      .replace("&dn=", "")
      .substring(0, dirtyLink.length - 3);
    // Remove 'unsafe' string from link and other unwanted crap
    return this.sanitizer.bypassSecurityTrustUrl(cleanLink);
  }


  // ----------------------------------------------- GETTERS AND SETTERS -------------------------------------------------- //
  public getMagnetTitle = (title: string) => title ? title.replace(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=/g, "") : "";

  public getMagnetDate = (date: string) => date ? date.replace("<td class=\"center\" title=\"", "").replace("&nbsp;", "-") : "";

  public getMagnetSeeders = (date: string) => date ? date.replace("<td class=\"green center\">", "") : "";

  public getMagnetSize = (size: string) => size ? size.replace("<td class=\"nobr center\"> ", "").replace("&nbsp;", " ") : "";


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
  public retrieveMySeries = () => {
    this.firebaseService.retrieveMySeries().subscribe(
      response => {
        if (response && response.length > 0) {
          this.mySeriesList = response.sort((a, b) => a.name < b.name ? -1 : 1);
          console.log(this.mySeriesList);
          this.selectSeries(this.mySeriesList[0], 0);
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
        // this.response = response["_body"];
        // this.searchResult = response["_body"].match(/magnet: ?.*&dn/g);
        this.searchResult = response["_body"].match(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=/g);
        this.titleResult = response["_body"].match(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=[a-zA-Z0-9.+-]*/g);
        this.dateResult = response["_body"].match(/<td class="center" title="[0-9 -]*&nbsp;[0-9]*/g);
        this.seedersResult = response["_body"].match(/<td class="green center">[0-9]*/g);
        this.sizeResult = response["_body"].match(/<td class="nobr center"> [0-9.]*&nbsp;[a-zA-Z]*/g);
        // const tableSection: string = response["_body"]
        //   .replace(/\r?\n|\r/g, "");
        // .match(/<tr class="odd" id="torrent_latest_torrents.*<\/tr>/g);
        // this.response = tableSection;
        // console.log(this.response);

        if (!(this.searchResult && this.searchResult.length > 0)) {
          this.errorMessage = "Sorreh! No episodes available.";
        }
      },
      error => this.errorMessage = <any>error
    );
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
