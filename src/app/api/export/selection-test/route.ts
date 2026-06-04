import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateById,
  getSelectionTestResultByCandidate,
  getWptTestResultByCandidate,
  getDiscTestResultByCandidate,
} from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import PizZip from 'pizzip';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// Replace the content of the Nth <w:t> element in the XML
function replaceNthTextElement(xml: string, n: number, newValue: string): string {
  const regex = /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g;
  let count = 0;
  let result = xml;
  let lastIndex = 0;

  while (count < n) {
    regex.lastIndex = lastIndex;
    const match = regex.exec(result);
    if (!match) return result;
    count++;
    if (count === n) {
      const fullMatch = match[0];
      const before = result.substring(0, match.index);
      const after = result.substring(match.index + fullMatch.length);
      result = before + match[1] + newValue + match[3] + after;
      return result;
    }
    lastIndex = match.index + match[0].length;
  }
  return result;
}

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

    const [testResult, wpt, disc] = await Promise.all([
      getSelectionTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getDiscTestResultByCandidate(candidateId),
    ]);
    if (!testResult) {
      return NextResponse.json({ error: 'Belum ada hasil tes seleksi' }, { status: 404 });
    }

    const templatePath = join(process.cwd(), 'FR-HRGA-001.02 _ Form Hasil Tes Seleksi (1).docx');
    const templateBuffer = await readFile(templatePath);
    const zip = new PizZip(templateBuffer);

    let xml = zip.file('word/document.xml')!.asText();

    // Komponen data from DB (order matches template row order)
    const komponenOrder = [
      'Psikotes/DISC',
      'PAPIKOSTIK',
      'Case Study',
      'Tes Adm/Typing/Writing',
      'Tes Bahasa/Komunikasi',
      'Lainnya',
    ];

    const komponenData = komponenOrder.map((nama) => {
      const found = testResult.komponen?.find(k => k.nama === nama);
      let nilai = found?.nilai || '-';
      let batas = found?.batas_lulus || '-';
      let catatan = found?.catatan || '-';

      // Fallback for Psikotes/DISC if empty or hyphen but online test data exists
      if (nama === 'Psikotes/DISC' && (nilai === '-' || nilai === '')) {
        const parts = [];
        if (wpt) parts.push(`WPT: ${wpt.skor}/50`);
        if (disc) parts.push(`DISC: ${disc.tipe_primer.split('—')[0].trim()}`);
        if (parts.length > 0) {
          nilai = parts.join(' | ');
          if (wpt) {
            catatan = `WPT (${wpt.kategori}). ${catatan !== '-' ? catatan : ''}`;
          }
        }
      }

      return {
        nilai,
        batas,
        catatan,
      };
    });

    // === REPLACE BY <w:t> POSITION ===
    // Info table: elements #7, #9, #11 (date), #13, #15, #17
    xml = replaceNthTextElement(xml, 7, candidate.nama);
    xml = replaceNthTextElement(xml, 9, candidate.posisi_dilamar || '-');
    xml = replaceNthTextElement(xml, 11, formatDate(testResult.tanggal_tes));
    xml = replaceNthTextElement(xml, 13, '-'); // Jenis Tes
    xml = replaceNthTextElement(xml, 15, testResult.penyelenggara || '-');
    xml = replaceNthTextElement(xml, 17, '-'); // Lokasi

    // Component table: each row has 3 elements (nilai, batas, catatan)
    // Row 1: elements #23,#24,#25
    // Row 2: elements #27,#28,#29
    // etc.
    for (let row = 0; row < 6; row++) {
      const baseNum = 23 + row * 4; // Each row is 4 elements apart (name + 3 values)
      const data = komponenData[row];
      xml = replaceNthTextElement(xml, baseNum, data.nilai);
      xml = replaceNthTextElement(xml, baseNum + 1, data.batas);
      xml = replaceNthTextElement(xml, baseNum + 2, data.catatan);
    }

    // Kesimpulan: element #46 (contains "[  ] Lulus   [  ] Lulus Bersyarat   [  ] Tidak Lulus")
    let kesimpulanText = '[  ] Lulus   [  ] Lulus Bersyarat   [  ] Tidak Lulus';
    if (testResult.kesimpulan === 'Lulus') {
      kesimpulanText = '[✓] Lulus   [  ] Lulus Bersyarat   [  ] Tidak Lulus';
    } else if (testResult.kesimpulan === 'Lulus Bersyarat') {
      kesimpulanText = '[  ] Lulus   [✓] Lulus Bersyarat   [  ] Tidak Lulus';
    } else if (testResult.kesimpulan === 'Tidak Lulus') {
      kesimpulanText = '[  ] Lulus   [  ] Lulus Bersyarat   [✓] Tidak Lulus';
    }
    xml = replaceNthTextElement(xml, 46, kesimpulanText);

    // Catatan akhir: element #47 (contains "Catatan akhir: " + underscores)
    const catatanAkhirText = `Catatan akhir: ${testResult.catatan_akhir || ''}`;
    xml = replaceNthTextElement(xml, 47, catatanAkhirText);

    // Generate output
    zip.file('word/document.xml', xml);
    const outputBuffer = zip.generate({ type: 'nodebuffer' });

    const safeName = candidate.nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

    return new NextResponse(outputBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="FR-HRGA-001.02-${safeName}.docx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal generate dokumen' }, { status: 500 });
  }
}
