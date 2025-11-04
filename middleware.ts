import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { decrypt } from '@/lib/auth/session';
import { SESSION_CONFIG } from '@/lib/constants';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/signin', '/signup'];

// Public routes that don't require any auth check
const publicRoutes = ['/p'];

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // Skip auth check for public routes
  const isPublicRoute = publicRoutes.some(route =>
    path.startsWith(route)
  );

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route =>
    path === route || path.startsWith(`${route}/`)
  );

  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.some(route => path === route);

  // Get session from cookie
  const cookie = request.cookies.get(SESSION_CONFIG.COOKIE_NAME)?.value;
  const session = await decrypt(cookie);

  // Redirect to signin if accessing protected route without valid session
  if (isProtectedRoute && !session?.userId) {
    const url = new URL('/signin', request.url);
    url.searchParams.set('callbackUrl', path);
    return NextResponse.redirect(url);
  }

  // Redirect to dashboard if accessing auth routes with valid session
  if (isAuthRoute && session?.userId) {
    return NextResponse.redirect(new URL('/dashboard', request.url));
  }

  // Update session expiration if needed
  if (session?.userId) {
    // Check if session needs refresh (more than half time passed)
    const now = Date.now();
    const expiresAt = new Date(session.expiresAt).getTime();
    const halfDuration = SESSION_CONFIG.DURATION_MS / 2;

    if (expiresAt - now < halfDuration) {
      // Session needs refresh
      const { encrypt } = await import('@/lib/auth/session');
      const newExpiresAt = new Date(now + SESSION_CONFIG.DURATION_MS);
      const newSession = await encrypt({
        ...session,
        expiresAt: newExpiresAt,
      });

      const response = NextResponse.next();
      response.cookies.set(SESSION_CONFIG.COOKIE_NAME, newSession, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        expires: newExpiresAt,
        sameSite: 'lax',
        path: '/',
      });

      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).)',
  ],
};
