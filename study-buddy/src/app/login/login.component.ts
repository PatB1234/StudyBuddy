/* eslint-disable @typescript-eslint/no-explicit-any */
import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { MatIcon } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { setTokenCookie } from '../auth-cookie';

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

    constructor(private http: HttpClient, private router: Router) { }

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

    submit() {
        if (this.loginForm.invalid) {
            return;
        }
        this.http.post(this.URL + "/check_student_login", this.loginForm.value).subscribe(
            (res: any) => {
                // The server now replies { token, created }; a bare string is
                // the older shape and is still accepted.
                const token = typeof res === 'string' ? res : res?.token;

                if (!token) {
                    this._snackBar.open("The details entered does not match the details associated with this email, please try again", "Dismiss");
                    return;
                }

                setTokenCookie(token);
                localStorage.setItem('buttonExplanationCompleted', 'false');
                localStorage.setItem('editUserExplanation', 'false');

                // Spell out which of the two things just happened, so a
                // mistyped email cannot look like a normal sign-in.
                if (res?.created) {
                    this._snackBar.open(`No account existed for ${this.loginForm.value.email}, so we created a new one for you.`, "Dismiss");
                } else {
                    this._snackBar.open("Welcome back! Redirecting...", "Dismiss");
                }

                this.router.navigate(['/home'])
            },
            (error: any) => {
                console.error("Login failed:", error);
                this._snackBar.open("We could not reach the server. Please try again.", "Dismiss");
            }
        )

    }
}