import { Injectable } from "@angular/core";
import { Http, Response } from "@angular/http";
import { Observable } from "rxjs";
import "rxjs/Rx";


@Injectable()
export class FirebaseService {
  private baseUrl: string = "https://my-tv-series.firebaseio.com"; // URL to firebase

  // Resolve HTTP using the constructor
  public constructor(private http: Http) {
  }

  public retrieveMySeries(): Observable<any> {
    return this.http.get(`${this.baseUrl}/watching.json`)
      .map((res: Response) => res.json());
  }

  public updateMySeries(seriesList: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/watching.json`, JSON.stringify(seriesList));
  }
}

@Injectable()
export class FirebaseServiceMock {

    // Resolve HTTP using the constructor
  public constructor(private http: Http) {
  }

  public retrieveMySeries(): Observable<any> {
    return this.http.get("../../assets/my-series.json");
  }
}
