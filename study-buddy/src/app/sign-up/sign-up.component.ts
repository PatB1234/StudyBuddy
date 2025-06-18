import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { RouterLink, Router } from '@angular/router';

@Component({
    selector: 'app-sign-up',
    standalone: true,
    imports: [

        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        RouterLink,
    ],
    templateUrl: './sign-up.component.html',
    styleUrl: './sign-up.component.css'
})
export class SignUpComponent {

    constructor(private http: HttpClient, private router: Router) { }

    URL: any = AppComponent.URL;
    error: any = "";

    signUpForm = new FormGroup({
        name: new FormControl('', [Validators.required]),
        email: new FormControl('', [Validators.required, Validators.email]),
        password: new FormControl('', [Validators.required]),
    });

    submit() {
        if (this.signUpForm.invalid) {
            return;
        }

        this.http.post(this.URL + "/create_student", this.signUpForm.value).subscribe((res: any) => {
            // RES = 1 Means that user was created
            // RES = 0 Means that user already exists
            if (res == 1) {

                this.error = "User created"
                this.router.navigate(['/login']); // Goes to login, blank path
            } else if (res == 0) {

                this.error = "User with this email already exists"
            }
        })
    }
}
