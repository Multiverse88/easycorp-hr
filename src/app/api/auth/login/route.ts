import { loginUser } from '@/lib/auth';

export async function POST(request: Request) {
  const { email, password } = await request.json();

  if (!email || !password) {
    return Response.json({ error: 'Email dan password harus diisi' }, { status: 400 });
  }

  const user = await loginUser(email, password);

  if (!user) {
    return Response.json({ error: 'Email atau password salah' }, { status: 401 });
  }

  const now = new Date();
  const wibOffset = 7 * 60;
  const wibDate = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
  const dateStr = wibDate.toISOString().split('T')[0];

  const { cookies } = await import('next/headers');
  const cookieStore = await cookies();
  cookieStore.set('session_date', dateStr, { path: '/', maxAge: 60 * 60 * 24, sameSite: 'lax' });

  return Response.json({ success: true });
}
