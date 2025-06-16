import { Injectable } from '@angular/core';
import {
    HttpRequest,
    HttpHandler,
    HttpEvent,
    HttpInterceptor,
    HttpErrorResponse
} from '@angular/common/http';
import { Observable } from 'rxjs';
import { Router, ActivatedRoute } from '@angular/router';
import { tap } from 'rxjs/operators';
@Injectable()
export class ErrorInterceptor implements HttpInterceptor {

    constructor(private router: Router, private route: ActivatedRoute) { }
    getChildRoute(route: ActivatedRoute): ActivatedRoute {
        while (route.firstChild) {
            route = route.firstChild;
        }
        return route;
    }
    intercept(request: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {

        const modifiedRequest = request.clone({
            headers: request.headers.set('X-Requested-With', 'XMLHttpRequest'),
            withCredentials: true
        });


        return next.handle(modifiedRequest).pipe(tap(() => { }, (err: any) => {

            if (err instanceof HttpErrorResponse) {

                if (err.status != 401) {

                    return;
                }

                this.router.navigate(['/login']);
            }
        }));
    }
}
