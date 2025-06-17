import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
  selector: 'app-intro-page',
  standalone: true,
  imports: [],
  templateUrl: './intro-page.component.html',
  styleUrl: './intro-page.component.css'
})
export class IntroPageComponent {

    constructor(private router: Router) { }

    home() {

        this.router.navigate(['/home'])
    }

    login() {

        this.router.navigate(['/login'])
    }
}
