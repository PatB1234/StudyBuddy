/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject } from '@angular/core';
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
export class FlashcardsComponent implements OnInit {


    constructor(private http: HttpClient, private domSanitizer: DomSanitizer, private matIconRegistry: MatIconRegistry,
    ) {

        this.matIconRegistry.addSvgIcon(
            'quizlet-logo', // The unique name for your icon
            this.domSanitizer.bypassSecurityTrustResourceUrl('QuizletSVG.svg') // Path to your SVG file
        );
    }

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }
    ngOnInit(): void {
        this.startLoading("Generating flashcards...");
        this._snackBar.open("Please wait while flashcards generate, this can take a while depending on the size of your notes", "Dismiss")
        this.fetchFlashcards()
    }

    //Flaschard Functions
    flip: string = 'inactive';
    front: any = "Click next to start";
    back: any = "Click next to start";

    flashcards: any;
    curr_card: any; // Starts at 0
    total_card: any; // Starts at 1 and counts up
    card_num: any; // To display on the frontend
    isLoading = false;
    loadingMessage = "Generating flashcards...";

    startLoading(message: string): void {
        this.loadingMessage = message;
        this.isLoading = true;
    }

    stopLoading(): void {
        this.isLoading = false;
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
        }
    }

    flashcardNext(): void {

        if (this.curr_card < this.total_card - 1) {

            this.curr_card += 1
            this.updateCardStatus()
            this.card_num = `${this.curr_card + 1}/${this.total_card}`;
        }
    }

    exportCardsQuizlet(): void {

        this.http.get(this.URL + "/export_flashcards/1").subscribe((res: any) => {
            console.log(res)
            navigator.clipboard.writeText(res).then(
                () => console.log("Res copied"),
                (err) => console.log("ERROR:", err)
            );
            alert("When importing to quizlet, select Comma & Semicolon under the 'Between term and definition' & 'Between cards' field respectively. The text is in your clipboard, just go to quizlet 'import' and paste it");
        })
    }

    exportCardsXlsx(): void {

        this.http.get(this.URL + "/export_flashcards/2", { responseType: 'blob' }).subscribe((res: Blob) => {
            alert("A download window will pop up after you press 'Ok'")
            saveAs(res, 'Flashcards.csv')
            this.http.get(this.URL + "/delete_flashcard_request", {}).subscribe((res: any) => {

                console.log(res)
            })
        })
    }

    refreshCards(): void {
        this._snackBar.open("Refreshing flashcards...", "Dismiss")
        this.fetchFlashcards("Regenerating fresh flashcards...", "/regenerate_flashcards");
    }
}
