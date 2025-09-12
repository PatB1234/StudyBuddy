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


    constructor(private http: HttpClient) { }

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

    onQuestionSubmit(): void {
        this._snackBar.open("Please wait a few minutes while we check your answer to this question", "Dismiss")
        this.http.post(this.URL + "/check_question", { question: this.question, answer: this.questionAnswerForm.value.questionAnswer }).subscribe((res: any) => {

            this.correctOrNot = res;
        })
    }

    nextQuestion(): void {
        this.correctOrNot = ""
        this._snackBar.open("Please wait a few minutes while we generate a bank of questions", "Dismiss")
        this.http.get(this.URL + "/get_questions").subscribe((res: any) => {

            this.question = res;
            this.questionBox = res;
        })
    }

}
