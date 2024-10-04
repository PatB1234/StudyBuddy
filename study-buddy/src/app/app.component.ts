import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';

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
		MatButtonModule
			
	],
	templateUrl: './app.component.html',	
	styleUrl: './app.component.css'
})
export class AppComponent {
	title = 'study-buddy';

	customPromptForm = new FormGroup({
		customPrompt: new FormControl(''),
	});
   
	onSubmit() {
		// Send data to FastAPI backend
		console.log(this.customPromptForm.value.customPrompt);
	}
}

// return this.http.post<any>(this.apiUrl, item, { headers });
// // Function to submit item data to FastAPI backend
//   submitItem(item: { name: string, description: string }): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json'
//     });

//     // Sending POST request with the item data to the FastAPI endpoint
//     return this.http.post<any>(this.apiUrl, item, { headers });
//   }
// Ananthi Balakrishnan
// 12:59 PM
// // Function to submit item data to FastAPI backend
//   submitItem(item: { name: string, description: string }): Observable<any> {
//     const headers = new HttpHeaders({
//       'Content-Type': 'application/json'
//     });

//     // Sending POST request with the item data to the FastAPI endpoint
//     return this.http.post<any>(this.apiUrl, item, { headers });
//   }
// import { FormControl, FormGroup } from '@angular/forms';

//    @Component({
//      selector: 'app-my-form',
//      templateUrl: './my-form.component.html',
//      styleUrls: ['./my-form.component.css']
//    })
//    export class MyFormComponent {
//      myForm = new FormGroup({
//        name: new FormControl(''),
//        email: new FormControl('')
//      });

//      onSubmit() {
//        // Send data to FastAPI backend
//        console.log(this.myForm.value);
//      }
//    }
// Ananthi Balakrishnan
// 1:00 PM
// <form [formGroup]="myForm" (ngSubmit)="onSubmit()">
//      <mat-form-field>
//        <mat-label>Name</mat-label>
//        <input matInput formControlName="name">
//      </mat-form-field>

//      <mat-form-field>
//        <mat-label>Email</mat-label>
//        <input matInput formControlName="email">
//      </mat-form-field>

//      <button mat-raised-button type="submit">Submit</button>
//    </form>