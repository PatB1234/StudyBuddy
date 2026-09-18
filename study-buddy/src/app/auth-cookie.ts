// Auth token cookie helpers. Secure only over HTTPS: browsers drop a Secure
// cookie on http://localhost.
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

    // A cookie only clears on a write whose Path matches. Clear "/" plus
    // every ancestor of the current path to catch tokens set without one.
    const parts = (typeof location !== 'undefined' ? location.pathname : '/').split('/');
    const paths = new Set<string>(['/']);
    for (let i = parts.length; i > 0; i--) {
        paths.add(parts.slice(0, i).join('/') || '/');
    }

    paths.forEach((path) => {
        document.cookie = `${TOKEN_COOKIE}=; ${expired}; Path=${path}; SameSite=Lax;${secure}`;
    });
}

