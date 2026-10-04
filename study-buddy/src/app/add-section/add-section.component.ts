/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';
import { finalize, switchMap } from 'rxjs/operators';
import { AppComponent } from '../app.component';
import { IntrojsService } from '../introjs/introjs.service';
import { MatCardModule } from '@angular/material/card';
import { FormsModule } from '@angular/forms';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatIconModule } from '@angular/material/icon';
import { LoadingService } from '../loading.service';
import { NotesService } from '../notes.service';

const ALLOWED_EXTENSIONS = ['pdf', 'png', 'jpg', 'jpeg'];

// Matches UPLOAD_SUCCSESFUL in Backend/main.py
const UPLOAD_SUCCESS_PREFIX = 'Upload successful';

@Component({
    selector: 'app-add-section',
    standalone: true,
    imports: [MatCardModule, FormsModule, MatCheckboxModule, MatAutocompleteModule, MatIconModule],
    templateUrl: './add-section.component.html',
    styleUrl: './add-section.component.css',
})
export class AddSectionComponent implements AfterViewInit {

    constructor(private http: HttpClient, private introService: IntrojsService, private router: Router, private loadingService: LoadingService) { }

    url: string = AppComponent.URL;
    selectedFile: File | null = null;
    sectionName: string = ''
    isNoteHandwritten: any = 0
    uploading = false;
    dragging = false;
    private _snackBar = inject(MatSnackBar);
    private notes = inject(NotesService);

    onFileSelected(event: any): void {

        this.chooseFile(event.target.files[0] ?? null);
    }

    onDragOver(event: DragEvent): void {
        // Without this the browser opens the file instead of dropping it here
        event.preventDefault();
        this.dragging = true;
    }

    onDrop(event: DragEvent): void {
        event.preventDefault();
        this.dragging = false;
        this.chooseFile(event.dataTransfer?.files[0] ?? null);
    }

    private chooseFile(file: File | null): void {
        if (!file) {
            return;
        }
        // The picker filters by type, but a dropped file doesn't
        const extension = file.name.split('.').pop()?.toLowerCase() ?? '';
        if (!ALLOWED_EXTENSIONS.includes(extension)) {
            this._snackBar.open("That file type isn't supported. Please use a PDF, JPG or PNG.", "Dismiss");
            return;
        }
        this.selectedFile = file;
        if (this.isImage) {
            this.isNoteHandwritten = 0;
        }
    }

    get isImage(): boolean {
        return !!this.selectedFile && /\.(png|jpe?g)$/i.test(this.selectedFile.name);
    }

    matchingSections(): string[] {
        const typed = this.sectionName.trim().toLowerCase();
        return this.notes.sectionNames().filter(name => name.toLowerCase().includes(typed));
    }

    onChange(checked: any): void {

        this.isNoteHandwritten = checked ? 1 : 0
    }

    uploadFile(file: File, sectionName: string, handwritten: any): Observable<any> {

        const formData = new FormData()
        formData.append('file', file)
        formData.append('section_name', sectionName)
        formData.append('handwritten', String(handwritten))
        return this.http.post(this.url + "/add_notes", formData)
    }

    ngAfterViewInit(): void {

        this.introService.addNotesFeature();
    }

    onUpload(): void {

        const file = this.selectedFile;
        const section = this.sectionName.trim();
        if (!file || !section || this.uploading) {
            return;
        }

        // The backend names a note after its file, minus the extension
        const noteName = file.name.replace(/\.[^.]+$/, '');

        this.uploading = true;
        this.loadingService.start("Uploading and reading your notes. This can take a few minutes for a long file.");
        this.uploadFile(file, section, this.isNoteHandwritten)
            .pipe(finalize(() => {
                this.uploading = false;
                this.loadingService.stop();
            }))
            .subscribe(
                response => {
                    const message: string = response?.message ?? '';
                    if (!message.startsWith(UPLOAD_SUCCESS_PREFIX)) {
                        this._snackBar.open(message || "We could not upload that file. Please try again.", "Dismiss", { duration: 10000 });
                        return;
                    }
                    // Select the new notes straight away, then show what can be done with them
                    this.notes.refresh()
                        .pipe(switchMap(() => this.notes.select(noteName)))
                        .subscribe({
                            next: () => {
                                this._snackBar.open(`"${noteName}" is ready to study`, "Dismiss");
                                this.router.navigate(['/home']);
                            },
                            error: () => this.router.navigate(['/home'])
                        });
                },
                error => {
                    console.log(error)
                    this._snackBar.open("We could not upload that file. Check your connection and try again.", "Dismiss", { duration: 10000 });
                }
            );
    }
}
