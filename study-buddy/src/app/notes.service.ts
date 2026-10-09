/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, forkJoin, of } from 'rxjs';
import { catchError, distinctUntilChanged, map, switchMap, tap } from 'rxjs/operators';
import { AppComponent } from './app.component';

export interface NoteNode {
    name: string;
    id?: number; // The note's fileID. Sections have none
    children?: NoteNode[];
}

export interface SelectedNote {
    id: number;
    name: string;
}

// One source of truth for the notes tree and the selected note, so the
// sidebar, toolbar and pages stay in step without reloading the page.
@Injectable({ providedIn: 'root' })
export class NotesService {

    private http = inject(HttpClient);

    private _tree = new BehaviorSubject<NoteNode[]>([]);
    private _selection = new BehaviorSubject<SelectedNote | null>(null);
    private _ready = new BehaviorSubject<boolean>(false);

    tree$ = this._tree.asObservable();
    // Compared by fileID, since two notes can share a name
    selection$ = this._selection.pipe(distinctUntilChanged((a, b) => a?.id === b?.id));
    selected$ = this._selection.pipe(map(note => note?.name ?? null));
    ready$ = this._ready.asObservable(); // False until the first refresh lands

    // Per-note results kept for the session, so switching tabs costs nothing
    private cache = new Map<string, any>();

    get selected(): string | null {
        return this._selection.value?.name ?? null;
    }

    get selectedId(): number | null {
        return this._selection.value?.id ?? null;
    }

    get tree(): NoteNode[] {
        return this._tree.value;
    }

    // A failed call leaves an empty tree, not a broken sidebar
    refresh(): Observable<void> {
        return forkJoin({
            tree: this.http.post<NoteNode[]>(AppComponent.URL + '/get_all_user_notes_tree', {})
                .pipe(catchError(() => of([] as NoteNode[]))),
            selectedId: this.http.post<number>(AppComponent.URL + '/get_currently_selected_note_id', {})
                .pipe(catchError(() => of(-1)))
        }).pipe(
            tap(({ tree, selectedId }) => {
                const safeTree = Array.isArray(tree) ? tree : [];
                const note = safeTree.flatMap(section => section.children ?? [])
                    .find(n => n.id !== undefined && n.id === Number(selectedId));
                this._tree.next(safeTree);
                this._selection.next(note ? { id: note.id!, name: note.name } : null);
                this._ready.next(true);
            }),
            map(() => undefined)
        );
    }

    select(note: NoteNode): Observable<void> {
        return this.http.post(AppComponent.URL + '/change_current_notes', { newNoteName: note.name, fileID: note.id }).pipe(
            tap(() => this._selection.next({ id: note.id ?? -1, name: note.name })),
            map(() => undefined)
        );
    }

    delete(note: NoteNode): Observable<string> {
        return this.http.post<string>(AppComponent.URL + '/delete_note_by_name', { noteName: note.name, fileID: note.id }).pipe(
            tap(() => this.clearCacheFor(note.id ?? -1)),
            // Refresh after, since deleting the selected note unselects it on the server
            switchMap(res => this.refresh().pipe(map(() => res)))
        );
    }

    // The latest upload with this name, as a new upload takes the highest fileID
    newestNote(name: string): NoteNode | undefined {
        return this._tree.value.flatMap(section => section.children ?? [])
            .filter(note => note.name === name)
            .sort((a, b) => (b.id ?? -1) - (a.id ?? -1))[0];
    }

    sectionNames(): string[] {
        return this._tree.value.map(section => section.name);
    }

    getCached<T>(kind: string, noteId: number): T | undefined {
        return this.cache.get(`${kind}:${noteId}`);
    }

    setCached<T>(kind: string, noteId: number, value: T): void {
        this.cache.set(`${kind}:${noteId}`, value);
    }

    private clearCacheFor(noteId: number): void {
        for (const key of [...this.cache.keys()]) {
            if (key.endsWith(`:${noteId}`)) {
                this.cache.delete(key);
            }
        }
    }
}
