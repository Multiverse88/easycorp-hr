import { NextResponse } from 'next/server';
import { saveSelectionTestResult } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveSelectionTestResult(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving selection test result:', error);
    return NextResponse.json({ error: 'Gagal menyimpan hasil tes' }, { status: 500 });
  }
}
