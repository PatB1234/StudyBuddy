/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { AppComponent } from '../app.component';
import { take } from 'rxjs/operators';
import { NotesService } from '../notes.service';
import { PickNoteComponent } from '../pick-note/pick-note.component';

interface Feature {
    path: string;
    icon: string;
    title: string;
    description: string;
}

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [AsyncPipe, RouterLink, MatIconModule, PickNoteComponent],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.css'
})
export class DashboardComponent implements OnInit {
    constructor(private http: HttpClient) { }

    notes = inject(NotesService);

    URL: any = AppComponent.URL;
    name = '';

    features: Feature[] = [
        { path: '/flashcards', icon: 'style', title: 'Flashcards', description: 'Test your memory one card at a time.' },
        { path: '/question-answer', icon: 'quiz', title: 'Practice questions', description: 'Answer a question and get your answer marked.' },
        { path: '/summariser', icon: 'article', title: 'Summary', description: 'Read a shorter version of your notes.' },
        { path: '/custom-prompt', icon: 'forum', title: 'Ask your notes', description: 'Ask anything and get an answer from your notes.' },
    ];

    ngOnInit(): void {
        this.getStudent();
    }

    getStudent() {
        this.http.get(this.URL + "/get_student_credentials")
            .pipe(take(1))
            .subscribe((res: any) => {
                this.name = res['name'];
            });
    }
}
