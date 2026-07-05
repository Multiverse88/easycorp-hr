import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  const cookieStore = await cookies();

  const supabase = createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
      db: {
        schema: 'easycorp',
      },
    }
  );

  const { email, password } = await request.json();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return Response.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  const now = new Date();
  const wibOffset = 7 * 60;
  const wibDate = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
  const dateStr = wibDate.toISOString().split('T')[0];
  cookieStore.set('session_date', dateStr, { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });

  return Response.json({ success: true });
}
