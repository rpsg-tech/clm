import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Edge Middleware for Route Protection
 * 
 * - Verifies presence of auth token for protected routes
 * - Redirects unauthenticated users to /login
 * - Redirects authenticated users away from auth pages
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Check for auth token (HttpOnly cookie)
    // Note: We check for 'access_token' or 'auth_token' depending on what the backend sets.
    // Based on previous contexts, let's assume 'access_token' or check common names.
    // Ideally this matches the cookie name set by the backend.
    const token = request.cookies.get('access_token')?.value || request.cookies.get('token')?.value;

    // Define paths
    const isAuthPage = pathname.startsWith('/login') || pathname.startsWith('/signup') || pathname.startsWith('/forgot-password');
    const isDashboardPage = pathname.startsWith('/dashboard') || pathname.startsWith('/select-org');
    const isRoot = pathname === '/';

    // 1. Authenticated User trying to access Auth Pages -> Redirect to Dashboard
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    // 2. Unauthenticated User trying to access Protected Pages -> Redirect to Login
    if (!token && isDashboardPage) {
        const loginUrl = new URL('/login', request.url);
        loginUrl.searchParams.set('from', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 3. Root path handling
    if (isRoot) {
        if (token) {
            return NextResponse.redirect(new URL('/dashboard', request.url));
        } else {
            // Optional: Redirect root to login for enterprise apps
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

/**
 * Matcher configuration
 * 
 * Excludes:
 * - api (handled by backend)
 * - _next/static (static files)
 * - _next/image (image optimization files)
 * - favicon.ico (favicon file)
 * - public folder assets
 */
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         */
        '/((?!api|_next/static|_next/image|favicon.ico).*)',
    ],
};
