/**
 * Helpers for the auth token cookie.
 *
 * Kept in one place so the attributes cannot drift between the login and
 * logout paths - they were previously written inline in three components.
 *
 * `Secure` is only added over HTTPS: browsers drop a Secure cookie on
 * http://localhost, which would break local development entirely.
 */
const TOKEN_COOKIE = 'token';

function cookieAttributes(): string {
    const isHttps = typeof location !== 'undefined' && location.protocol === 'https:';
    return `Path=/; SameSite=Lax;${isHttps ? ' Secure;' : ''}`;
}

export function setTokenCookie(token: string): void {
    if (typeof document === 'undefined') {
        return;
    }
    document.cookie = `${TOKEN_COOKIE}=${token}; ${cookieAttributes()}`;
}

export function clearTokenCookie(): void {
    if (typeof document === 'undefined') {
        return;
    }

    const expired = 'Expires=Thu, 01 Jan 1970 00:00:00 GMT; Max-Age=0';
    const isHttps = typeof location !== 'undefined' && location.protocol === 'https:';
    const secure = isHttps ? ' Secure;' : '';

    // A cookie is only removed by a write whose Path matches the one it was
    // stored under. Earlier versions of this app set the token without a Path,
    // so the browser defaulted it to whatever page happened to set it. Clear
    // "/" plus every ancestor of the current path so any of those are caught.
    const parts = (typeof location !== 'undefined' ? location.pathname : '/').split('/');
    const paths = new Set<string>(['/']);
    for (let i = parts.length; i > 0; i--) {
        paths.add(parts.slice(0, i).join('/') || '/');
    }

    paths.forEach((path) => {
        document.cookie = `${TOKEN_COOKIE}=; ${expired}; Path=${path}; SameSite=Lax;${secure}`;
    });
}

