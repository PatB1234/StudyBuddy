/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, DestroyRef, HostListener, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppComponent } from '../app.component';
import { IntrojsService } from '../introjs/introjs.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { saveAs } from 'file-saver';
import { Subject, Subscription, of } from 'rxjs';
import { catchError, concatMap, filter, finalize, map, switchMap } from 'rxjs/operators';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotesService } from '../notes.service';
import { PickNoteComponent } from '../pick-note/pick-note.component';
import { InlineLoaderComponent } from '../inline-loader/inline-loader.component';

interface Flashcard {
    Front: string;
    Back: string;
}

@Component({
    selector: 'app-flashcards',
    standalone: true,
    imports: [
        CommonModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatProgressBarModule,
        MatSlideToggleModule,
        PickNoteComponent,
        InlineLoaderComponent
    ],
    templateUrl: './flashcards.component.html',
    styleUrl: './flashcards.component.css',
    animations: [
        trigger('flipState', [
            state('active', style({
                transform: 'rotateY(179deg)'
            })),
            state('inactive', style({
                transform: 'rotateY(0)'
            })),
            transition('active => inactive', animate('500ms ease-out')),
            transition('inactive => active', animate('500ms ease-in'))
        ])
    ]
})
export class FlashcardsComponent implements OnInit, AfterViewInit {

    constructor(private http: HttpClient, private domSanitizer: DomSanitizer, private matIconRegistry: MatIconRegistry, private introService: IntrojsService) {

        this.matIconRegistry.addSvgIcon(
            'quizlet-logo',
            this.domSanitizer.bypassSecurityTrustResourceUrl('QuizletSVG.svg')
        );
    }

    URL: any = AppComponent.URL;
    notes = inject(NotesService);
    private _snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    private destroyRef = inject(DestroyRef);

    selected: string | null = null;
    flip: string = 'inactive';
    flashcards: Flashcard[] = [];
    curr_card = 0;
    loadingMessage = '';
    private pending?: Subscription;

    known = new Set<string>(); // Fronts of the cards the student knows
    reviewWeak = false;
    revealed = false; // Got it / Still learning wait until the answer has been seen
    private saves = new Subject<{ note: number, known: string[] }>();

    // The cards being studied right now: all of them, or only the weak ones
    get deck(): Flashcard[] {
        return this.reviewWeak ? this.flashcards.filter(card => !this.known.has(card.Front)) : this.flashcards;
    }

    get total_card(): number {
        return this.deck.length;
    }

    get knownCount(): number {
        return this.flashcards.filter(card => this.known.has(card.Front)).length;
    }

    get front(): string {
        if (this.reviewWeak && this.flashcards.length > 0 && this.total_card === 0) {
            return 'You know every card in this deck. Turn off "Review weak cards" to go through them all again.';
        }
        return this.deck[this.curr_card]?.Front ?? 'Your cards will appear here.';
    }

    get back(): string {
        return this.deck[this.curr_card]?.Back ?? '';
    }

    get currentKnown(): boolean {
        const card = this.deck[this.curr_card];
        return !!card && this.known.has(card.Front);
    }

    ngOnInit(): void {
        // Load the deck as soon as there is a note, and again if it changes
        this.notes.selection$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(note => {
                const selected = note?.name ?? null;
                this.selected = selected;
                this.flashcards = [];
                this.known = new Set();
                if (selected) {
                    this.fetchFlashcards();
                }
            });

        // One save at a time, in order, so an older list never lands last.
        // Skipped if the student has since switched notes, as the server saves to the active one
        this.saves.pipe(
            filter(save => save.note === this.notes.selectedId),
            concatMap(save => this.http.post(this.URL + "/set_flashcard_progress", { known: save.known }).pipe(
                catchError(() => {
                    this._snackBar.open("We could not save your progress. It will try again on your next card.", "Dismiss");
                    return of(null);
                })
            )),
            takeUntilDestroyed(this.destroyRef)
        ).subscribe();
    }

    ngAfterViewInit(): void {

        this.introService.flashcardsFeature();
    }

    // Space flips, arrows move. Not while typing, and not on a focused button,
    // which Space already presses
    @HostListener('document:keydown', ['$event'])
    handleShortcut(event: KeyboardEvent): void {
        const target = event.target as HTMLElement | null;
        if (!this.selected || event.ctrlKey || event.metaKey || event.altKey ||
            target?.closest('input, textarea, select, button, a, [contenteditable="true"], .cdk-overlay-container')) {
            return;
        }
        if (event.key === ' ') {
            event.preventDefault();
            this.toggleFlip();
        } else if (event.key === 'ArrowRight') {
            this.flashcardNext();
        } else if (event.key === 'ArrowLeft') {
            this.flashcardBack();
        }
    }

    toggleFlip() {
        if (this.total_card > 0) {
            this.flip = (this.flip == 'inactive') ? 'active' : 'inactive';
            if (this.flip === 'active') {
                this.revealed = true;
            }
        }
    }

