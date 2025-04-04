import { Component, inject } from '@angular/core';
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpClientModule } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppComponent } from '../app.component';
import { response } from 'express';
import {MatCardModule} from '@angular/material/card';
import { MatLabel } from '@angular/material/form-field';
import { MatFormField } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';  
import { MatIcon } from '@angular/material/icon';
import {MatDialog, MatDialogModule} from '@angular/material/dialog';
import {MatSnackBar} from '@angular/material/snack-bar';

@Component({
	selector: 'app-add-section',
	standalone: true,
	imports: [MatCardModule, MatLabel, FormsModule, MatFormField, MatIcon	],
	templateUrl: './add-section.component.html',
	styleUrl: './add-section.component.css'
})
export class AddSectionComponent {

	url: string =  AppComponent.URL;
	selectedFile: File | null = null;
	sectionName: string = ''
	private _snackBar = inject(MatSnackBar);


	onFileSelected(event: any): void {

		this.selectedFile =  event.target.files[0]
		
	}

	uploadFile(file: File, sectionName: string): Observable<any> {

		const formData = new FormData()
		formData.append('file', file)
		formData.append('sectionName', sectionName)
		return this.http.post(this.url + "/add_notes", formData)
	}
	openSnackBar(message: string) {
		this._snackBar.open(message);
	  }	
	  constructor(private http: HttpClient) {}
	  

	onUpload(): void {

		if (this.selectedFile && this.sectionName.trim()) {

			this.uploadFile(this.selectedFile, this.sectionName).subscribe(response => {

				if (response.message != "Upload successful") {
					this._snackBar.open("Upload failed, try again");
				} else {
					this._snackBar.open(response.message);

				}
			}, error => {

				console.log( error)
			});
		}
	}
}
