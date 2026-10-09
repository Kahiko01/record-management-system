import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // Allow public access to appointment confirmation links
  if (request.nextUrl.pathname.startsWith('/appointment')) {
    return NextResponse.next();
  }


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
