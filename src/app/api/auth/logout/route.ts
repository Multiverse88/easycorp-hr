import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function POST() {
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

  await supabase.auth.signOut();
  cookieStore.set('session_date', '', { path: '/', maxAge: 0, sameSite: 'lax' });

  return Response.json({ success: true });
}
