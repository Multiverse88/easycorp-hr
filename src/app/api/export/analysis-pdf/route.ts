import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getInterviewEvaluationByCandidate,
} from '@/lib/db';
import { AnalysisPdfDocument, type AnalysisPdfData } from '@/lib/analysis-pdf-template';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const { candidateId, analysis } = await request.json();

    if (!candidateId || !analysis) {
      return NextResponse.json({ error: 'candidateId dan analysis wajib diisi' }, { status: 400 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    const [disc, wpt, koran, interview] = await Promise.all([
      getDiscTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getKoranTestResultByCandidate(candidateId),
      getInterviewEvaluationByCandidate(candidateId),
    ]);

    const pdfData: AnalysisPdfData = {
      candidate,
      analysis,
      disc: disc || null,
      wpt: wpt || null,
      koran: koran || null,
      interview: interview || null,
    };

    const { renderToBuffer } = await import('@react-pdf/renderer');
    const buffer = await renderToBuffer(AnalysisPdfDocument({ data: pdfData }));

    const safeName = candidate.nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Laporan-Psikologi-${safeName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal generate PDF' },
      { status: 500 }
    );
  }
}
