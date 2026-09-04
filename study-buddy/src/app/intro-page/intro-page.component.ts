import { Component, OnDestroy, OnInit, PLATFORM_ID, inject } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { Router } from '@angular/router';

interface Testimonial {
    quote: string;
    role: string;
}

const ROTATE_INTERVAL_MS = 7000;

@Component({
    selector: 'app-intro-page',
    standalone: true,
    imports: [],
    templateUrl: './intro-page.component.html',
    styleUrl: './intro-page.component.css'
})
export class IntroPageComponent implements OnInit, OnDestroy {

    constructor(private router: Router) { }

    private platformId = inject(PLATFORM_ID);
    private timer: ReturnType<typeof setInterval> | null = null;

    testimonials: Testimonial[] = [
        {
            quote: "I used to just read my notes over and over and hope some of it stuck. Now I get a set of flashcards out of them in about a minute and actually test myself properly. My chemistry mock went a lot better than the one before it.",
            role: 'Student'
        },
        {
            quote: "Photographing my maths notes is the bit I didn't think would work. My handwriting is genuinely terrible and it still pulled the text out fine.",
            role: 'Student'
        },
        {
            quote: "I do the question and answer bit on the bus home. It asks me something, I type whatever I can remember, and it tells me what I've left out. Twenty minutes a day and I've mostly stopped panicking before tests.",
            role: 'Student'
        },
        {
            quote: 'Our biology teacher handed out a 40 page booklet on the endocrine system. I put the whole thing in and had a summary I could actually get through before the lesson.',
            role: 'Student'
        },
        {
            quote: "Exporting straight to Quizlet is what sold it to the rest of my friends. We share decks now instead of four of us making the same cards separately.",
            role: 'Student'
        },
        {
            quote: "Being able to just ask it things about my own notes is what I use most. I asked it to explain enzyme inhibition again but simpler, and it did, using the diagram from our booklet.",
            role: 'Student'
        }
    ];

    activeIndex = 0;

    ngOnInit(): void {
        this.startRotating();
    }

    ngOnDestroy(): void {
        this.stopRotating();
    }

    private prefersReducedMotion(): boolean {
        if (!isPlatformBrowser(this.platformId) || typeof matchMedia === 'undefined') {
            return false;
        }
        return matchMedia('(prefers-reduced-motion: reduce)').matches;
    }

    private startRotating(): void {
        // Only in the browser: the intro page is prerendered, and a timer
        // started during SSR would never be cleared. Readers who have asked
        // for reduced motion get the controls without the movement.
        if (!isPlatformBrowser(this.platformId) || this.prefersReducedMotion()) {
            return;
        }
        this.stopRotating();
        this.timer = setInterval(() => this.next(), ROTATE_INTERVAL_MS);
    }

    private stopRotating(): void {
        if (this.timer !== null) {
            clearInterval(this.timer);
            this.timer = null;
        }
    }

    next(): void {
        this.activeIndex = (this.activeIndex + 1) % this.testimonials.length;
    }

    previous(): void {
        this.activeIndex =
            (this.activeIndex - 1 + this.testimonials.length) % this.testimonials.length;
    }

    goTo(index: number): void {
        this.activeIndex = index;
    }

    /** Hovering or tabbing into the carousel holds the current quote still. */
    pause(): void {
        this.stopRotating();
    }

    resume(): void {
        this.startRotating();
    }

    /** Restart the countdown so a manual choice gets a full interval to be read. */
    selectAndRestart(index: number): void {
        this.goTo(index);
        this.startRotating();
    }

    home() {

        this.router.navigate(['/home'])
    }

    login() {

        this.router.navigate(['/login'])
    }
}
