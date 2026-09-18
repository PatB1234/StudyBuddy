/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ReactiveFormsModule, FormControl, FormGroup, Validators } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { take } from 'rxjs/operators';
import { IntrojsService } from '../introjs/introjs.service';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { clearTokenCookie } from '../auth-cookie';

@Component({
    selector: 'app-view-student-profile',
    standalone: true,
    imports: [
        ReactiveFormsModule,
        MatButtonModule,
        MatFormFieldModule,
        MatInputModule,
        MatCardModule,
        MatIconModule,
        MatTooltipModule,
    ],
    templateUrl: './view-student-profile.component.html',
    styleUrl: './view-student-profile.component.css'
})
export class ViewStudentProfileComponent implements OnInit, AfterViewInit {
    constructor(private http: HttpClient, private router: Router, private introService: IntrojsService) { }
    URL: any = AppComponent.URL
    private dialog = inject(MatDialog);
    private _snackBar = inject(MatSnackBar);
    deleting = false;

    ngOnInit(): void {

        this.getStudent();
    }

    // Needs the form rendered, so not ngOnInit
    ngAfterViewInit(): void {

        this.introService.editUserFeature();
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
            const formDetails = this.studentProfileForm.value;
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

    delete_user(): void {

        const data: ConfirmDialogData = {
            title: 'Delete your account?',
            lines: [
                'This permanently deletes your account and every note you have created.',
                'It cannot be undone, and we cannot recover your notes afterwards.'
            ],
            confirmLabel: 'Delete my account',
            cancelLabel: 'Keep my account',
            requirePhrase: 'DELETE',
            holdSeconds: 5
        };

        this.dialog
            .open(ConfirmDialogComponent, { data, width: '440px', disableClose: true })
            .afterClosed()
            .pipe(take(1))
            .subscribe(confirmed => {
                if (!confirmed) {
                    this._snackBar.open('Account deletion cancelled', 'Dismiss');
                    return;
                }
                this.performDelete();
            });
    }

    // Only sign out once the server confirms
    private performDelete(): void {

        this.deleting = true;
        this.http.post(this.URL + "/delete_user", {}).subscribe(
            (response: any) => {
                console.log("Account deletion response:", response);
                clearTokenCookie();
                this._snackBar.open("Account deleted", "Dismiss");
                setTimeout(() => location.assign('/login'), 900);
            },
            (error: any) => {
                console.error("Error deleting account:", error);
                this.deleting = false;
                this._snackBar.open("We could not delete your account. Please try again.", "Dismiss");
            }
        );
    }
}
