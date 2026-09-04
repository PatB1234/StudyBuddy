/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { AppComponent } from '../app.component';
import { MarkdownModule } from 'ngx-markdown';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../loading.service';
import { finalize } from 'rxjs/operators';

@Component({
    selector: 'app-custom-prompt',
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
        MatCardModule,
        MarkdownModule
    ],
    templateUrl: './custom-prompt.component.html',
    styleUrl: './custom-prompt.component.css'
})
export class CustomPromptComponent {



    constructor(private http: HttpClient, private loadingService: LoadingService) { }

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }
    //Custom Prompt Funcs
    customPromptForm = new FormGroup({
        customPrompt: new FormControl(''),
    });
    result: any = '';

    // Guards against a second request being fired while one is in flight.
    isSubmitting = false;

    onSubmit() {
        if (this.isSubmitting) {
            return;
        }
        if (!this.customPromptForm.value.customPrompt?.trim()) {
            this._snackBar.open("Please type a prompt before submitting.", "Dismiss");
            return;
        }

        this.isSubmitting = true;
        this.loadingService.start("Working through your notes...");
        this.http.post(this.URL + "/custom_prompt", this.customPromptForm.value)
            .pipe(finalize(() => {
                this.isSubmitting = false;
                this.loadingService.stop();
            }))
            .subscribe(
                (res: any) => {
                    this.result = res + "\n-----------------------------------------------------------------\n" + this.result;
                },
                (error: any) => {
                    console.error("Error running custom prompt:", error);
                    this._snackBar.open("We could not run that prompt right now. Please try again.", "Dismiss");
                }
            );
    }
}
