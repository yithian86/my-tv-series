import { Component, OnInit } from "@angular/core";
import { AppService } from "../services/app.service";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";
import { DomSanitizer } from "@angular/platform-browser";

@Component({
  selector: "app-root",
  templateUrl: "../views/app.component.html",
  styleUrls: ["../styles/app.component.css"],
  providers: [AppService]
})
export class AppComponent implements OnInit {
  public errorMessage: string;
  public searchForm: FormGroup;
  public searchResult: any;
  public titleResult: any;
  public dateResult: any;
  public seedersResult: any;
  public sizeResult: any;
  public mySeries: Array<any>;

  public constructor(
    private formBuilder: FormBuilder,
    private appService: AppService,
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

  private retrieveMySeries = () => {
    this.appService.retrieveMySeries().subscribe(
      response => {
        this.mySeries = JSON.parse(response["_body"]);
        console.log(this.mySeries);
        this.searchForm.controls["inputName"].setValue(this.mySeries[0].name);
        this.searchForm.controls["inputSeason"].setValue(this.mySeries[0].season);
        this.searchForm.controls["inputEpisode"].setValue(this.mySeries[0].episode);
      }
    );
  }

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
      },
      error => this.errorMessage = <any>error
    );
  }

  public getMagnetLink = (dirtyLink: string) => {
    const cleanLink: string = dirtyLink
      .replace("data-nop title=\"Torrent magnet link\" href=\"", "")
      .replace("&dn=", "")
      .substring(0, dirtyLink.length - 3);
    // Remove 'unsafe' string from link and other unwanted crap
    return this.sanitizer.bypassSecurityTrustUrl(cleanLink);
  }

  public getMagnetTitle = (title: string) => title ? title.replace(/data-nop title=\"Torrent magnet link\" href="magnet:\?[0-9A-Za-z=:]*&dn=/g, "") : "";

  public getMagnetDate = (date: string) => date ? date.replace("<td class=\"center\" title=\"", "").replace("&nbsp;", "-") : "";

  public getMagnetSeeders = (date: string) => date ? date.replace("<td class=\"green center\">", "") : "";

  public getMagnetSize = (size: string) => size ? size.replace("<td class=\"nobr center\"> ", "").replace("&nbsp;", " ") : "";

  // ---------------------------------------------- UTILS ------------------------------------------------------- //
  private getUniqueList = (arr: Array<any>) => {
    return arr.filter((elem, index, self) => index === self.indexOf(elem));
  }

  // TODO: uncomment
  // public hasError = (formControlName: string) => {
  //   return !this.searchForm.controls[formControlName].valid && this.searchForm.controls[formControlName].touched;
  // };
}
