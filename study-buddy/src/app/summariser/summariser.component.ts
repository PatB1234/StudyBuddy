/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, DestroyRef, OnInit, inject, ViewChild, ElementRef } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { IntrojsService } from '../introjs/introjs.service';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MarkdownModule } from 'ngx-markdown';
import { KATEX_OPTIONS } from '../katex-options';
import { LoadingService } from '../loading.service';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotesService } from '../notes.service';
import { PickNoteComponent } from '../pick-note/pick-note.component';
import { InlineLoaderComponent } from '../inline-loader/inline-loader.component';

import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

@Component({
    selector: 'app-summariser',
    standalone: true,
    imports: [
        MatIconModule,
        MatButtonModule,
        MarkdownModule,
        PickNoteComponent,
        InlineLoaderComponent
    ],
    templateUrl: './summariser.component.html',
    styleUrl: './summariser.component.css'
})
export class SummariserComponent implements OnInit, AfterViewInit {

    constructor(private http: HttpClient, private loadingService: LoadingService, private introService: IntrojsService) { }

    notes = inject(NotesService);
    private destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        this.notes.selection$
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(note => {
                this.cancelLoading();
                this.curr_selected = note?.name ?? null;
                this.summary = note ? this.notes.getCached<string>('summary', note.id) ?? '' : '';
            });
    }

    ngAfterViewInit(): void {

        this.introService.summariserFeature();
    }

    // Shared so maths renders the same way on every page.
    katexOptions = KATEX_OPTIONS;

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);

    summary: any = '';
    curr_selected: string | null = null;
    loadingMessage = '';
    private pending?: Subscription;

    summariseButton(): void {
        const note = this.notes.selectedId;
        if (note === null) {
            return;
        }
        this.loadingMessage = "Making your summary...";
        this.pending = this.http.get(this.URL + "/summarise")
            .pipe(finalize(() => this.loadingMessage = ''))
            .subscribe(
                (res: any) => {
                    this.summary = res;
                    this.notes.setCached('summary', note, res);
                },
                () => this._snackBar.open("We could not summarise these notes right now. Please try again.", "Dismiss")
            )
    }

    cancelLoading(): void {
        this.pending?.unsubscribe();
        this.loadingMessage = '';
    }

    @ViewChild('pdfContent') pdfContent!: ElementRef;

    async downloadPdf() {
        if (!this.summary) {
            return;
        }
        this.loadingService.start("Converting your summary into a PDF...");

        await new Promise(resolve => setTimeout(resolve, 50));

        try {
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

            pdf.save(`${this.curr_selected} - StuddyBuddy Summary.pdf`);
        } finally {
            this.loadingService.stop();
        }
    }
}
