import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import * as XLSX from 'xlsx';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const candidateId = formData.get('candidateId') as string;
    const file = formData.get('file') as File;

    if (!candidateId || !file) {
      return NextResponse.json({ error: 'Missing candidateId or file' }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Parse Excel
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const resultSheetName = workbook.SheetNames.find(s => s.toUpperCase() === 'RESULT');
    
    if (!resultSheetName) {
      return NextResponse.json({ error: 'Format Excel tidak valid. Sheet RESULT tidak ditemukan.' }, { status: 400 });
    }

    const sheet = workbook.Sheets[resultSheetName];
    const data = XLSX.utils.sheet_to_json<any[][]>(sheet, { header: 1 });

    const results = [];
    
    for (let i = 0; i < data.length; i++) {
      const row = data[i];
      if (row.length >= 5) {
        const kode = row[2];
        const skor = row[2];
        const analisis = row[3];
        const aspek = row[1];
        
        if (typeof kode === 'string' && (kode as string).length === 1 && typeof skor === 'number') {
          results.push({
            aspek: aspek,
            kode: kode,
            skor: skor,
            analisis: analisis || ''
          });
        }
      }
    }

    if (results.length === 0) {
      return NextResponse.json({ error: 'Gagal mengekstrak hasil dari file Excel.' }, { status: 400 });
    }

    // Upsert: delete existing then insert
    await prisma.papikostikTestResult.deleteMany({ where: { candidateId } });

    const inserted = await prisma.papikostikTestResult.create({
      data: {
        id: `papi-${Date.now()}`,
        candidateId,
        namaFile: file.name,
        results,
      }
    });

    return NextResponse.json(inserted);
  } catch (error) {
    console.error('Upload papikostik error:', error);
    return NextResponse.json({ error: 'Gagal memproses file' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    await prisma.papikostikTestResult.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete papikostik error:', error);
    return NextResponse.json({ error: 'Gagal menghapus data' }, { status: 500 });
  }
}
