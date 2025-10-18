import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

// Middleware - simple session cookie check
// Full validation happens in SessionChecker component and API routes
export function middleware(request: NextRequest) {
  const sessionId = request.cookies.get('session')?.value
  const { pathname } = request.nextUrl

  // Public paths that don't require authentication
  const publicPaths = ['/login']
  const isPublicPath = publicPaths.some(path => pathname.startsWith(path))

  // If no session cookie and trying to access protected route
  if (!sessionId && !isPublicPath) {
    const loginUrl = new URL('/login', request.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

// Configure which routes should run this middleware
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (handled separately)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}

