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
    // Max-Age=0 actually removes the cookie, so no token header is sent at
    // all. The API answers 401 and the error interceptor routes to /login.
    document.cookie = `${TOKEN_COOKIE}=; Max-Age=0; ${cookieAttributes()}`;
}
