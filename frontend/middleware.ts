import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚫 Block all student-facing routes
  if (pathname.startsWith('/student') || pathname.startsWith('/verify')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/student/:path*', '/verify/:path*'],
};
