import { Component, Renderer2 } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { RouterLink, Router } from '@angular/router';
import { AppComponent } from '../app.component';
@Component({
	selector: 'app-login',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		RouterLink,
	],
	templateUrl: './login.component.html',
	styleUrl: './login.component.scss'
})
export class LoginComponent {


	constructor(private http: HttpClient, private renderer: Renderer2, private router: Router) { }

	URL: any = AppComponent.URL;
	error: any = "";
	
	loginForm = new FormGroup({
		name: new FormControl('', [Validators.required]),
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required]),
	});

	submit() {
		if (this.loginForm.invalid) {
			return;
		}

		this.http.post(this.URL + "/check_student_login", this.loginForm.value ).subscribe((res: any) => {
			console.log(res);
			// RES = 1 Means login was successful
			// RES = 0 Means login was unsuccessful
			if (res == 1) {

				this.error = "Login Successful";
				this.router.navigate(['/']); // Goes to dashboard, blank path
			} else if (res == 0) {

				this.error = "Login Unsuccessful";
			}

		})
	}
}