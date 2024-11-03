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
	styleUrl: './app.component.css'
})

export class AppComponent{
	title = 'study-buddy';

	customPromptForm = new FormGroup({
		customPrompt: new FormControl(''),
	});
	constructor(private http: HttpClient, private renderer: Renderer2) { }

	URL: any = 'http://127.0.0.1:8000'

	result: any = '';
	onSubmit() {
		this.http.post(this.URL + "/custom_prompt", this.customPromptForm.value).subscribe((res: any) => {
			

			this.result = res + "\n-----------------------------------------------------------------\n" + this.result;
		})	
	}

	summary: any = '';
	summarise_button(): void {

		this.http.get(this.URL + "/summarise").subscribe((res: any) => {

			this.summary = res
		  })
	}

	@ViewChild('question_area') div!: ElementRef;

	questionAnswerForm = new FormGroup({
		questionAnswerForm: new FormControl(''),
	});
	generate_questions(): void {

		this.http.get(this.URL + "/get_questions").subscribe((res: any) => {

			console.log(res['questions'])
			res = res['questions']

			for(let i = 0; i < 1; i++) {
				
				var p: HTMLParagraphElement = this.renderer.createElement('p');
				var textbox = document.createElement('input');
				
				textbox.className = `Question${i}`
				textbox.innerHTML = `<input matInput placeholder="Enter answer here">`

				p.innerHTML = res[i]
				this.renderer.appendChild(this.div.nativeElement, p)
				this.renderer.appendChild(this.div.nativeElement, textbox)
			}
		})
	}

	onQuestionSubmit(): void {

		// finish this pls
		console.log("Submitted")
	}
	
}