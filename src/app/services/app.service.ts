import { Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs";
import "rxjs/Rx";


@Injectable()
export class AppService {
  private baseUrl: string = "https://kickass.cd"; // URL to kickass.cd

  // Resolve HTTP using the constructor
  public constructor(private http: Http) {
  }

  public searchTorrents(keyString: string): Observable<any> {
    return this.http
      .get(`${this.baseUrl}/search.php?q=${keyString}`);
      // .map((res: Response) => res.json());
  }

  public searchEpisodes(url: string): Observable<any> {
    return this.http.get(url);
  }
}
