import { Component, OnInit, ViewChild, inject, DestroyRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd, Router } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar } from '@angular/material/snack-bar';
import { LoadingService } from '../loading.service';
import { MatToolbarModule } from "@angular/material/toolbar";
import { MatTree, MatTreeModule } from "@angular/material/tree";
import { IntrojsService } from '../introjs/introjs.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatMenuModule } from '@angular/material/menu';
import { BreakpointObserver } from '@angular/cdk/layout';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { clearTokenCookie } from '../auth-cookie';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';
import { NoteNode, NotesService } from '../notes.service';

interface ILink {
    path: string;
    label: string;
}

@Component({
    selector: 'app-base-page',
    standalone: true,
    imports: [
        CommonModule,
        RouterOutlet,
        RouterLink,
        RouterLinkActive,
        MatTabsModule,
        MatSidenavModule,
        MatToolbarModule,
        MatTreeModule,
        MatIconModule,
        MatButtonModule,
        MatTooltipModule,
        MatMenuModule
    ],
    templateUrl: './base-page.component.html',
    styleUrl: './base-page.component.css'
})
export class BasePageComponent implements OnInit {

    constructor(private router: Router, private introService: IntrojsService, private loadingService: LoadingService) { }

    @ViewChild('notesTree') treeRef?: MatTree<NoteNode>;
    @ViewChild('sidenav') sidenav?: MatSidenav;

    notes = inject(NotesService);
    private _snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    private breakpoints = inject(BreakpointObserver);
    private destroyRef = inject(DestroyRef);

    isLoading = false;
    loadingMessage = '';
    isHandset = false;

    tree: NoteNode[] = [];
    selected: string | null = null;
    selectedId: number | null = null;
    treeLoaded = false;

    links: ILink[] = [
        { path: 'flashcards', label: 'Flashcards' },
        { path: 'question-answer', label: 'Practice questions' },
        { path: 'summariser', label: 'Summary' },
        { path: 'custom-prompt', label: 'Ask your notes' },
    ];

    ngOnInit(): void {
        this.loadingService.isLoading$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.isLoading = v);
        this.loadingService.message$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(v => this.loadingMessage = v);

        // Phones get a drawer that slides over the page
        this.breakpoints.observe('(max-width: 767px)')
            .pipe(takeUntilDestroyed(this.destroyRef))
            .subscribe(state => this.isHandset = state.matches);

        this.notes.tree$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(tree => {
            this.tree = tree;
            this.expandSelectedSection();
        });
        this.notes.selection$.pipe(takeUntilDestroyed(this.destroyRef)).subscribe(note => {
            this.selected = note?.name ?? null;
            this.selectedId = note?.id ?? null;
            this.expandSelectedSection();
        });
        this.notes.refresh().subscribe(() => {
            this.treeLoaded = true;
            this.maybeStartTour();
        });

        this.router.events.pipe(takeUntilDestroyed(this.destroyRef)).subscribe((event) => {
            if (event instanceof NavigationEnd) {
                if (event.urlAfterRedirects === '/home') {
                    this.maybeStartTour();
                }
                // The drawer covers the page on phones, so close it once they've moved
                this.closeIfHandset();
            }
        });
        // Whichever of route and tree lands last starts the tour
        this.onHome = this.router.url.split('?')[0] === '/home';
        this.maybeStartTour();
    }

    private onHome = false;

    // #expandIcon lives in the tree, so both must be ready
    private maybeStartTour(): void {
        if (this.router.url.split('?')[0] === '/home') {
            this.onHome = true;
        }
        if (this.onHome && this.treeLoaded) {
            this.introService.buttonExplanationFeature();
        }
    }

    // Opens the section holding the selected note, so it is visible straight away
    private expandSelectedSection(): void {
        const section = this.tree.find(s => s.children?.some(n => n.id === this.selectedId));
        if (!section) {
            return;
        }
        // Wait a tick so the tree has drawn the new data
        setTimeout(() => this.treeRef?.expand(section));
    }

    childrenAccessor = (node: NoteNode) => node.children ?? [];
    hasChild = (_: number, node: NoteNode) => !!node.children && node.children.length > 0;

    selectNote(node: NoteNode): void {
        this.notes.select(node).subscribe({
            next: () => this.closeIfHandset(),
            error: (error: unknown) => {
                console.error("Error updating current notes:", error);
                this._snackBar.open("We could not select those notes. Please try again.", "Dismiss");
            }
        });
    }

    deleteNode(node: NoteNode): void {

        const nodeName = node.name;
        const data: ConfirmDialogData = {
            title: 'Delete these notes?',
            lines: [
                `"${nodeName}" will be deleted permanently, along with anything generated from it.`
            ],
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            confirmIcon: 'delete_forever'
        };

        this.dialog
            .open(ConfirmDialogComponent, { data, width: '420px' })
            .afterClosed()
            .pipe(take(1))
            .subscribe(confirmed => {
                if (!confirmed) {
                    return;
                }
                this.notes.delete(node).subscribe({
                    next: () => this._snackBar.open(`Deleted "${nodeName}"`, "Dismiss"),
                    error: () => this._snackBar.open("We could not delete those notes. Please try again.", "Dismiss")
                });
            });
    }

    closeIfHandset(): void {
        if (this.isHandset) {
            this.sidenav?.close();
        }
    }

    accountsMenu(): void {

        this.router.navigate(['/student-profile']);
    }

    logout(): void {

        clearTokenCookie();
        this._snackBar.open("Logged out", "Dismiss");
        // Hard navigation, so in-memory state goes too
        setTimeout(() => location.assign('/login'), 900);
    }

}
