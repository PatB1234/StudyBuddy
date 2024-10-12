import { Component, OnInit } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import {MatIconModule} from '@angular/material/icon';
import {MatInputModule} from '@angular/material/input';
import {MatFormFieldModule} from '@angular/material/form-field';
import {FormControl, FormGroup, ReactiveFormsModule} from '@angular/forms';
import {MatButtonModule} from '@angular/material/button';
import { Observable } from 'rxjs';
import { HttpHeaders } from '@angular/common/http';
import { HttpClientModule } from '@angular/common/http';
import { HttpClient } from '@angular/common/http';
import { stringify } from 'querystring';

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
		HttpClientModule
			
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
	submitItem(prompt: string){
		const headers = new HttpHeaders({
			'Content-Type': 'application/json'
		});
		// Sending POST request with the item data to the FastAPI endpoint
		this.http.post<any>('http://localhost:8000/custom_prompt', prompt, { headers }).subscribe(
			(response) => {
			  console.log('Item created:', response);
			},
			(error) => {
			  console.error('Error creating item:', error);
			})
		};


	onSubmit() {
		// Send data to FastAPI backend
		// Function to submit item data to FastAPI backend
		let data = (this.customPromptForm.value.customPrompt!);
		this.submitItem(data)
		console.log(data);
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