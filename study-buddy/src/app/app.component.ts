import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';
import { MatIcon } from '@angular/material/icon';
import { MatIconButton } from '@angular/material/button';
import { Router } from '@angular/router';
import {MatTabsModule} from '@angular/material/tabs';
import {MatTreeModule} from '@angular/material/tree';


interface ILink {
    path: string;
    label: string;
}

interface FoodNode {
	name: string;
	children?: FoodNode[];
  }
  
  const TREE_DATA: FoodNode[] = [
	{
	  name: 'Fruit',
	  children: [{name: 'Apple'}, {name: 'Banana'}, {name: 'Fruit loops'}],
	},
	
	{
	  name: 'Vegetables',
	  children: [
		{
		  name: 'Green',
		  children: [{name: 'Broccoli'}, {name: 'Brussels sprouts'}],
		},
		{
		  name: 'Orange',
		  children: [{name: 'Pumpkins'}, {name: 'Carrots'}],
		},
	  ],
	},
  ];

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

export class AppComponent {

	constructor(private router: Router) { }

	title = 'study-buddy';
	static URL = 'http://127.0.0.1:8000'; // Global URL Path

	dataSource = TREE_DATA;

	childrenAccessor = (node: FoodNode) => node.children ?? [];
	hasChild = (_: number, node: FoodNode) => !!node.children && node.children.length > 0;

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