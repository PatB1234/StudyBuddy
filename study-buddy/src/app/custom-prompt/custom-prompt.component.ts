import { Component, Renderer2, inject } from '@angular/core';
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
import { AppComponent } from '../app.component';
import { MarkdownModule } from 'ngx-markdown';
import {MatSnackBar} from '@angular/material/snack-bar';

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
		MatCardModule,
		MarkdownModule
  ],
  templateUrl: './custom-prompt.component.html',
  styleUrl: './custom-prompt.component.css'
})
export class CustomPromptComponent {



	constructor(private http: HttpClient, private renderer: Renderer2) { }

	URL: any = AppComponent.URL;
	private _snackBar = inject(MatSnackBar);
	openSnackBar(message: string, action: string) {
		this._snackBar.open(message, action);
	}	
  	//Custom Prompt Funcs
	customPromptForm = new FormGroup({
		customPrompt: new FormControl(''),
	});
	result: any = '';

	onSubmit() {
		this._snackBar.open("Please wait while we process your request", "Dismiss")
		this.http.post(this.URL + "/custom_prompt", this.customPromptForm.value).subscribe((res: any) => {
			

			this.result = res + "\n-----------------------------------------------------------------\n" + this.result;
		})	
	}
}
