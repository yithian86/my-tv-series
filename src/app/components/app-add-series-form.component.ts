import { Component, OnInit, Input } from "@angular/core";
import { FormGroup, FormBuilder, Validators, FormControl } from "@angular/forms";

@Component({
  selector: "app-add-series-form",
  templateUrl: "../views/app-add-series-form.component.html",
  styleUrls: ["../styles/app-add-series-form.component.css"],
  providers: []
})
export class AppAddSeriesFormComponent implements OnInit {
  @Input() uploadWatchlist: Function;
  @Input() addSeriesForm: FormGroup;
  @Input() currentSeriesIndex: number;
  @Input() watchList: Array<any>;


  public constructor(private formBuilder: FormBuilder) { }

  ngOnInit() { }


  // ------------------------------------------------------ ACTIONS -------------------------------------------------------- //
  public addToWatchlist = (): void => {
    const newSeries: any = {
      episode: 1,
      name: this.addSeriesForm.controls["inputName"].value,
      season: 1,
      wikiLink: this.addSeriesForm.controls["inputWikiLink"].value
    };

    // Search for duplicates
    const mySeriesHashList: Array<string> = this.watchList.map(series => this.getSeriesHash(series));
    const newSeriesHash: string = this.getSeriesHash(newSeries);
    const hasSeriesSelected: boolean = this.currentSeriesIndex && this.currentSeriesIndex > -1;

    if (mySeriesHashList.indexOf(newSeriesHash) === -1) {
      let currentSeriesName: string;
      if (hasSeriesSelected) {
        // Retrack the currently selected series (in search bar)
        currentSeriesName = this.watchList[this.currentSeriesIndex].name;
      }

      // Add new series to Watchlist
      this.watchList.push(newSeries);

      // Sort Watchlist
      this.watchList = this.watchList.sort((a, b) => a.name < b.name ? -1 : 1);

      if (hasSeriesSelected) {
        // Restore currently selected series index
        this.currentSeriesIndex = this.watchList.findIndex(series => series.name === currentSeriesName);
      }

      // Reset form
      this.addSeriesForm = new FormGroup({
        inputName: new FormControl("", Validators.required),
        inputWikiLink: new FormControl("", Validators.required)
      });

      console.log("Series added to watchlist!", newSeries);
    } else {
      console.log("Series already in watchlist!", newSeries);
    }

  }


  // ----------------------------------------------------- UTILS ------------------------------------------------------- //
  private getSeriesHash = (series: any) => {
    const sName: string = JSON.stringify(series.name.toLowerCase());
    // const sWikiLink: string = JSON.stringify(series.wikiLink);
    return sName;
  }
}
