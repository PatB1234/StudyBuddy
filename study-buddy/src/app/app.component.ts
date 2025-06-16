import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, ActivatedRoute, NavigationEnd } from '@angular/router';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { Router } from '@angular/router';
import { MatTabsModule } from '@angular/material/tabs';
import { MatTreeModule } from '@angular/material/tree';
import { HttpClient } from '@angular/common/http';
import { MatSnackBar } from '@angular/material/snack-bar';
import { filter } from 'rxjs/operators';
import { MatTooltipModule } from '@angular/material/tooltip';
import { IntrojsService } from './introjs/introjs.service';

interface ILink {
    path: string;
    label: string;
}
interface TreeNode {
    name: string;
    children?: TreeNode[];
}


@Component({
    selector: 'app-root',
    standalone: true,
    imports: [
        RouterOutlet,
        MatSidenavModule,
        MatToolbarModule,
        RouterLink,
        MatIconButton,
        MatIcon,
        MatTabsModule,
        MatTreeModule,
        MatTooltipModule

    ],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',

})

export class AppComponent implements OnInit {

    constructor(private router: Router, private http: HttpClient, private route: ActivatedRoute, private introService: IntrojsService) { }
    ngOnInit(): void {
        console.log("AppComponent initialized");
        this.getTree()
        this.router.events
            .pipe(filter(event => event instanceof NavigationEnd))
            .subscribe(() => {
                this.getTree();
            });
    }

    ngAfterViewInit(): void {
        this.introService.buttonExplanationFeature();
    }

    title = 'study-buddy';
    static URL = 'http://localhost:8000/api'; // Global URL Path Prod Path: https://studdybuddy.app/api Dev Path: http://localhost:8000/api
    curr_selected = "None";
    private _snackBar = inject(MatSnackBar);
    openSnackBar(message: string, action: string) {
        this._snackBar.open(message, action);
    }

    home(): void {

        this.router.navigate(['/'])
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

                // Perform any additional actions here if needed
            },
            (error: any) => {
                console.error("Error updating current notes:", error);
            }
        );
    }

    deleteNode(nodeName: string): void {
        var res = prompt("Are you sure you want to delete this note? This action cannot be undone. Type DELETE to confirm.");
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

    links: ILink[] = [
        { path: 'custom-prompt', label: 'Custom Prompt' },
        { path: 'flashcards', label: 'Flashcards' },
        { path: 'question-answer', label: 'Question & Answer' },
        { path: 'summariser', label: 'Summariser' },
    ];



    activePath = this.links[0].path;

    onActivate(path: string) {
        this.activePath = path;
    }
    logout(): void {

        console.log("logout")
        document.cookie = `token=INVALIDATED; SameSite=Lax;`;
        this._snackBar.open("Logged out", "Dismiss");
        location.reload()
    }
    delete_user(): void {

        var res = prompt("Are you sure you want to delete your account? This action cannot be undone. Type DELETE to confirm.");
        if (res == "DELETE") {

            this._snackBar.open("Account deleted", "Dismiss");
            this.http.post(AppComponent.URL + "/delete_user", {}).subscribe((res: any) => {
                console.log("Account deletion response:", res);
            }, (error: any) => {
                console.error("Error deleting account:", error);
            });
            document.cookie = `token=INVALIDATED; SameSite=Lax;`;
            // Snackbar message
            this._snackBar.open("Account deleted", "Dismiss");
            location.reload()
        } else {
            this._snackBar.open("Account deletion cancelled", "Dismiss");
        }
    }
}