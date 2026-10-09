/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, DestroyRef, OnInit, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { IntrojsService } from '../introjs/introjs.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarkdownModule } from 'ngx-markdown';
import { KATEX_OPTIONS } from '../katex-options';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotesService } from '../notes.service';
import { PickNoteComponent } from '../pick-note/pick-note.component';
import { InlineLoaderComponent } from '../inline-loader/inline-loader.component';

@Component({
    selector: 'app-question-answer',
    standalone: true,
    imports: [
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        MarkdownModule,
        PickNoteComponent,
        InlineLoaderComponent
    ],
    templateUrl: './question-answer.component.html',
    styleUrl: './question-answer.component.css'
})
export class QuestionAnswerComponent implements OnInit, AfterViewInit {

    constructor(private http: HttpClient, private introService: IntrojsService) { }

    notes = inject(NotesService);
    private destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        // A question is ready on arrival, and a new one comes with new notes
        this.notes.selection$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(note => {
                // A question about the old notes shouldn't show under the new ones
                this.cancelLoading();
                const selected = note?.name ?? null;
                this.selected = selected;
                this.question = '';
                this.correctOrNot = '';
                this.right = 0;
                this.answered = 0;
                if (selected) {
                    this.nextQuestion();
                }
            });
    }

    ngAfterViewInit(): void {

        this.introService.questionAnswerFeature();
    }

    // Shared so maths renders the same way on every page.
    katexOptions = KATEX_OPTIONS;

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);

    questionAnswerForm = new FormGroup({
        questionAnswer: new FormControl(''),
    });

    selected: string | null = null;
    question: any = '';
    correctOrNot: any = '';
    loadingMessage = '';
    private pending?: Subscription;

    // Session score, marked by the student after reading the feedback
    right = 0;
    answered = 0;
    marked = false;
    gaveUp = false;

    // Guards against a second request being fired while one is in flight.
    isChecking = false;
    isFetchingQuestion = false;

    onQuestionSubmit(): void {
        if (!this.questionAnswerForm.value.questionAnswer?.trim()) {
            this._snackBar.open("Please type an answer before submitting.", "Dismiss");
            return;
        }
        this.check(this.questionAnswerForm.value.questionAnswer, false);
    }

    // The marker explains the right answer when told the student doesn't know
    showAnswer(): void {
        this.check("I don't know", true);
    }

    markAnswer(gotItRight: boolean): void {
        if (this.marked) {
            return;
        }
        this.marked = true;
        this.answered += 1;
        if (gotItRight) {
            this.right += 1;
        }
    }

    private check(answer: string, gaveUp: boolean): void {
        if (this.isChecking || !this.question) {
            return;
        }

        this.isChecking = true;
        this.loadingMessage = gaveUp ? "Getting the answer..." : "Checking your answer...";
        this.pending = this.http.post(this.URL + "/check_question", { question: this.question, answer })
            .pipe(finalize(() => {
                this.isChecking = false;
                this.loadingMessage = '';
            }))
            .subscribe(
                (res: any) => {
                    this.correctOrNot = res;
                    // Giving up counts as wrong, so there is nothing to self-mark
                    if (gaveUp && !this.marked) {
                        this.markAnswer(false);
                    }
                    this.gaveUp = gaveUp;
                },
                (error: any) => {
                    console.error("Error checking answer:", error);
                    this._snackBar.open("We could not check your answer right now. Please try again.", "Dismiss");
                }
            );
    }

    nextQuestion(): void {
        if (this.isFetchingQuestion) {
            return;
        }

        this.isFetchingQuestion = true;
        this.correctOrNot = "";
        this.marked = false;
        this.gaveUp = false;
        this.loadingMessage = "Finding your next question...";
        this.pending = this.http.get(this.URL + "/get_questions")
            .pipe(finalize(() => {
                this.isFetchingQuestion = false;
                this.loadingMessage = '';
            }))
            .subscribe(
                (res: any) => {
                    this.question = res;
                    this.questionAnswerForm.reset();
                },
                (error: any) => {
                    console.error("Error fetching question:", error);
                    this._snackBar.open("We could not load a question right now. Please try again.", "Dismiss");
                }
            );
    }

    cancelLoading(): void {
        this.pending?.unsubscribe();
    }
}
