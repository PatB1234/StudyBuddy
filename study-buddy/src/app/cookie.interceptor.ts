import { Injectable, inject } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';

@Injectable()
export class CookieInterceptor implements HttpInterceptor {
  private platformId = inject(PLATFORM_ID);

  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    let token: string | undefined;
    
    if (isPlatformBrowser(this.platformId)) {
      token = document.cookie.split("; ")
        .find((row) => row.startsWith("token="))
        ?.split("=")[1];
    }

    const modifiedRequest = request.clone({
      withCredentials: true,
      setHeaders: token ? { 'token': token } : {}
    });

    return next.handle(modifiedRequest);
  }
}
