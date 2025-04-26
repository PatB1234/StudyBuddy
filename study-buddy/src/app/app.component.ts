import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet, RouterLink, ActivatedRoute, NavigationEnd } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { Router } from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTreeModule} from '@angular/material/tree';
import { HttpClient } from '@angular/common/http';
import {MatSnackBar} from '@angular/material/snack-bar';

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
		MatTreeModule
			
	],
	templateUrl: './app.component.html',	
	styleUrl: './app.component.css',
	
})

export class AppComponent implements OnInit{

	constructor(private router: Router, private http: HttpClient, private route: ActivatedRoute) { }
	ngOnInit(): void {
		
			this.getTree()

		}


	title = 'study-buddy';
	static URL = 'http://45.79.253.48:8000'; // Global URL Path Prod Path: http://45.79.253.48:8000
	curr_selected = "None";
	private _snackBar = inject(MatSnackBar);
	openSnackBar(message: string, action: string) {
		this._snackBar.open(message, action);
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

					if (res  == -1 || res == "-1.txt") {

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
}