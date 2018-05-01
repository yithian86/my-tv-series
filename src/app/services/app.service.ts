import { Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs";
import "rxjs/Rx";


@Injectable()
export class AppService {

  // Resolve HTTP using the constructor
  public constructor(private http: Http) {
  }

  public searchTorrents(keyString: string, baseUrl: string): Observable<any> {
    return this.http
      .get(`${baseUrl}${keyString}`)
      .map((res: Response) => res.text());
    // return this.http.get("../../assets/searchTorrent.html").map((res: Response) => res.text());
  }

  public getTorrentPage(url: string): Observable<any> {
    return this.http
      .get(url)
      .map((res: Response) => res.text());
    // return this.http.get("../../assets/torrentPage.html").map((res: Response) => res.text());
  }

  public getTorrentSiteList(): Observable<any> {
    return this.http.get("../../assets/torrentSiteList.json").map((res: Response) => res.json());
  }

  public searchEpisodes(pageRef: string): Observable<any> {
    const url: string = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageRef}&format=json&origin=*&prop=text`;
    return this.http
      .get(url)
      .map((res: Response) => res.text());
  }
}
