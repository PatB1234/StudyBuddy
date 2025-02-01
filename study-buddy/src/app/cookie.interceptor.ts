import { Injectable } from '@angular/core';
import {
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpInterceptor
} from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable()
export class CookieInterceptor implements HttpInterceptor {
  intercept(request: HttpRequest<unknown>, next: HttpHandler): Observable<HttpEvent<unknown>> {
    // Clone the request and add the cookie header
    const token = document.cookie.split("; ")
      .find((row) => row.startsWith("token="))
      ?.split("=")[1]; // Extract the token from document.cookie
    const modifiedRequest = request.clone({
      withCredentials: true,  // This ensures cookies are sent with cross-origin requests
      setHeaders: token ? { 'token': token } : {}
    });

    return next.handle(modifiedRequest);
  }
}
