import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Routes that require authentication
const protectedRoutes = ['/dashboard'];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ['/signin', '/signup'];

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;
  
  // Check if the current path is protected
  const isProtectedRoute = protectedRoutes.some(route => 
    path === route || path.startsWith(`${route}/`)
  );
  
  // Check if the current path is an auth route
  const isAuthRoute = authRoutes.includes(path);
  
  // In middleware, we can't access localStorage directly
  // The client will handle the actual auth check
  // This middleware sets headers to help the client-side routing
  
  if (isProtectedRoute) {
    // Add a header to indicate this is a protected route
    const response = NextResponse.next();
    response.headers.set('x-protected-route', 'true');
    return response;
  }
  
  if (isAuthRoute) {
    // Add a header to indicate this is an auth route
    const response = NextResponse.next();
    response.headers.set('x-auth-route', 'true');
    return response;
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