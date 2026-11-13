import { Component, DestroyRef, EventEmitter, Input, OnInit, Output, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
import { AppComponent } from '../app.component';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressBarModule } from '@angular/material/progress-bar';

// Loading banner inside a page, so the rest of the app stays usable
@Component({
    selector: 'app-inline-loader',
    standalone: true,
    imports: [MatButtonModule, MatProgressBarModule],
    template: `
        <div class="inline-loader" role="status" aria-live="polite">
            <div class="loader-row">
                <span class="loader-text">{{ message }}</span>
                <button mat-button type="button" (click)="cancel.emit()">Cancel</button>
            </div>
            @if (retrying) {
            <p class="loader-retry">The AI is busy, so we are trying again. This can take a little longer.</p>
            }
            <mat-progress-bar mode="indeterminate"></mat-progress-bar>
        </div>
    `,
    styles: `
        .inline-loader {
            margin: 0 0 16px;
            padding: 8px 12px 0;
            border-radius: 10px;
            background: var(--color-surface-alt);
            overflow: hidden;
        }
        .loader-row {
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
        }
        .loader-text {
            font-weight: 500;
            color: var(--color-text);
        }
        .loader-retry {
            margin: 0 0 8px;
            font-size: 0.9em;
            color: var(--color-text);
            opacity: 0.8;
        }
    `
})
// Cancel only stops the wait here. The server still finishes the job
export class InlineLoaderComponent implements OnInit {
    @Input() message = 'Working...';
    @Output() cancel = new EventEmitter<void>();

    retrying = false;
    private http = inject(HttpClient);
    private destroyRef = inject(DestroyRef);
    private platformId = inject(PLATFORM_ID);

    ngOnInit(): void {
        // A timer would stall server rendering
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        // The server retries by itself, so asking is the only way to know
        interval(2000).pipe(
            switchMap(() => this.http.get<{ retrying: boolean }>(AppComponent.URL + '/ai_status')
                .pipe(catchError(() => of({ retrying: false })))),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe(status => this.retrying = !!status?.retrying);
    }
}
