import { NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const token = await getToken({ req });

  const pathname = req.nextUrl.pathname;

  // Redirect if not logged in
  if (!token && pathname !== '/login') {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  // Role protection
  if (pathname.startsWith('/dashboard') && token?.role !== 'ADMIN') {
    return NextResponse.redirect(new URL('/tabulation', req.url));
  }

  if (pathname.startsWith('/tabulation') && token?.role !== 'JURI') {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/dashboard/:path*', '/tabulation/:path*'],
};
