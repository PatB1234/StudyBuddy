import { Component, Renderer2 } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import {MatCardModule} from '@angular/material/card';
import { trigger, state, style, transition, animate } from '@angular/animations';
import { AppComponent } from '../app.component';

@Component({
  selector: 'app-custom-prompt',
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
  templateUrl: './custom-prompt.component.html',
  styleUrl: './custom-prompt.component.css'
})
export class CustomPromptComponent {



	constructor(private http: HttpClient, private renderer: Renderer2) { }

	URL: any = AppComponent.URL;

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
}
