import { Component, Renderer2, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import { ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import {MatCardModule} from '@angular/material/card';
import { AppComponent } from '../app.component';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
  selector: 'app-summariser',
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
  templateUrl: './summariser.component.html',
  styleUrl: './summariser.component.css'
})
export class SummariserComponent {


  constructor(private http: HttpClient, private renderer: Renderer2) { }

	URL: any = AppComponent.URL;
	private _snackBar = inject(MatSnackBar);
	openSnackBar(message: string, action: string) {
		this._snackBar.open(message, action);
	  }	
	//Summariser Funcs
	summary: any = '';
	summarise_button(): void {
		this._snackBar.open("Please wait while we summarise your notes", "Dismiss")
		this.http.get(this.URL + "/summarise").subscribe((res: any) => {

			this.summary = res
		  })
	}
}
