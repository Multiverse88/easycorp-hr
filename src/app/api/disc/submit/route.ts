import { NextResponse } from 'next/server';
import { getCandidateByToken, saveDiscTestResult } from '@/lib/db';
import { calculateDiscResult } from '@/lib/discParser';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token, answers } = body;

    if (!token || !answers || !Array.isArray(answers)) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const candidate = await getCandidateByToken(token);
    if (!candidate) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 404 });
    }

    // Calculate DISC scores using the parser
    const result = calculateDiscResult(answers);

    // Save to database
    const discResult = await saveDiscTestResult({
      candidate_id: candidate.id,
      answers,
      skor_d: result.D.m,
      skor_i: result.I.m,
      skor_s: result.S.m,
      skor_c: result.C.m,
      persen_d: result.D.percent,
      persen_i: result.I.percent,
      persen_s: result.S.percent,
      persen_c: result.C.percent,
      tipe_primer: result.primary,
      tipe_sekunder: result.secondary,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json(discResult);
  } catch {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
