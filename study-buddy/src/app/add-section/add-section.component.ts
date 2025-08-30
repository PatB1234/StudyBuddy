import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AppComponent } from '../app.component';
import { MatCardModule } from '@angular/material/card';
import { MatLabel } from '@angular/material/form-field';
import { MatFormField } from '@angular/material/form-field';
import { FormsModule } from '@angular/forms';
import { MatIcon } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatButtonModule } from '@angular/material/button';

@Component({
    selector: 'app-add-section',
    standalone: true,
    imports: [MatCardModule, MatLabel, FormsModule, MatFormField, MatIcon, MatCheckboxModule, MatButtonModule],
    templateUrl: './add-section.component.html',
    styleUrl: './add-section.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AddSectionComponent {

    url: string = AppComponent.URL;
    selectedFile: File | null = null;
    sectionName: string = ''
    isNoteHandwritten: any = 0
    private _snackBar = inject(MatSnackBar);


    onFileSelected(event: any): void {

        this.selectedFile = event.target.files[0]

    }

    onChange(checked: any): void {

        if (checked == false) {

            this.isNoteHandwritten = 0
        } else {

            this.isNoteHandwritten = 1
        }
    }
    uploadFile(file: File, sectionName: string, handwritten: any): Observable<any> {

        const formData = new FormData()
        formData.append('file', file)
        formData.append('section_name', sectionName)
        formData.append('handwritten', String(handwritten))
        this._snackBar.open("Please wait while file processes, this can take a few minutes", "Dismiss")
        return this.http.post(this.url + "/add_notes", formData)
    }
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }
    constructor(private http: HttpClient) { }


    onUpload(): void {

        if (this.selectedFile && this.sectionName.trim()) {

            this.uploadFile(this.selectedFile, this.sectionName, this.isNoteHandwritten).subscribe(response => {
                this._snackBar.open(response.message, "Dismiss")
                location.reload()
            }, error => {

                console.log(error)
            });
        }
    }
}
