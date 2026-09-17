import { NextRequest, NextResponse } from 'next/server';
import { saveInterviewEvaluation, deleteInterviewEvaluation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveInterviewEvaluation(body);
    return NextResponse.json(result);
  } catch (error) {
    console.error('Error saving interview evaluation:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal menyimpan evaluasi interview' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    await deleteInterviewEvaluation(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete interview evaluation error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal hapus evaluasi interview' }, { status: 500 });
  }
}
