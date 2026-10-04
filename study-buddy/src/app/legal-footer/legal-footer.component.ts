import { Component } from '@angular/core';
import { PRIVACY_URL, TERMS_URL } from './legal-links';

// Privacy and terms links for the public pages
@Component({
    selector: 'app-legal-footer',
    standalone: true,
    template: `
        <footer class="legal-footer">
            <a [href]="privacyUrl" target="_blank" rel="noopener">Privacy Policy</a>
            <span aria-hidden="true">·</span>
            <a [href]="termsUrl" target="_blank" rel="noopener">Terms of Service</a>
        </footer>
    `,
    styles: `
        .legal-footer {
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 12px;
            padding: 20px 16px;
            font-size: 0.875rem;
            color: var(--color-text-muted);
        }

        .legal-footer a {
            color: var(--color-text-muted);
            text-decoration: none;
        }

        .legal-footer a:hover,
        .legal-footer a:focus-visible {
            color: var(--color-primary);
            text-decoration: underline;
        }
    `,
})
export class LegalFooterComponent {
    privacyUrl = PRIVACY_URL;
    termsUrl = TERMS_URL;
}
