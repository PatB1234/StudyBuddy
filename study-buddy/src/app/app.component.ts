import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

// Root shell. Bare <router-outlet>; the layout lives in BasePageComponent.
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    templateUrl: './app.component.html',
    styleUrl: './app.component.css',
})
export class AppComponent {

    title = 'study-buddy';
    // Global URL Path Prod Path: https://studdybuddy.app/api Dev Path: http://localhost:8000/api
    static URL = 'https://studdybuddy.app/api';
}
