import { logoutUser } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST() {
  await logoutUser();

  const cookieStore = await cookies();
  cookieStore.set('session_date', '', { path: '/', maxAge: 0, sameSite: 'lax' });

  return Response.json({ success: true });
}
