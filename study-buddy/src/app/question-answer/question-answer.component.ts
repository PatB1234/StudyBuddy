import { Component, OnInit, Renderer2, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import { HttpSerivceService } from './http-service.service';
import { HttpClient } from '@angular/common/http';
import {MatCardModule} from '@angular/material/card';
import { trigger, state, style, transition, animate } from '@angular/animations';


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
		MatCardModule
  ],
  templateUrl: './question-answer.component.html',
  styleUrl: './question-answer.component.css'
})
export class QuestionAnswerComponent {


  constructor(private http: HttpClient, private renderer: Renderer2) { }

	URL: any = 'http://127.0.0.1:8000'


	//Q&A funcs
	@ViewChild('question_area') div!: ElementRef;

	questionAnswerForm = new FormGroup({
		questionAnswer: new FormControl(''),
	});

	question: any;

	correctOrNot: any;
	questionBox: any;

	onQuestionSubmit(): void {

		this.http.post(this.URL + "/check_question", {question: this.question, answer: this.questionAnswerForm.value.questionAnswer}).subscribe((res: any) => {

			this.correctOrNot = res;
		}) 
	}

	nextQuestion(): void {
		this.correctOrNot = ""
		this.http.get(this.URL + "/get_questions").subscribe((res: any) => {

			this.question = res;
			this.questionBox = res;
		})	}
		
}
