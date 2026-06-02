import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getSelectionTestResultByCandidate,
  getInterviewEvaluationByCandidate,
} from '@/lib/db';
import { CandidatePdfDocument, type CandidatePdfData } from '@/lib/candidate-pdf-template';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const candidateId = request.nextUrl.searchParams.get('candidateId');

  if (!candidateId) {
    return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
  }

  try {
    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    const [disc, wpt, selection, interview] = await Promise.all([
      getDiscTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getSelectionTestResultByCandidate(candidateId),
      getInterviewEvaluationByCandidate(candidateId),
    ]);

    const pdfData: CandidatePdfData = {
      candidate,
      disc: disc ? {
        persen_d: disc.persen_d,
        persen_i: disc.persen_i,
        persen_s: disc.persen_s,
        persen_c: disc.persen_c,
        tipe_primer: disc.tipe_primer,
        tipe_sekunder: disc.tipe_sekunder,
      } : null,
      wpt: wpt ? {
        skor: wpt.skor,
        total_soal: wpt.total_soal,
        persen_benar: wpt.persen_benar,
        kategori: wpt.kategori,
        profil_kemampuan: wpt.profil_kemampuan,
        rekomendasi_posisi: wpt.rekomendasi_posisi,
      } : null,
      selection: selection ? {
        tanggal_tes: selection.tanggal_tes,
        penyelenggara: selection.penyelenggara,
        komponen: selection.komponen,
        kesimpulan: selection.kesimpulan,
        catatan_akhir: selection.catatan_akhir,
      } : null,
      interview: interview ? {
        tanggal: interview.tanggal,
        tahap: interview.tahap,
        interviewer: interview.interviewer,
        metode: interview.metode,
        ekspektasi_gaji: interview.ekspektasi_gaji,
        ketersediaan_bergabung: interview.ketersediaan_bergabung,
        penilaian: interview.penilaian,
        total_skor: interview.total_skor,
        kelebihan: interview.kelebihan,
        area_digali: interview.area_digali,
        catatan: interview.catatan,
        rekomendasi: interview.rekomendasi,
      } : null,
    };

    // Dynamic import to ensure server build of react-pdf is used (not browser build)
    const { renderToBuffer } = await import('@react-pdf/renderer');
    const buffer = await renderToBuffer(CandidatePdfDocument({ data: pdfData }));

    const safeName = candidate.nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="Data-Kandidat-${safeName}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF export error:', error);
    return NextResponse.json({ error: 'Gagal generate PDF' }, { status: 500 });
  }
}
