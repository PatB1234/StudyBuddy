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
	selector: 'app-root',
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
	templateUrl: './app.component.html',	
	styleUrl: './app.component.css',
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

export class AppComponent implements OnInit{
	title = 'study-buddy';


	constructor(private http: HttpClient, private renderer: Renderer2) { }

	URL: any = 'http://127.0.0.1:8000'

	ngOnInit(): void {
		
		this.getFlashcards()
	}

	//Custom Prompt Funcs
	customPromptForm = new FormGroup({
		customPrompt: new FormControl(''),
	});
	result: any = '';

	onSubmit() {
		this.http.post(this.URL + "/custom_prompt", this.customPromptForm.value).subscribe((res: any) => {
			

			this.result = res + "\n-----------------------------------------------------------------\n" + this.result;
		})	
	}


	//Summariser Funcs
	summary: any = '';
	summarise_button(): void {

		this.http.get(this.URL + "/summarise").subscribe((res: any) => {

			this.summary = res
		  })
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
		
	//Flaschard Functions
	flip: string = 'inactive';
	front: any = "Click next to start";
	back: any = "Click next to start";

	flashcards: any;
	curr_card: any; // Starts at 0
	total_card: any; // Starts at 1 and counts up
	card_num: any; // To display on the frontend
	toggleFlip() {
		this.flip = (this.flip == 'inactive') ? 'active' : 'inactive';
	}
	
	updateCardStatus(): void {

		this.front = this.flashcards[this.curr_card]['Front']
		this.back = this.flashcards[this.curr_card]['Back']
	}

	getFlashcards(): void {
		this.http.get(this.URL + "/get_flashcards").subscribe((res: any) => {

			this.flashcards = res;
			this.total_card = this.flashcards.length;
			this.curr_card = 0;
			this.front = this.flashcards[this.curr_card]['Front']
			this.back = this.flashcards[this.curr_card]['Back']

		})

	}

	flashcardBack(): void {

		if (this.curr_card != 0) {

			this.curr_card -= 1
			this.updateCardStatus()

		}
	}

	flashcardNext(): void {

		if (this.curr_card < this.total_card - 1 ) {

			this.curr_card += 1
			this.updateCardStatus()
		}
	}

}