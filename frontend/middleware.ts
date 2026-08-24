import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 🚫 Block student-facing routes (but allow /verify to be public!)
  if (pathname.startsWith('/student')) {
    return NextResponse.redirect(new URL('/unauthorized', request.url));
  }

  return NextResponse.next();
}

export const config = {
  // Only match student routes, leaving /verify public
  matcher: ['/student/:path*'],
};
