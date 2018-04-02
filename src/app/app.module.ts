import { BrowserModule } from "@angular/platform-browser";
import { NgModule } from "@angular/core";
import { FormsModule, ReactiveFormsModule } from "@angular/forms";
import { HttpModule } from "@angular/http";
import { HttpClientModule, HttpClient } from "@angular/common/http";

// Components
import { AppComponent } from "./components/app.component";
import { AppSearchTorrentComponent } from "./components/app-search-torrent.component";
import { AppWatchlistComponent } from "./components/app-watchlist.component";
import { AppAddSeriesFormComponent } from "./components/app-add-series-form.component";


@NgModule({
  declarations: [
    AppComponent,
    AppSearchTorrentComponent,
    AppWatchlistComponent,
    AppAddSeriesFormComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    HttpModule,
    HttpClientModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
