import { NextResponse, type NextRequest } from 'next/server';

function getWIBDate(): string {
  const now = new Date();
  const wibOffset = 7 * 60; // +7 jam dalam menit
  const wibDate = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
  return wibDate.toISOString().split('T')[0]; // YYYY-MM-DD
}

export async function middleware(request: NextRequest) {
  const hostname = request.headers.get('host') || '';
  const url = request.nextUrl;
  const path = url.pathname;

  // Detect environment
  const isLocalhost = hostname.startsWith('localhost') || hostname.startsWith('127.0.0.1');
  const isDiscSubdomain = hostname.startsWith('disc.');
  const isDashboardSubdomain = hostname.startsWith('dashboard.');

  // === LOCALHOST: skip semua redirect subdomain, treat as dashboard ===
  if (isLocalhost) {
    if (path === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }

    // Halaman kandidat: skip session check (akses via token, bukan login HR)
    const isCandidatePage = path.startsWith('/wpt/') || path.startsWith('/disc/') || path.startsWith('/apply/') || path.startsWith('/masuk');

    // Session expiry check hanya untuk halaman HR (bukan halaman kandidat)
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

  // === SESSION EXPIRY CHECK (dashboard subdomain only) ===
  // Logout otomatis jika sudah lewat tengah malam WIB
  if (isDashboardSubdomain && !path.startsWith('/login')) {
    const sessionDate = request.cookies.get('session_date')?.value;
    const todayWIB = getWIBDate();

    if (!sessionDate || sessionDate !== todayWIB) {
      // Session expired — hapus semua cookie Supabase
      const response = NextResponse.redirect(new URL('/login', request.url));
      request.cookies.getAll().forEach((cookie) => {
        if (cookie.name.startsWith('sb-') || cookie.name === 'session_date') {
          response.cookies.delete(cookie.name);
        }
      });
      return response;
    }
  }

  // === SUBDOMAIN: disc.easyai.id (Kandidat) ===
  if (isDiscSubdomain) {
    if (path === '/') {
      return NextResponse.redirect(new URL('/masuk', request.url));
    }
    if (path.startsWith('/dashboard') || path.startsWith('/login')) {
      return NextResponse.redirect(new URL('/masuk', request.url));
    }
    return NextResponse.next();
  }

  // === SUBDOMAIN: dashboard.easyai.id (HR Internal) ===
  if (isDashboardSubdomain) {
    if (path === '/') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    if (path.startsWith('/masuk') || path.startsWith('/apply/') || path === '/disc') {
      return NextResponse.redirect(new URL('/login', request.url));
    }
    return NextResponse.next();
  }

  // === MAIN DOMAIN: easyai.id → redirect to subdomains ===
  const protocol = request.nextUrl.protocol;

  if (path === '/' || path === '/login') {
    return NextResponse.redirect(new URL(`${protocol}//dashboard.easyai.id/login`, request.url));
  }

  if (path === '/masuk' || path.startsWith('/apply/') || path.startsWith('/disc/')) {
    return NextResponse.redirect(new URL(`${protocol}//disc.easyai.id${path}`, request.url));
  }

  if (path.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL(`${protocol}//dashboard.easyai.id${path}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
