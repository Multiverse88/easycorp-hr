import { NextResponse } from 'next/server';
import { saveManpowerRequest } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveManpowerRequest(body);
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
