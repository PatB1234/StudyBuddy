/* eslint-disable @typescript-eslint/no-explicit-any */
import { Component, OnInit, HostListener, inject } from '@angular/core';
import { RouterOutlet, RouterLink, NavigationEnd } from '@angular/router';
import { MatSidenavContent, MatSidenavContainer, MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { Router } from '@angular/router';
import { MatTabNavPanel, MatTabsModule } from '@angular/material/tabs';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';
import { AppComponent } from '../app.component';
import { MatToolbar, MatToolbarModule } from "@angular/material/toolbar";
import { MatTree, MatTreeModule, MatTreeNode } from "@angular/material/tree";
import { IntrojsService } from '../introjs/introjs.service';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';

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


    constructor(private router: Router, private http: HttpClient, private introService: IntrojsService) { }
    curr_selected = "None";
    private _snackBar = inject(MatSnackBar);
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
        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                if (event.urlAfterRedirects != '/') {
                    this.getTree()
                    this.router.events
                        .pipe(filter(event => event instanceof NavigationEnd))
                        .subscribe(() => {
                            this.getTree();
                        });
                }
            }
        });

        this.router.events.subscribe((event) => {
            if (event instanceof NavigationEnd) {
                if (event.urlAfterRedirects === '/home') {
                    this.introService.buttonExplanationFeature()
                }
            }
        });
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

    delay(ms: number) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    childrenAccessor = (node: TreeNode) => node.children ?? [];
    hasChild = (_: number, node: TreeNode) => !!node.children && node.children.length > 0;
    dataSource: any = [];
    getTree(): void {
        this.http.post(AppComponent.URL + "/get_all_user_notes_tree", {}).subscribe(
            (res: any) => {
                this.dataSource = res;
            },
            (error: any) => {
                console.error("Error fetching tree data:", error);
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
        const res = prompt("Are you sure you want to delete this note? This action cannot be undone. Type DELETE to confirm.");
        if (res == "DELETE") {
            this.http.post(AppComponent.URL + "/delete_note_by_name", { noteName: nodeName }).subscribe(
                (res: any) => {
                    console.log("Note delete action completed successfully:", res);
                    this._snackBar.open(res)
                    setTimeout(() => location.reload(), 1500)
                }
            );
        } else {
            this._snackBar.open("Note deletion cancelled", "Dismiss");
        }
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

        console.log("logout")
        document.cookie = `token=INVALIDATED; SameSite=Lax;`;
        this.delay(1500)
        this._snackBar.open("Logged out", "Dismiss");
        location.reload()
    }
    delete_user(): void {

        const res = prompt("Are you sure you want to delete your account? This action cannot be undone. Type DELETE to confirm.");
        if (res == "DELETE") {

            this._snackBar.open("Account deleted", "Dismiss");
            this.http.post(AppComponent.URL + "/delete_user", {}).subscribe((res: any) => {
                console.log("Account deletion response:", res);
            }, (error: any) => {
                console.error("Error deleting account:", error);
            });
            document.cookie = `token=INVALIDATED; SameSite=Lax;`;
            this.delay(1500)
            // Snackbar message
            this._snackBar.open("Account deleted", "Dismiss");
            location.reload()
        } else {
            this._snackBar.open("Account deletion cancelled", "Dismiss");
        }
    }
}
