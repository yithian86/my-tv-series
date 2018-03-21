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

  public retrieveMySeries(): Observable<any> {
    return this.http.get("../../assets/my-series.json");
  }

  public retrieveMySeries2(): Observable<any> {
    let customHeaders: Headers = new Headers();
    customHeaders.append('cookie', 'A1.2.2029547319.1521585042; _gid=GA1.2.3266463.1521585042; mp_d0e68f55195f612cc4f7f1f42123d680_mixpanel=%7B%22distinct_id%22%3A%20%2216245893d3c8f-0a36ef3a00421d-3e3d5f01-1fa400-16245893d3d3a1%22%2C%22%24search_engine%22%3A%20%22google%22%2C%22%24initial_referrer%22%3A%20%22https%3A%2F%2Fwww.google.it%2F%22%2C%22%24initial_referring_domain%22%3A%20%22www.google.it%22%7D; mp_mixpanel__c=19; push_mobile_mode=2; _gat=1; symfony=f761679569cc581b53ac0e135ac83a04; tvstRemember=6uqumxhrgdk48cs0ksokw8okgkc8ks8');
    return this.http.get("https://www.tvtime.com/en", {headers: customHeaders});
  }
}
