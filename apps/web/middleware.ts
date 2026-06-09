import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { cookieNames, withClientApiPath } from './lib/config';

const protectedPrefixes = ['/admin', '/account'];

const clearAuthCookies = (response: NextResponse): void => {
  response.cookies.delete(cookieNames.access);
  response.cookies.delete(cookieNames.refresh);
  response.cookies.delete(cookieNames.csrf);
};

const hasAuthCookies = (request: NextRequest): boolean =>
  request.cookies.has(cookieNames.access) || request.cookies.has(cookieNames.refresh);

const hasRefreshCookie = (request: NextRequest): boolean => request.cookies.has(cookieNames.refresh);

const isSessionValid = async (request: NextRequest): Promise<boolean> => {
  try {
    const cookieHeader = request.headers.get('cookie');
    if (!cookieHeader) return false;

    const endpoint = new URL(withClientApiPath('/auth/me'), request.url);
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: { cookie: cookieHeader },
      cache: 'no-store'
    });

    return response.ok;
  } catch {
    return false;
  }
};

export async function middleware(request: NextRequest): Promise<NextResponse> {
  const pathname = request.nextUrl.pathname;

  if (pathname === '/login') {
    if (!hasAuthCookies(request)) {
      return NextResponse.next();
    }

    const valid = await isSessionValid(request);
    if (valid) {
      return NextResponse.redirect(new URL('/', request.url));
    }

    const response = NextResponse.next();
    clearAuthCookies(response);
    return response;
  }

  const needsAuth = protectedPrefixes.some((prefix) => pathname.startsWith(prefix));
  if (!needsAuth) {
    return NextResponse.next();
  }

  if (!hasAuthCookies(request)) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
    return NextResponse.redirect(loginUrl);
  }

  const valid = await isSessionValid(request);
  if (valid) {
    return NextResponse.next();
  }

  if (hasRefreshCookie(request)) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', `${pathname}${request.nextUrl.search}`);
  const response = NextResponse.redirect(loginUrl);
  clearAuthCookies(response);
  return response;
}

export const config = {
  matcher: ['/admin/:path*', '/account/:path*', '/login']
};
