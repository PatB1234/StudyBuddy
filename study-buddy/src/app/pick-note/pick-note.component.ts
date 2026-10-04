import { Component, Input, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { NotesService } from '../notes.service';

// Shown wherever a page needs a note and none is selected yet
@Component({
    selector: 'app-pick-note',
    standalone: true,
    imports: [AsyncPipe, RouterLink, MatButtonModule, MatIconModule],
    templateUrl: './pick-note.component.html',
    styleUrl: './pick-note.component.css'
})
export class PickNoteComponent {

    @Input() heading = 'Choose which notes to study';
    @Input() hint = 'Everything on this page is made from the notes you pick.';

    notes = inject(NotesService);
    private snackBar = inject(MatSnackBar);

    choose(name: string): void {
        this.notes.select(name).subscribe({
            error: () => this.snackBar.open('We could not select those notes. Please try again.', 'Dismiss')
        });
    }
}
