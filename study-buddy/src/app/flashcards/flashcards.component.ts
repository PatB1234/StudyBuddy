/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppComponent } from '../app.component';
import { IntrojsService } from '../introjs/introjs.service';
import { MatDialog } from '@angular/material/dialog';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { LoadingService } from '../loading.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatIconModule } from '@angular/material/icon';
import { MatDividerModule } from '@angular/material/divider';
import { MatButtonModule } from '@angular/material/button';
import { DomSanitizer } from '@angular/platform-browser';
import { MatIconRegistry } from '@angular/material/icon';
import { saveAs } from 'file-saver';
import { finalize } from 'rxjs/operators';
@Component({
    selector: 'app-flashcards',
    standalone: true,
    imports: [
        CommonModule,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MatTooltipModule,
        MatDividerModule
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


    constructor(private http: HttpClient, private domSanitizer: DomSanitizer, private matIconRegistry: MatIconRegistry, private loadingService: LoadingService, private introService: IntrojsService) {

        this.matIconRegistry.addSvgIcon(
            'quizlet-logo', // The unique name for your icon
            this.domSanitizer.bypassSecurityTrustResourceUrl('QuizletSVG.svg') // Path to your SVG file
        );
    }

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }
    ngOnInit(): void {

    }

    ngAfterViewInit(): void {

        this.introService.flashcardsFeature();
    }

    //Flaschard Functions
    flip: string = 'inactive';
    front: any = "Click the add button to generate or fetch your cards";
    back: any = "Click the add button to generate or fetch your cards";

    flashcards: any;
    curr_card: any; // Starts at 0
    total_card: any; // Starts at 1 and counts up
    card_num: any; // To display on the frontend
    iconType: any = "add_notes";
    iconMessage: string = "Fetch or generate your flashcards"

    startLoading(message: string): void {
        this.loadingService.start(message);
    }

    stopLoading(): void {
        this.loadingService.stop();
    }
    toggleFlip() {
        this.flip = (this.flip == 'inactive') ? 'active' : 'inactive';
    }

    updateCardStatus(): void {

        this.front = this.flashcards[this.curr_card]['Front']
        this.back = this.flashcards[this.curr_card]['Back']
    }

    fetchFlashcards(message: string = "Generating flashcards...", endpoint: string = "/get_flashcards"): void {
        this.startLoading(message);
        this.http.get(this.URL + endpoint)
            .pipe(finalize(() => this.stopLoading()))
            .subscribe(
                (res: any) => {
                    this.flashcards = res;
                    this.total_card = this.flashcards?.length ?? 0;
                    if (this.total_card > 0) {
                        this.curr_card = 0;
                        this.front = this.flashcards[this.curr_card]['Front']
                        this.back = this.flashcards[this.curr_card]['Back']
                        this.card_num = `1/${this.total_card}`;
                    } else {
                        this.front = "No flashcards available yet.";
                        this.back = "Try generating again in a few moments.";
                        this.card_num = "";
                    }
                },
                (_error: any) => {
                    console.log(_error)
                    this.flashcards = [];
                    this.front = "We could not load flashcards right now.";
                    this.back = "Please try again in a moment.";
                    this.card_num = "";
                    this._snackBar.open("Unable to generate flashcards. Please try again.", "Dismiss");
                }
            )

    }

    flashcardBack(): void {

        if (this.curr_card != 0) {

            this.curr_card -= 1
            this.updateCardStatus()
            this.card_num = `${this.curr_card + 1}/${this.total_card}`;
            this.flip = 'inactive';
        }
    }

    flashcardNext(): void {

        if (this.curr_card < this.total_card - 1) {

            this.curr_card += 1
            this.updateCardStatus()
            this.card_num = `${this.curr_card + 1}/${this.total_card}`;
            this.flip = 'inactive';
        }
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
            : ['We could not reach your clipboard, so nothing was copied. Try the spreadsheet export instead.'];

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

    exportCardsXlsx(): void {

        this.http.get(this.URL + "/export_flashcards/2", { responseType: 'blob' }).subscribe((res: Blob) => {
            this._snackBar.open("Your download is starting", "Dismiss")
            saveAs(res, 'Flashcards.csv')
            this.http.get(this.URL + "/delete_flashcard_request", {}).subscribe((res: any) => {

                console.log(res)
            })
        })
    }

    refreshCards(): void {

        if (this.iconType == "add_notes") {

            this.iconType = "refresh"
            this.iconMessage = "Regenerate your cards"
            this.startLoading("Generating flashcards...");
            this._snackBar.open("Please wait while flashcards generate, this can take a while depending on the size of your notes", "Dismiss")
            this.fetchFlashcards()
        } else {

            this._snackBar.open("Refreshing flashcards...", "Dismiss")
            this.fetchFlashcards("Regenerating fresh flashcards...", "/regenerate_flashcards");
        }

    }
}
