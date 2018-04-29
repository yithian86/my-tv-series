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
      .get(`${this.baseUrl}/search.php?q=${keyString}`)
      .map((res: Response) => res.text());
  }

  public searchEpisodes(pageRef: string): Observable<any> {
    const url: string = `https://en.wikipedia.org/w/api.php?action=parse&page=${pageRef}&format=json&origin=*&prop=text`;
    return this.http
      .get(url)
      .map((res: Response) => res.text());
  }
}