    fetchFlashcards(message: string = "Getting your flashcards ready...", endpoint: string = "/get_flashcards"): void {
        // Drop any earlier request so an old deck can't land on a new note
        this.pending?.unsubscribe();
        this.loadingMessage = message;
        this.pending = this.http.get<Flashcard[]>(this.URL + endpoint)
            .pipe(
                // Progress comes after the deck, since a new deck clears it on the server
                switchMap(deck => this.http.get<{ known: string[] }>(this.URL + "/get_flashcard_progress").pipe(
                    catchError(() => of({ known: [] as string[] })),
                    map(progress => ({ deck, progress }))
                )),
                finalize(() => this.loadingMessage = '')
            )
            .subscribe(
                ({ deck, progress }: any) => {
                    this.flashcards = Array.isArray(deck) ? deck : [];
                    this.known = new Set(Array.isArray(progress?.known) ? progress.known : []);
                    this.goTo(0);
                    if (this.flashcards.length === 0) {
                        this._snackBar.open("No flashcards came back for these notes. Try making a new deck.", "Dismiss");
                    }
                },
                (_error: any) => {
                    console.log(_error)
                    this.flashcards = [];
                    this._snackBar.open("Unable to make flashcards. Please try again.", "Dismiss");
                }
            )
    }

    cancelLoading(): void {
        this.pending?.unsubscribe();
        this.loadingMessage = '';
    }

    private goTo(index: number): void {
        this.curr_card = Math.max(0, Math.min(index, this.total_card - 1));
        this.flip = 'inactive';
        this.revealed = false;
    }

    flashcardBack(): void {

        if (this.curr_card > 0) {
            this.goTo(this.curr_card - 1);
        }
    }

    flashcardNext(): void {

        if (this.curr_card < this.total_card - 1) {
            this.goTo(this.curr_card + 1);
        }
    }

    markCard(knowIt: boolean): void {
        const card = this.deck[this.curr_card];
        const note = this.notes.selectedId;
        if (!card || note === null) {
            return;
        }
        const index = this.curr_card;
        const known = new Set(this.known);
        if (knowIt) {
            known.add(card.Front);
        } else {
            known.delete(card.Front);
        }
        this.known = known;
        this.saves.next({ note, known: [...known] });

        // In review mode a known card drops out, so the same index is already the next card
        const leftDeck = this.reviewWeak && knowIt;
        this.goTo(leftDeck ? index : Math.min(index + 1, this.total_card - 1));
    }

    resetProgress(): void {
        const note = this.notes.selectedId;
        const count = this.knownCount;
        if (note === null || count === 0) {
            return;
        }

        const data: ConfirmDialogData = {
            title: 'Reset progress for this deck?',
            lines: [`All ${count} known ${count === 1 ? 'card goes' : 'cards go'} back to still learning.`],
            confirmLabel: 'Reset',
            cancelLabel: 'Cancel',
            confirmIcon: 'restart_alt'
        };

        this.dialog.open(ConfirmDialogComponent, { data, width: '420px' })
            .afterClosed()
            .subscribe(confirmed => {
                // The note may have changed while the dialog was open
                if (!confirmed || this.notes.selectedId !== note) {
                    return;
                }
                this.known = new Set();
                this.saves.next({ note, known: [] });
                this.goTo(0);
            });
    }

    toggleReviewWeak(on: boolean): void {
        this.reviewWeak = on;
        this.goTo(0);
    }

    newDeck(): void {

        this.fetchFlashcards("Making a fresh deck...", "/regenerate_flashcards");
    }

    exportCardsQuizlet(): void {

        this.http.get(this.URL + "/export_flashcards/1").subscribe(
            (res: any) => {
                // Missing on an insecure origin, rejects if refused
                if (!navigator.clipboard?.writeText) {
                    this.showQuizletInstructions(false);
                    return;
                }
                navigator.clipboard.writeText(res).then(
                    () => this.showQuizletInstructions(true),
                    (err) => {
                        console.log("ERROR:", err);
                        this.showQuizletInstructions(false);
                    }
                );
            },
            (error: any) => {
                console.error("Error exporting flashcards:", error);
                this._snackBar.open("We could not export your cards. Please try again.", "Dismiss");
            }
        )
    }

    private showQuizletInstructions(copied: boolean): void {

        const lines = copied
            ? ['Your cards are on the clipboard, ready to paste.']
            : ['We could not reach your clipboard, so nothing was copied. Try the CSV download instead.'];

        lines.push(
            'In Quizlet, open Import.',
            'Set "Between term and definition" to Comma.',
            'Set "Between cards" to Semicolon.'
        );

        if (copied) {
            lines.push('Paste your cards into the box and import.');
        }

        const data: ConfirmDialogData = {
            title: copied ? 'Importing into Quizlet' : 'Nothing was copied',
            lines,
            variant: copied ? 'info' : 'danger',
            confirmLabel: 'Got it'
        };

        this.dialog.open(ConfirmDialogComponent, { data, width: '440px' });
    }

    exportCardsCsv(): void {

        this.http.get(this.URL + "/export_flashcards/2", { responseType: 'blob' }).subscribe(
            (res: Blob) => {
                this._snackBar.open("Your download is starting", "Dismiss")
                // The server deletes its temp file itself now
                saveAs(res, `${this.selected ?? 'Flashcards'} - Flashcards.csv`)
            },
            () => this._snackBar.open("We could not download your cards. Please try again.", "Dismiss")
        )
    }
}
