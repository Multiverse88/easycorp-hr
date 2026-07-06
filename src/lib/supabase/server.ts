import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server actions can't set cookies — ignore
          }
        },
      },
      db: {
        schema: 'easycorp',
      },
    }
  );
}

export async function getUserRole() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  try {
    // We use supabaseAdmin here because the authenticated user might not have
    // usage privileges granted on the custom 'easycorp' schema by default.
    const { supabaseAdmin } = await import('@/lib/supabase/admin');
    const { data, error } = await supabaseAdmin
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (error) {
      console.error('Error fetching role:', error);
      return 'hr';
    }

    return data?.role || 'hr';
  } catch (err) {
    console.error('Exception fetching role:', err);
    return 'hr'; // Default if table doesn't exist yet
  }
}
