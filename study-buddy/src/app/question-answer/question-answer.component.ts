/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, ViewChild, ElementRef, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { AppComponent } from '../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarkdownModule } from 'ngx-markdown';
import { LoadingService } from '../loading.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-question-answer',
    standalone: true,
    imports: [
        RouterOutlet,
        MatSidenavModule,
        MatToolbarModule,
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        MatCardModule,
        MarkdownModule
    ],
    templateUrl: './question-answer.component.html',
    styleUrl: './question-answer.component.css'
})
export class QuestionAnswerComponent {


    constructor(private http: HttpClient, private loadingService: LoadingService) { }

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }

    //Q&A funcs
    @ViewChild('question_area') div!: ElementRef;

    questionAnswerForm = new FormGroup({
        questionAnswer: new FormControl(''),
    });

    question: any;

    correctOrNot: any;
    questionBox: any;

    // Guards against a second request being fired while one is in flight,
    // which is what happens when the model takes a while and the button is
    // clicked again.
    isChecking = false;
    isFetchingQuestion = false;

    onQuestionSubmit(): void {
        if (this.isChecking || !this.question) {
            return;
        }
        if (!this.questionAnswerForm.value.questionAnswer?.trim()) {
            this._snackBar.open("Please type an answer before submitting.", "Dismiss");
            return;
        }

        this.isChecking = true;
        this.loadingService.start("Checking your answer...");
        this.http.post(this.URL + "/check_question", { question: this.question, answer: this.questionAnswerForm.value.questionAnswer })
            .pipe(finalize(() => {
                this.isChecking = false;
                this.loadingService.stop();
            }))
            .subscribe(
                (res: any) => {
                    this.correctOrNot = res;
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
        this.loadingService.start("Finding your next question...");
        this.http.get(this.URL + "/get_questions")
            .pipe(finalize(() => {
                this.isFetchingQuestion = false;
                this.loadingService.stop();
            }))
            .subscribe(
                (res: any) => {
                    this.question = res;
                    this.questionBox = res;
                    this.questionAnswerForm.reset();
                },
                (error: any) => {
                    console.error("Error fetching question:", error);
                    this._snackBar.open("We could not load a question right now. Please try again.", "Dismiss");
                }
            );
    }

}
