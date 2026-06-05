import { NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';
import { updateCandidateStatus } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { id, status } = await request.json();

    if (!id || !status) {
      return NextResponse.json({ error: 'id and status required' }, { status: 400 });
    }

    const validStatuses = ['interview_user', 'offering', 'reject'];
    if (!validStatuses.includes(status)) {
      return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
    }

    const result = await updateCandidateStatus(id, status);
    if (!result) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Revalidate cache halaman kandidat agar data ter-update
    revalidatePath('/dashboard/kandidat');
    revalidatePath(`/dashboard/kandidat/${id}`);

    return NextResponse.json(result);
  } catch (error) {
    console.error('Candidate status error:', error);
    return NextResponse.json({ error: 'Gagal update status' }, { status: 500 });
  }
}
