import { Component } from '@angular/core';
import { RouterOutlet, RouterLink } from '@angular/router';
import {MatSidenavModule} from '@angular/material/sidenav';
import {MatToolbarModule} from '@angular/material/toolbar';


@Component({
	selector: 'app-root',
	standalone: true,
	imports: [
		RouterOutlet, 
		MatSidenavModule,
		MatToolbarModule,
		RouterLink
			
	],
	templateUrl: './app.component.html',	
	styleUrl: './app.component.css',
	
})

export class AppComponent {
	title = 'study-buddy';

}