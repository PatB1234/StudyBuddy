/* eslint-disable @typescript-eslint/no-explicit-any */
import { AfterViewInit, Component, DestroyRef, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { HttpClient } from '@angular/common/http';
import { AppComponent } from '../app.component';
import { IntrojsService } from '../introjs/introjs.service';
import { MarkdownModule } from 'ngx-markdown';
import { KATEX_OPTIONS } from '../katex-options';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, finalize } from 'rxjs/operators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { NotesService } from '../notes.service';
import { PickNoteComponent } from '../pick-note/pick-note.component';
import { InlineLoaderComponent } from '../inline-loader/inline-loader.component';

interface Exchange {
    question: string;
    answer: string;
}

@Component({
    selector: 'app-custom-prompt',
    standalone: true,
    imports: [
        MatIconModule,
        MatFormFieldModule,
        MatInputModule,
        ReactiveFormsModule,
        MatButtonModule,
        MarkdownModule,
        PickNoteComponent,
        InlineLoaderComponent
    ],
    templateUrl: './custom-prompt.component.html',
    styleUrl: './custom-prompt.component.css'
})
export class CustomPromptComponent implements OnInit, AfterViewInit {

    constructor(private http: HttpClient, private introService: IntrojsService) { }

    notes = inject(NotesService);
    private destroyRef = inject(DestroyRef);

    ngOnInit(): void {
        // Each note keeps its own conversation for the session
        this.notes.selected$
            .pipe(distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
            .subscribe(selected => {
                this.cancelLoading();
                this.selected = selected;
                this.conversation = selected ? this.notes.getCached<Exchange[]>('conversation', selected) ?? [] : [];
            });
    }

    ngAfterViewInit(): void {

        this.introService.customPromptFeature();
    }

    // Shared so maths renders the same way on every page.
    katexOptions = KATEX_OPTIONS;

    URL: any = AppComponent.URL;
    private _snackBar = inject(MatSnackBar);

    @ViewChild('conversationEnd') conversationEnd?: ElementRef<HTMLElement>;
    @ViewChild('promptInput') promptInput?: ElementRef<HTMLTextAreaElement>;

    suggestions = [
        'Explain this simply',
        'List the key definitions',
        "What's likely to come up in an exam?",
        'Make me a mind map',
        'Test me on this with three questions'
    ];

    // Fills the box rather than sending, so it can be edited first
    useSuggestion(text: string): void {
        this.customPromptForm.setValue({ customPrompt: text });
        this.promptInput?.nativeElement.focus();
    }

    customPromptForm = new FormGroup({
        customPrompt: new FormControl(''),
    });
    selected: string | null = null;
    conversation: Exchange[] = [];
    loadingMessage = '';
    private pending?: Subscription;

    // Guards against a second request being fired while one is in flight.
    isSubmitting = false;

    onSubmit() {
        const note = this.selected;
        const question = this.customPromptForm.value.customPrompt?.trim();
        if (this.isSubmitting || !note) {
            return;
        }
        if (!question) {
            this._snackBar.open("Please type a question before sending.", "Dismiss");
            return;
        }

        this.isSubmitting = true;
        this.loadingMessage = "Working through your notes...";
        this.pending = this.http.post(this.URL + "/custom_prompt", { customPrompt: question })
            .pipe(finalize(() => {
                this.isSubmitting = false;
                this.loadingMessage = '';
            }))
            .subscribe(
                (res: any) => {
                    this.conversation = [...this.conversation, { question, answer: res }];
                    this.notes.setCached('conversation', note, this.conversation);
                    this.customPromptForm.reset();
                    // Wait for the answer to render before scrolling to it
                    setTimeout(() => this.conversationEnd?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'end' }));
                },
                (error: any) => {
                    console.error("Error running custom prompt:", error);
                    this._snackBar.open("We could not answer that right now. Please try again.", "Dismiss");
                }
            );
    }

    cancelLoading(): void {
        this.pending?.unsubscribe();
        this.loadingMessage = '';
    }
}
