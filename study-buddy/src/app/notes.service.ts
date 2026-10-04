/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { AppComponent } from './app.component';

export interface NoteNode {
    name: string;
    children?: NoteNode[];
}

// One source of truth for the notes tree and the selected note, so the
// sidebar, toolbar and pages stay in step without reloading the page.
@Injectable({ providedIn: 'root' })
export class NotesService {

    private http = inject(HttpClient);

    private _tree = new BehaviorSubject<NoteNode[]>([]);
    private _selected = new BehaviorSubject<string | null>(null);
    private _ready = new BehaviorSubject<boolean>(false);

    tree$ = this._tree.asObservable();
    selected$ = this._selected.asObservable();
    ready$ = this._ready.asObservable(); // False until the first refresh lands

    // Per-note results kept for the session, so switching tabs costs nothing
    private cache = new Map<string, any>();

    get selected(): string | null {
        return this._selected.value;
    }

    get tree(): NoteNode[] {
        return this._tree.value;
    }

    // A failed call leaves an empty tree, not a broken sidebar
    refresh(): Observable<void> {
        return forkJoin({
            tree: this.http.post<NoteNode[]>(AppComponent.URL + '/get_all_user_notes_tree', {})
                .pipe(catchError(() => of([] as NoteNode[]))),
            selected: this.http.post<any>(AppComponent.URL + '/get_currently_selected_note', {})
                .pipe(catchError(() => of(null)))
        }).pipe(
            tap(({ tree, selected }) => {
                this._tree.next(Array.isArray(tree) ? tree : []);
                this._selected.next(this.normalise(selected));
                this._ready.next(true);
            }),
            map(() => undefined)
        );
    }

    select(name: string): Observable<void> {
        return this.http.post(AppComponent.URL + '/change_current_notes', { newNoteName: name }).pipe(
            tap(() => this._selected.next(name)),
            map(() => undefined)
        );
    }

    delete(name: string): Observable<string> {
        return this.http.post<string>(AppComponent.URL + '/delete_note_by_name', { noteName: name }).pipe(
            tap(() => this.clearCacheFor(name)),
            // Refresh after, since deleting the selected note unselects it on the server
            switchMap(res => this.refresh().pipe(map(() => res)))
        );
    }

    sectionNames(): string[] {
        return this._tree.value.map(section => section.name);
    }

    getCached<T>(kind: string, note: string): T | undefined {
        return this.cache.get(`${kind}:${note}`);
    }

    setCached<T>(kind: string, note: string, value: T): void {
        this.cache.set(`${kind}:${note}`, value);
    }

    private clearCacheFor(note: string): void {
        for (const key of [...this.cache.keys()]) {
            if (key.endsWith(`:${note}`)) {
                this.cache.delete(key);
            }
        }
    }

    // The backend reports "no note" as -1 or "-1.txt"
    private normalise(res: any): string | null {
        if (res === null || res === undefined || res === -1 || res === '-1' || res === '-1.txt' || res === '') {
            return null;
        }
        return String(res);
    }
}
