import { Injectable, PLATFORM_ID, inject } from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';

type Setting = 'darkMode' | 'dyslexiaFont';

const CLASS_FOR: Record<Setting, string> = {
    darkMode: 'dark-mode',
    dyslexiaFont: 'dyslexia-font'
};

// Per-device display preferences, applied as classes on <html>
@Injectable({ providedIn: 'root' })
export class DisplaySettingsService {

    private platformId = inject(PLATFORM_ID);
    private document = inject(DOCUMENT);

    init(): void {
        (Object.keys(CLASS_FOR) as Setting[]).forEach(setting => this.apply(setting, this.get(setting)));
    }

    get(setting: Setting): boolean {
        if (!isPlatformBrowser(this.platformId)) {
            return false;
        }
        try {
            return localStorage.getItem(setting) === 'true';
        } catch {
            return false; // Private browsing or blocked storage
        }
    }

    set(setting: Setting, on: boolean): void {
        try {
            localStorage.setItem(setting, String(on));
        } catch {
            // Still applies for this visit
        }
        this.apply(setting, on);
    }

    private apply(setting: Setting, on: boolean): void {
        if (!isPlatformBrowser(this.platformId)) {
            return;
        }
        this.document.documentElement.classList.toggle(CLASS_FOR[setting], on);
    }
}
