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

	URL: any = 'http://127.0.0.1:8000'

	//Summariser Funcs
	summary: any = '';
	summarise_button(): void {

		this.http.get(this.URL + "/summarise").subscribe((res: any) => {

			this.summary = res
		  })
	}
}
