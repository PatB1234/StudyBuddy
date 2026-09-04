import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

/**
 * Root shell. The template is a bare <router-outlet>, so this component holds
 * no UI of its own - the sidenav, notes tree and account actions all live in
 * BasePageComponent, which is the layout the feature routes render inside.
 *
 * It stays in the app as the home of the global API base URL.
 */
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
