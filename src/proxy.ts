import { NextResponse, type NextRequest } from 'next/server';

function getWIBDate(): string {
  const now = new Date();
  const wibOffset = 7 * 60; // +7 jam dalam menit
  const wibDate = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
  return wibDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function proxy(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  const path = url.pathname;

  // Log incoming request
  console.log(`[${new Date().toISOString()}] ${request.method} ${hostname}${path}`);

  // Jangan intercept API routes
  if (path.startsWith('/api/')) {
    return NextResponse.next();
  }

  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  const isCandidatePage =
    path.startsWith('/wpt/') ||
    path.startsWith('/disc/') ||
    path.startsWith('/apply/') ||
    path.startsWith('/koran/') ||
    path.startsWith('/papikostik/') ||
    path.startsWith('/masuk');

  // Semua halaman publik memakai satu domain kanonis.
  if (!isLocalhost && hostname.split(':')[0] !== 'hr.easycorp.id') {
    const canonicalPath = path === '/' ? '/login' : path;
    return NextResponse.redirect(new URL(`https://hr.easycorp.id${canonicalPath}`, request.url));
  }
  if (path === '/') {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Session expiry check hanya untuk halaman HR.
  if (!path.startsWith('/login') && !isCandidatePage) {
    const sessionDate = request.cookies.get('session_date')?.value;
    const todayWIB = getWIBDate();
    if (!sessionDate || sessionDate !== todayWIB) {
      const response = NextResponse.redirect(new URL('/login', request.url));
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-') || cookie.name === 'session_date') {
          response.cookies.delete(cookie.name);
        }
      });
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
