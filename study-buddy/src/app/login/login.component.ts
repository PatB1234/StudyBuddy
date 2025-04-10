import {ChangeDetectionStrategy, Component, computed, signal, Renderer2, inject} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import {MatCardModule} from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AppComponent } from '../app.component';
import { MatIcon } from '@angular/material/icon';
import {MatCheckboxModule} from '@angular/material/checkbox';
import {MatSnackBar} from '@angular/material/snack-bar';

export interface Task {
	name: string;
	completed: boolean;
  }

@Component({
	selector: 'app-login',
	standalone: true,
	imports: [
		ReactiveFormsModule,
		MatButtonModule,
		MatFormFieldModule,
		MatInputModule,
		MatCardModule,
		MatIcon,
		MatCheckboxModule
	],
	templateUrl: './login.component.html',
	styleUrl: './login.component.scss',
	changeDetection: ChangeDetectionStrategy.OnPush,

})

export class LoginComponent {


	constructor(private http: HttpClient, private renderer: Renderer2, private router: Router) { }
	readonly task = signal<Task>({
		name: 'Sign Up',
		completed: false,
	  });
	URL: any = AppComponent.URL;
	error: any = "";
	private _snackBar = inject(MatSnackBar);

	openSnackBar(message: string, action: string) {
		this._snackBar.open(message, action);
	  }	

	loginForm = new FormGroup({
		email: new FormControl('', [Validators.required, Validators.email]),
		password: new FormControl('', [Validators.required]),
		name: new FormControl('', [Validators.required])
	});

	update(completed: boolean, index?: number) {
		this.task.update(task => {
		  if (index === undefined) {
			task.completed = completed;
		  }
		  return {...task};
		});
	}
	submit() {
		if (this.loginForm.invalid) {
			return;
		}
		let signUp = this.task().completed;
		let formData = {email: this.loginForm.value.email, 
			password: this.loginForm.value.password, 
			name: this.loginForm.value.name, 
			signUp: signUp}
			
		this.http.post(this.URL + "/check_student_login", formData ).subscribe((res: any) => {
			if (res == 1 || (typeof(res) == 'string')) {
				document.cookie = `token=${res}; SameSite=None; Secure;`;
				this.error = "Login Successful";
				this.router.navigate(['/']);
			} else if (res == 0) {
				this.error = "Incorrect details";
				this._snackBar.open("Incorrect details", "Dismiss");
			} else {

				this.error = res
				this._snackBar.open(res, "Dismiss");

			}

		})
	}
}