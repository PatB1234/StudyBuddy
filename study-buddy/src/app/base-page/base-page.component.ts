/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, HostListener, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { MatSidenavContent, MatSidenavContainer, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AppComponent } from '../app.component';
import { LoadingService } from '../loading.service';
import { MatToolbar, MatToolbarModule } from "@angular/material/toolbar";
import { MatTree, MatTreeModule, MatTreeNode } from "@angular/material/tree";
import { IntrojsService } from '../introjs/introjs.service';
import { MatIcon } from '@angular/material/icon';
import { MatButtonModule, MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { clearTokenCookie } from '../auth-cookie';
import { MatDialog } from '@angular/material/dialog';
import { take } from 'rxjs/operators';
import { ConfirmDialogComponent, ConfirmDialogData } from '../confirm-dialog/confirm-dialog.component';

interface ILink {
    path: string;
    label: string;
}
interface TreeNode {
    name: string;
    children?: TreeNode[];
}

@Component({
    selector: 'app-base-page',
    standalone: true,
    imports: [
        CommonModule,
        MatSidenavContent,
        RouterOutlet,
        MatTabNavPanel,
        MatTabsModule,
        MatToolbar,
        MatSidenavContainer,
        MatSidenav,
        MatIcon,
        MatTree,
        MatTreeNode,
        RouterLink,
        MatIconButton,
        MatButtonModule,
        RouterOutlet,
        MatSidenavModule,
        MatToolbarModule,
        MatTreeModule,
        MatTooltipModule
    ],
    templateUrl: './base-page.component.html',
    styleUrl: './base-page.component.css'
})
export class BasePageComponent implements OnInit {


    constructor(private router: Router, private http: HttpClient, private introService: IntrojsService, private loadingService: LoadingService) { }
    curr_selected = "None";
    isLoading = false;
    loadingMessage = '';
    private _snackBar = inject(MatSnackBar);
    private dialog = inject(MatDialog);
    links: ILink[] = [
        { path: 'custom-prompt', label: 'Custom Prompt' },
        { path: 'flashcards', label: 'Flashcards' },
        { path: 'question-answer', label: 'Question & Answer' },
        { path: 'summariser', label: 'Summariser' },
    ];
    activePath = this.links[0].path;

    @HostListener('document:keydown.enter', ['$event'])
    handleEnterKey(event: Event) {
        event.preventDefault();
        event.stopPropagation();
    }

    ngOnInit(): void {
        this.loadingService.isLoading$.subscribe(v => this.isLoading = v);
        this.loadingService.message$.subscribe(v => this.loadingMessage = v);
        this.getTree();
        this.get_curr_notes()
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                if (event.urlAfterRedirects === '/home') {
                    this.maybeStartTour();
                }
            }

        });
        // Whichever of route and tree lands last starts the tour
        this.onHome = this.router.url.split('?')[0] === '/home';
        this.maybeStartTour();
    }

    private onHome = false;
    private treeLoaded = false;

    // #expandIcon lives in the tree, so both must be ready
    private maybeStartTour(): void {
        if (this.router.url.split('?')[0] === '/home') {
            this.onHome = true;
        }
        if (this.onHome && this.treeLoaded) {
            this.introService.buttonExplanationFeature();
        }
    }

    get_curr_notes(): void {

        this.http.post(AppComponent.URL + "/get_currently_selected_note", {}).subscribe(
            (res: any) => {
                if (res != "-1.txt") {

                    this.curr_selected = res;
                }
            },
            (error: any) => {
                console.error("Error fetching currently selected notes:", error);
            }
        );
    }

    dash() {

        this.router.navigate(['/']);
    }

    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }

    home(): void {

        this.router.navigate(['/home'])
    }

    childrenAccessor = (node: TreeNode) => node.children ?? [];
    hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;
    dataSource: any = [];
    getTree(): void {
        this.http.post(AppComponent.URL + "/get_all_user_notes_tree", {}).subscribe(
            (res: any) => {
                this.dataSource = res;
                this.treeLoaded = true;
                this.maybeStartTour();
            },
            (error: any) => {
                console.error("Error fetching tree data:", error);
                this.treeLoaded = true;
                this.maybeStartTour();
            }
        );
    }

    nodePress(nodeName: string): void {
        console.log("Node clicked:", nodeName);
        this.http.post(AppComponent.URL + "/change_current_notes", { newNoteName: nodeName }).subscribe(
            (res: any) => {
                console.log("Node press action completed successfully:", res);
                this._snackBar.open(`Selected notes: ${nodeName}`, "Dismiss")
                this.http.post(AppComponent.URL + "/get_currently_selected_note", {}).subscribe((res: any) => {

                    if (res == -1 || res == "-1.txt") {

                        this.curr_selected = "Unselected"
                    } else {

                        this.curr_selected = res
                    }
                })
            },
            (error: any) => {
                console.error("Error updating current notes:", error);
            }
        );
    }

    deleteNode(nodeName: string): void {

        const data: ConfirmDialogData = {
            title: 'Delete these notes?',
            lines: [
                `"${nodeName}" will be deleted permanently.`,
                'This cannot be undone, and anything generated from these notes goes with them.'
            ],
            confirmLabel: 'Delete',
            cancelLabel: 'Cancel',
            confirmIcon: 'delete_forever',
            holdSeconds: 5
        };

        this.dialog
            .open(ConfirmDialogComponent, { data, width: '420px' })
            .afterClosed()
            .pipe(take(1))
            .subscribe(confirmed => {
                if (!confirmed) {
                    this._snackBar.open("Note deletion cancelled", "Dismiss");
                    return;
                }
                this.http.post(AppComponent.URL + "/delete_note_by_name", { noteName: nodeName }).subscribe(
                    (res: any) => {
                        console.log("Note delete action completed successfully:", res);
                        this._snackBar.open(res)
                        setTimeout(() => location.reload(), 1500)
                    }
                );
            });
    }

    accountsMenu(): void {

        this.router.navigate(['/student-profile']);
    }

    addSection(): void {

        this.router.navigate(['/add-section'])
    }

    onActivate(path: string) {
        this.activePath = path;
    }
    logout(): void {

        clearTokenCookie();
        this._snackBar.open("Logged out", "Dismiss");
        // Hard navigation, so in-memory state goes too
        setTimeout(() => location.assign('/login'), 900);
    }

}
