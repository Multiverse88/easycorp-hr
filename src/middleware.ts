import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  const path = url.pathname;

  // Detect subdomain
  const isDiscSubdomain = hostname.startsWith('disc.');
  const isDashboardSubdomain = hostname.startsWith('dashboard.');

  // === SUBDOMAIN: disc.easyai.id (Kandidat) ===
  if (isDiscSubdomain) {
    // Root → redirect to /masuk
    if (path === '/') {
      return NextResponse.redirect(new URL('/masuk', request.url));
    }

    // Block dashboard & login routes
    if (path.startsWith('/dashboard') || path.startsWith('/login')) {
      return NextResponse.redirect(new URL('/masuk', request.url));
    }

    return NextResponse.next();
  }

  // === SUBDOMAIN: dashboard.easyai.id (HR Internal) ===
  if (isDashboardSubdomain) {
    // Root → redirect to /login
    if (path === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Block candidate routes
    if (path.startsWith('/masuk') || path.startsWith('/apply/') || path === '/disc') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    return NextResponse.next();
  }

  // === MAIN DOMAIN: easyai.id → redirect to subdomains ===
  if (path === '/' || path === '/login') {
    return NextResponse.redirect(new URL('https://dashboard.easyai.id/login', request.url));
  }

  if (path === '/masuk' || path.startsWith('/apply/') || path.startsWith('/disc/')) {
    return NextResponse.redirect(new URL(`https://disc.easyai.id${path}`, request.url));
  }

  if (path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL(`https://dashboard.easyai.id${path}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
