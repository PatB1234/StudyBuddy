import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map } from 'rxjs/operators'

@Injectable({
  providedIn: 'root'
})
export class HttpSerivceService {

  private URL = 'http://localhost:8000';
  constructor(private http: HttpClient) { }

post_custom_prompt(data: any) {

    return this.http.post(this.URL + "/custom_prompt", data).pipe(map((res:any) => {

        return res
    }))
}
summarise() {

  this.http.get(this.URL + "/summarise").pipe(map((res: any) => {

    return res
  }))
}
}


