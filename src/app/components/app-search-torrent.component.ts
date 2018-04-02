import { Component, OnInit, Input } from "@angular/core";
import { AppService } from "../services/app.service";
import { FirebaseService } from "../services/firebase.service";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-search-torrent",
  templateUrl: "../views/app-search-torrent.component.html",
  styleUrls: ["../styles/app-search-torrent.component.css"],
  providers: [AppService, FirebaseService]
})
export class AppSearchTorrentComponent implements OnInit {
  @Input() triggerError: Function;
  @Input() updateMySeries: Function;
  @Input() currentSeriesIndex: number;
  @Input() searchForm: FormGroup;
  @Input() watchList: Array<any>;

  public searchResult: any;
  public titleResult: any;
  public dateResult: any;
  public seedersResult: any;
  public sizeResult: any;

  public constructor(
    private formBuilder: FormBuilder,
    private appService: AppService,
    private firebaseService: FirebaseService,
    private sanitizer: DomSanitizer
  ) { }

  ngOnInit() {}


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


  // ------------------------------------------------------ ACTIONS -------------------------------------------------------- //
  public searchBtnAction = (): void => {
    this.triggerError(undefined);

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
  public searchTorrents = (searchString: string) => {
    this.appService.searchTorrents(searchString).subscribe(
      response => {
        this.searchResult = response["_body"].match(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=/g);
        this.titleResult = response["_body"].match(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=[a-zA-Z0-9.+-]*/g);
        this.dateResult = response["_body"].match(/<td class="center" title="[0-9 -]*&nbsp;[0-9]*/g);
        this.seedersResult = response["_body"].match(/<td class="green center">[0-9]*/g);
        this.sizeResult = response["_body"].match(/<td class="nobr center"> [0-9.]*&nbsp;[a-zA-Z]*/g);

        if (!(this.searchResult && this.searchResult.length > 0)) {
          this.triggerError("Sorreh! No episodes available.");
        }
      },
      error => this.triggerError(<any>error)
    );
  }
}
