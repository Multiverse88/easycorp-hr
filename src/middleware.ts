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
    // Root → rewrite to /masuk
    if (path === '/') {
      url.pathname = '/masuk';
      return NextResponse.rewrite(url);
    }

    // Block dashboard & login routes on disc subdomain
    if (path.startsWith('/dashboard') || path.startsWith('/login')) {
      url.pathname = '/masuk';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // === SUBDOMAIN: dashboard.easyai.id (HR Internal) ===
  if (isDashboardSubdomain) {
    let supabaseResponse = NextResponse.next({ request });

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
            supabaseResponse = NextResponse.next({ request });
            cookiesToSet.forEach(({ name, value, options }) =>
              supabaseResponse.cookies.set(name, value, options)
            );
          },
        },
      }
    );

    const { data: { user } } = await supabase.auth.getUser();

    // Root → redirect to /dashboard or /login
    if (path === '/') {
      url.pathname = user ? '/dashboard' : '/login';
      return NextResponse.rewrite(url);
    }

    // Block candidate routes on dashboard subdomain
    if (path.startsWith('/masuk') || path.startsWith('/apply/') || path === '/disc') {
      url.pathname = user ? '/dashboard' : '/login';
      return NextResponse.redirect(url);
    }

    // Auth check for protected routes
    const isPublicPath = ['/login'].some((p) => path.startsWith(p));
    if (!user && !isPublicPath) {
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return supabaseResponse;
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
