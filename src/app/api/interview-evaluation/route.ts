import { NextResponse } from 'next/server';
import { saveInterviewEvaluation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveInterviewEvaluation(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving interview evaluation:', error);
    return NextResponse.json({ error: 'Gagal menyimpan evaluasi interview' }, { status: 500 });
  }
}
