import { Component, EventEmitter, Input, Output } from '@angular/core';
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
    `
})
// Cancel only stops the wait here. The server still finishes the job
export class InlineLoaderComponent {
    @Input() message = 'Working...';
    @Output() cancel = new EventEmitter<void>();
}
