import { createServerClient } from '@supabase/ssr';
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
    // Block dashboard & login routes on disc subdomain
    if (path.startsWith('/dashboard') || path.startsWith('/login')) {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // === SUBDOMAIN: dashboard.easyai.id (HR Internal) ===
  if (isDashboardSubdomain) {
    // Block candidate routes on dashboard subdomain
    if (path.startsWith('/masuk') || path.startsWith('/apply/') || path === '/disc') {
      url.pathname = '/';
      return NextResponse.redirect(url);
    }

    // Skip middleware for login page to avoid redirect loop
    if (path === '/login') {
      return NextResponse.next();
    }

    // Auth check for other routes
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Not authenticated → redirect to login
    if (!user) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // === MAIN DOMAIN: easyai.id → redirect to subdomains ===
  if (path === '/' || path === '/login') {
    url.hostname = 'dashboard.easyai.id';
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  if (path === '/masuk' || path.startsWith('/apply/') || path.startsWith('/disc/')) {
    url.hostname = 'disc.easyai.id';
    return NextResponse.redirect(url);
  }

  if (path.startsWith('/dashboard')) {
    url.hostname = 'dashboard.easyai.id';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
