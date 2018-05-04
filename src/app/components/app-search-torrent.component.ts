import { Component, OnInit, Input, AnimationKeyframe } from "@angular/core";
import { AppService } from "../services/app.service";
import { FirebaseService } from "../services/firebase.service";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-search-torrent",
  templateUrl: "../views/app-search-torrent.component.html",
  styleUrls: ["../styles/app-search-torrent.scss"],
  providers: [AppService, FirebaseService]
})
export class AppSearchTorrentComponent implements OnInit {
  @Input() setStatusInfo: Function;
  @Input() uploadCurrentSeries: Function;
  @Input() currentSeriesIndex: number;
  @Input() searchForm: FormGroup;
  @Input() watchList: Array<any>;

  // Torrent site selector
  public selectedTorrentSite: any;
  public torrentSiteList: Array<any>;
  // Search Results
  public tableData: Array<any>;

  public constructor(
    private formBuilder: FormBuilder,
    private appService: AppService,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {
    this.retrieveTorrentSiteList();

    this.tableData = [];
  }


  // ----------------------------------------------- GETTERS AND SETTERS -------------------------------------------------- //
  public getMagnetTitle = (title: string) => title ? this.getFromRegexRules(title, this.selectedTorrentSite.regex.title.magnet) : "-";

  public getMagnetDate = (date: string) => date ? this.getFromRegexRules(date, this.selectedTorrentSite.regex.date.magnet).replace("&nbsp;", "-") : "-";

  public getMagnetLink = (dirtyLink: string) => {
    const cleanLink: string = this.getFromRegexRules(dirtyLink, this.selectedTorrentSite.regex.link.magnet);

    if (this.selectedTorrentSite.hasTorrentPage) {
      return cleanLink;
    } else {
      // Remove 'unsafe' string from link and other unwanted crap
      return this.sanitizer.bypassSecurityTrustUrl(cleanLink);
    }
  }

  public getMagnetSeeders = (date: string) => date ? this.getFromRegexRules(date, this.selectedTorrentSite.regex.seeders.magnet) : "-";

  public getMagnetSize = (size: string) => size ? this.getFromRegexRules(size, this.selectedTorrentSite.regex.size.magnet).replace("&nbsp;", " ") : "-";


  // ------------------------------------------------------ ACTIONS -------------------------------------------------------- //
  public searchBtnAction = (): void => {
    this.setStatusInfo(undefined);

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
  public retrieveTorrentSiteList = (): void => {
    this.appService.getTorrentSiteList().subscribe(
      response => {
        this.torrentSiteList = response;

        this.selectedTorrentSite = this.torrentSiteList[0];
      },
      error => this.setStatusInfo("error", <any>error)
    );
  }

  public searchTorrents = (searchString: string): void => {
    this.setStatusInfo("info", "Search Torrent: progress...");
    this.tableData = [];

    this.appService.searchTorrents(searchString, this.selectedTorrentSite.url).subscribe(
      response => {
        this.buildTableData(response);

        if (this.tableData && this.tableData.length > 0) {
          this.setStatusInfo("success", "Search Torrent: completed");
        }
      },
      error => this.setStatusInfo("error", <any>error)
    );
  }

  public openLinkFromTorrentPage = (url: string): any => {
    this.setStatusInfo("info", "Getting torrent page: progress...");

    this.appService.getTorrentPage(url).subscribe(
      response => {
        const link: string = this.getFromRegexRules(response, this.selectedTorrentSite.regex.link.pageMagnet);
        // Remove 'unsafe' string from link and other unwanted crap
        const cleanLink: any = this.sanitizer.bypassSecurityTrustUrl(link);
        // Open link
        window.open(cleanLink.changingThisBreaksApplicationSecurity);
      },
      error => this.setStatusInfo("error", <any>error)
    );
  }

  // ---------------------------------------------------- TABLE --------------------------------------------------------- //
  private buildTableData = (response: any) => {
    let tableEntry: any = {};

    const linkResults: Array<string> = this.getFromRegexRules(response, this.selectedTorrentSite.regex.link.results);
    const titleResults: Array<string> = this.getFromRegexRules(response, this.selectedTorrentSite.regex.title.results);
    const dateResults: Array<string> = this.getFromRegexRules(response, this.selectedTorrentSite.regex.date.results);
    const seedersResults: Array<string> = this.getFromRegexRules(response, this.selectedTorrentSite.regex.seeders.results);
    const sizeResults: Array<string> = this.getFromRegexRules(response, this.selectedTorrentSite.regex.size.results);

    if (linkResults && linkResults.length > 0) {
      linkResults.forEach((result: any, index: number) => {
        if (dateResults && dateResults.length > 0) {
          tableEntry.date = this.getMagnetDate(dateResults[index]);
        }

        tableEntry.link = this.getMagnetLink(result);

        if (seedersResults && seedersResults.length > 0) {
          tableEntry.seeders = this.getMagnetSeeders(seedersResults[index]);
        }

        if (sizeResults && sizeResults.length > 0) {
          tableEntry.size = this.getMagnetSize(sizeResults[index]);
        }

        if (titleResults && titleResults.length > 0) {
          tableEntry.title = this.getMagnetTitle(titleResults[index]);
        }

        this.tableData.push(tableEntry);
        tableEntry = {};
      });
    } else {
      this.setStatusInfo("error", "Search Torrent: an error occurred while building table! Probably torrent site is down or something.");
    }
  }

  private getFromRegexRules = (element: string, stringRules: Array<any>): any => {
    let result: any = element;
    stringRules.forEach(e => {
      switch (e.rule) {
        case "match":
          result = result.match(new RegExp(e.reg, "g"));
          break;

        case "matchJoin":
          result = result.match(new RegExp(e.reg, "g"))[0];
          break;

        case "replace":
          result = result.replace(new RegExp(e.reg, "g"), "");
          break;

        case "replaceWith":
          result = result.replace(new RegExp(e.reg, "g"), e.replaceWith);
          break;
      }
    });

    return result;
  }
}
