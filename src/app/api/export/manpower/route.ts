import { NextResponse } from 'next/server';
import { getManpowerRequests } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const requests = await getManpowerRequests();

    const data = requests.map(req => ({
      'No. Request': req.no_request,
      'Tanggal': req.tanggal,
      'Divisi': req.divisi,
      'Pemohon': req.pemohon,
      'Posisi': req.posisi,
      'Jumlah': req.jumlah,
      'Lokasi': req.lokasi,
      'Jenis Kebutuhan': req.jenis_kebutuhan,
      'Urgensi': req.urgensi,
      'Status': req.status,
      'Range Gaji Min': req.range_gaji.min,
      'Range Gaji Max': req.range_gaji.max,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Manpower Requests');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=manpower-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch {
    return NextResponse.json({ error: 'Gagal export' }, { status: 500 });
  }
}
