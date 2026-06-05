import { NextResponse } from 'next/server';
import { getCandidates, getDiscTestResultByCandidate } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const candidates = await getCandidates();

    const data = await Promise.all(candidates.map(async (cand) => {
      const disc = await getDiscTestResultByCandidate(cand.id);

      return {
        'Nama': cand.nama,
        'Email': cand.email,
        'Telepon': cand.telepon,
        'Posisi': cand.posisi_dilamar,
        'Status': cand.status,
        'Pendidikan': cand.pendidikan || '-',
        'Pengalaman': cand.pengalaman || '-',
        'DISC Primer': disc?.tipe_primer || '-',
        'DISC Sekunder': disc?.tipe_sekunder || '-',
        'DISC D%': disc?.persen_d || '-',
        'DISC I%': disc?.persen_i || '-',
        'DISC S%': disc?.persen_s || '-',
        'DISC C%': disc?.persen_c || '-',
      };
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=candidates-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error) {
    console.error('Export candidates error:', error);
    return NextResponse.json({ error: 'Gagal export' }, { status: 500 });
  }
}
