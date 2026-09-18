import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import {
    MAT_DIALOG_DATA,
    MatDialogActions,
    MatDialogContent,
    MatDialogRef,
    MatDialogTitle
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';

export interface ConfirmDialogData {
    title: string;
    lines: string[]; // One paragraph each
    confirmLabel: string;
    cancelLabel?: string; // Unset hides the cancel button
    variant?: 'danger' | 'info'; // Defaults to danger
    confirmIcon?: string;
    requirePhrase?: string; // Confirm stays disabled until typed exactly
    holdSeconds?: number; // Confirm stays disabled this long after opening
}

// Confirmations and anything the user has to read
@Component({
    selector: 'app-confirm-dialog',
    standalone: true,
    imports: [
        MatDialogTitle,
        MatDialogContent,
        MatDialogActions,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatIconModule,
        FormsModule
    ],
    templateUrl: './confirm-dialog.component.html',
    styleUrl: './confirm-dialog.component.css'
})
export class ConfirmDialogComponent implements OnInit, OnDestroy {

    private dialogRef = inject(MatDialogRef<ConfirmDialogComponent, boolean>);
    data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);

    typed = '';

    secondsLeft = 0; // Zero once confirm is armed
    private ticker: ReturnType<typeof setInterval> | null = null;

    ngOnInit(): void {
        const hold = this.data.holdSeconds ?? 0;
        if (hold <= 0) {
            return;
        }
        this.secondsLeft = hold;
        this.ticker = setInterval(() => {
            this.secondsLeft -= 1;
            if (this.secondsLeft <= 0) {
                this.secondsLeft = 0;
                this.clearTicker();
            }
        }, 1000);
    }

    ngOnDestroy(): void {
        this.clearTicker();
    }

    private clearTicker(): void {
        if (this.ticker !== null) {
            clearInterval(this.ticker);
            this.ticker = null;
        }
    }

    get isDanger(): boolean {
        return (this.data.variant ?? 'danger') === 'danger';
    }

    get canConfirm(): boolean {
        if (this.secondsLeft > 0) {
            return false;
        }
        if (!this.data.requirePhrase) {
            return true;
        }
        return this.typed.trim() === this.data.requirePhrase;
    }

    confirm(): void {
        if (!this.canConfirm) {
            return;
        }
        this.dialogRef.close(true);
    }

    cancel(): void {
        this.dialogRef.close(false);
    }
}
