import { APP_INITIALIZER, ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { DisplaySettingsService } from './display-settings.service';
import { provideRouter } from '@angular/router';
import { provideMarkdown } from 'ngx-markdown';
import { routes } from './app.routes';
import { provideClientHydration } from '@angular/platform-browser';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { provideHttpClient, withInterceptorsFromDi } from '@angular/common/http';
import { HTTP_INTERCEPTORS } from '@angular/common/http';
import { CookieInterceptor } from './cookie.interceptor';
import { ErrorInterceptor } from './error.interceptor';
import { MATH_EXTENSION } from './math-extension';
import { MAT_SNACK_BAR_DEFAULT_OPTIONS } from '@angular/material/snack-bar';
import 'katex';
export const appConfig: ApplicationConfig = {
    providers: [
        provideZoneChangeDetection({ eventCoalescing: true }),
        provideRouter(routes),
        provideClientHydration(),
        provideAnimationsAsync(),
        provideHttpClient(withInterceptorsFromDi()),
        {
            provide: HTTP_INTERCEPTORS,
            useClass: CookieInterceptor,
            multi: true
        },
        {

            provide: HTTP_INTERCEPTORS,
            useClass: ErrorInterceptor,
            multi: true
        },
        // Registered here so it claims LaTeX during tokenising, before
        // marked's emphasis rules reach it.
        provideMarkdown({ markedExtensions: [MATH_EXTENSION] }),
        // Messages clear themselves instead of piling up
        { provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: { duration: 3500 } },
        // Before first paint, so the login page gets dark mode too
        {
            provide: APP_INITIALIZER,
            useFactory: (display: DisplaySettingsService) => () => display.init(),
            deps: [DisplaySettingsService],
            multi: true
        }
    ]
};
