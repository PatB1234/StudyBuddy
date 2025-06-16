import { Component, OnInit } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { take } from 'rxjs/operators';

@Component({
    selector: 'app-view-student-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
    ],
    templateUrl: './view-student-profile.component.html',
    styleUrl: './view-student-profile.component.css'
})
export class ViewStudentProfileComponent implements OnInit {
    constructor(private http: HttpClient) { }
    URL: any = AppComponent.URL

    ngOnInit(): void {

        this.getStudent()
    }

    nameView = 'name';
    emailView = 'email';
    error = '';

    studentProfileForm = new FormGroup({
        name: new FormControl(''),
        oldPassword: new FormControl('', [Validators.required]),
        newPassword: new FormControl(''),
    });
    submit() {
        if (this.studentProfileForm.invalid) {
            return;
        } else {
            let formDetails = this.studentProfileForm.value;
            this.http.post(this.URL + "/edit_user", { newName: formDetails.name, email: this.emailView, oldPassword: formDetails.oldPassword, newPassword: formDetails.newPassword }).subscribe((res: any) => {
                // RES = 1 Means that user edit was successful
                // RES = 0 Either the user was not found or the details entered did not match
                if (res == 0) {

                    this.error = "Details incorrect, try again"
                } else if (res == 1) {

                    this.error = "Successful"
                }
            })
        }
    }

    getStudent() {
        this.http.get(this.URL + "/get_student_credentials")
            .pipe(take(1))
            .subscribe((res: any) => {
                this.nameView = res['name'];
                this.emailView = res['email'];
            });
    }
}
