/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';
import { setTokenCookie } from '../auth-cookie';
import { LegalFooterComponent } from '../legal-footer/legal-footer.component';
import { PRIVACY_URL, TERMS_URL } from '../legal-footer/legal-links';

@Component({
    selector: 'app-login',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatTabsModule,
        LegalFooterComponent
    ],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})

export class LoginComponent {

    constructor(private http: HttpClient, private router: Router) { }

    URL: any = AppComponent.URL;
    tabIndex = 0;
    privacyUrl = PRIVACY_URL;
    termsUrl = TERMS_URL;
    submitting = false;

    private _snackBar = inject(MatSnackBar);

    loginForm = new FormGroup({
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required])
    });

    signUpForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required])
    });

    submitLogin() {
        if (this.loginForm.invalid) {
            return;
        }
        const { email, password } = this.loginForm.value;
        // The endpoint also signs up unknown emails, so give any accidental
        // account a sensible name rather than a blank one
        const name = (email ?? '').split('@')[0];
        this.send({ name, email, password }, false);
    }

    submitSignUp() {
        if (this.signUpForm.invalid) {
            return;
        }
        this.send(this.signUpForm.value, true);
    }

    private send(details: any, signingUp: boolean) {
        this.submitting = true;
        this.http.post(this.URL + "/check_student_login", details).subscribe(
            (res: any) => {
                this.submitting = false;
                // Server replies { token, created }. A bare string is the
                // older shape, still accepted.
                const token = typeof res === 'string' ? res : res?.token;

                if (!token) {
                    this._snackBar.open(signingUp
                        ? "An account already exists for this email and the password does not match. Try logging in instead."
                        : "That email and password do not match. Please try again.", "Dismiss", { duration: 6000 });
                    return;
                }

                setTokenCookie(token);

                // Say which one happened, so a mistyped email doesn't look
                // like a normal sign-in.
                if (res?.created && !signingUp) {
                    this._snackBar.open(`No account existed for ${details.email}, so we created a new one for you.`, "Dismiss", { duration: 8000 });
                } else if (!res?.created && signingUp) {
                    this._snackBar.open("You already have an account, so we logged you in.", "Dismiss");
                } else {
                    this._snackBar.open(signingUp ? "Account created. Welcome!" : "Welcome back!", "Dismiss");
                }

                this.router.navigate(['/home'])
            },
            (error: any) => {
                this.submitting = false;
                console.error("Login failed:", error);
                this._snackBar.open("We could not reach the server. Please try again.", "Dismiss");
            }
        )
    }
}
