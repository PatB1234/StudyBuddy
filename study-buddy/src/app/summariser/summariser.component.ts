/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, inject, ViewChild, ElementRef } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { MatCardModule } from '@angular/material/card';
import { AppComponent } from '../app.component';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarkdownModule } from 'ngx-markdown';
import { LoadingService } from '../loading.service';
import { finalize } from 'rxjs/operators';
import { firstValueFrom } from 'rxjs';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-summariser',
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
    templateUrl: './summariser.component.html',
    styleUrl: './summariser.component.css'
})
export class SummariserComponent {


    constructor(private http: HttpClient, private loadingService: LoadingService) { }

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }
    //Summariser Funcs
    summary: any = '';
    curr_selected: any = ''
    summariseButton(): void {
        this._snackBar.open("Please wait while we summarise your notes", "Dismiss")
        this.startLoading("Making your summary...")
        this.http.get(this.URL + "/summarise")
            .pipe(finalize(() => this.stopLoading()))
            .subscribe((res: any) => {

                this.summary = res
            })
    }

    // Commands to trigger the loading animation
    startLoading(message: string): void {
        this.loadingService.start(message);
    }

    stopLoading(): void {
        this.loadingService.stop();
    }


    @ViewChild('pdfContent') pdfContent!: ElementRef;

    async downloadPdf() {
        this.startLoading("Converting your notes into a downloadable format...");

        await new Promise(resolve => setTimeout(resolve, 50));

        try {
            const filenameRes: any = await firstValueFrom(
                this.http.post(AppComponent.URL + "/get_currently_selected_note", {})
            ).catch(() => null);

            if (filenameRes && filenameRes !== "-1.txt") {
                this.curr_selected = filenameRes;
            }

            const element = this.pdfContent.nativeElement;
            const canvas = await html2canvas(element, {
                scale: 2,
                useCORS: true,
                backgroundColor: '#ffffff'
            });

            const imgData = canvas.toDataURL('image/jpeg');
            const pdf = new jsPDF('p', 'mm', 'a4');

            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = pageWidth;
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            let heightLeft = imgHeight;
            let position = 0;

            pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
            heightLeft -= pageHeight;

            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'JPEG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            pdf.save(`${this.curr_selected} - StudyBuddy Summary.pdf`);
        } finally {
            this.stopLoading();
        }
    }
}
