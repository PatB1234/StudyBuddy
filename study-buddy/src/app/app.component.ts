import { Component, OnInit } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { Router } from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTreeModule} from '@angular/material/tree';
import { HttpClient } from '@angular/common/http';
import { NestedTreeControl } from '@angular/cdk/tree';

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

	constructor(private router: Router, private http: HttpClient) { }
	ngOnInit(): void {
		this.getTree()
	}

	title = 'study-buddy';
	static URL = 'http://127.0.0.1:8000'; // Global URL Path

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