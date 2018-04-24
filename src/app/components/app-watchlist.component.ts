import { Component, OnInit, Input } from "@angular/core";
import { FirebaseService } from "../services/firebase.service";

@Component({
  selector: "app-watchlist",
  templateUrl: "../views/app-watchlist.component.html",
  styleUrls: ["../styles/app-watchlist.component.css"],
  providers: [FirebaseService]
})
export class AppWatchlistComponent implements OnInit {
  @Input() selectSeries: Function;
  @Input() triggerError: Function;
  @Input() watchList: Array<any>;


  public constructor(private firebaseService: FirebaseService) { }

  ngOnInit() { }

  // ----------------------------------------------- GETTERS AND SETTERS -------------------------------------------------- //
  public getSeriesNumberValue = (value: string) => Number(value) < 10 ? "0" + value : value;

  public getWatchlistClasses = (series: any): any => {
    return {
      "clickable": !this.isFinished(series),
      "HasAlreadyAired": this.hasAlreadyAired(series),
      "AirsToday": this.airsToday(series),
      "IsFinished": this.isFinished(series)
    };
  }

  public getAiredMessage = (series: any): string => {
    if (this.hasAlreadyAired(series)) {
      return "Aired!";
    } else if (this.airsToday(series)) {
      return "Today!";
    } else if (this.isFinished(series)) {
      return "Finished!";
    } else {
      return "";
    }
  }

  public getNextAiringEpisodeTitle = (series: any): string => {
    if (series.nextAiringEpisode && series.nextAiringEpisode.ep) {
      return `${this.getSeriesNumberValue(series.nextAiringEpisode.ep)} - ${series.nextAiringEpisode.title}`;
    } else {
      return "-";
    }
  }

  public getNextAiringEpisodeDate = (series: any): number => series.nextAiringEpisode && series.nextAiringEpisode.date ? series.nextAiringEpisode.date : undefined;

  // ----------------------------------------------- SERIES STATUS CHECKERS -------------------------------------------------- //
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

  // ----------------------------------------------- OTHER STUFF -------------------------------------------------- //
  public removeSeries = (seriesIndex: number): void => {
    console.log("Removing: ", this.watchList[seriesIndex]);
    this.watchList.splice(seriesIndex, 1);
    // this.firebaseService.deleteSeries(seriesIndex).subscribe(
    //   response => {
    //     console.log("Series removed successfully!", this.watchList);
    //   },
    //   error => this.triggerError(<any>error)
    // );
  }
}
