import { Component, OnInit } from '@angular/core';
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
			
	],
	templateUrl: './app.component.html',	
	styleUrl: './app.component.css'
})

export class AppComponent{
	title = 'study-buddy';

	customPromptForm = new FormGroup({
		customPrompt: new FormControl(''),
	});
	constructor(private http: HttpClient) { }

	onSubmit() {
		this.http.post("http://127.0.0.1:8000/custom_prompt", this.customPromptForm.value	).subscribe(() => {})

	}
}