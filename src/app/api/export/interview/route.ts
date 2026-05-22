import { NextRequest, NextResponse } from 'next/server';
import { getCandidateById, getInterviewEvaluationByCandidate } from '@/lib/db';
import { readFile } from 'fs/promises';
import { join } from 'path';
import PizZip from 'pizzip';

function formatDate(dateStr: string) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${d.getDate().toString().padStart(2, '0')}/${(d.getMonth() + 1).toString().padStart(2, '0')}/${d.getFullYear()}`;
}

// Replace the content of the Nth <w:t> element (1-indexed, counting all including empty)
function replaceNthTextElement(xml: string, n: number, newValue: string): string {
  const regex = /(<w:t(?:\s[^>]*)?>)([\s\S]*?)(<\/w:t>)/g;
  let count = 0;
  let lastIndex = 0;
  let result = xml;

  while (count < n) {
    regex.lastIndex = lastIndex;
    const match = regex.exec(result);
    if (!match) return result;
    count++;
    if (count === n) {
      const before = result.substring(0, match.index);
      const after = result.substring(match.index + match[0].length);
      result = before + match[1] + newValue + match[3] + after;
      return result;
    }
    lastIndex = match.index + match[0].length;
  }
  return result;
}

// Check a checkbox option in a checkbox line (e.g. "[  ] HRGA [  ] User [  ] Final")
function checkOption(line: string, option: string): string {
  return line
    .replace(`[  ] ${option}`, `[✓] ${option}`)
    .replace(`[  ] ${option.toLowerCase()}`, `[✓] ${option.toLowerCase()}`);
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

    const evalData = await getInterviewEvaluationByCandidate(candidateId);
    if (!evalData) {
      return NextResponse.json({ error: 'Belum ada evaluasi interview' }, { status: 404 });
    }

    const templatePath = join(process.cwd(), 'FR-HRGA-001.03 _ Form Evaluasi Interview Kandidat.docx');
    const templateBuffer = await readFile(templatePath);
    const zip = new PizZip(templateBuffer);

    let xml = zip.file('word/document.xml')!.asText();

    // === INFO FIELDS ===
    // #7  Nama Kandidat value
    // #9  Posisi value
    // #11 Tanggal (____/____/______)
    // #13 Tahap Interview checkboxes ([  ] HRGA [  ] User [  ] Final)
    // #15 Interviewer value
    // #17 Metode checkboxes ([  ] Online [  ] Offline)
    // #19 Ekspektasi Gaji (Rp __________________)
    // #21 Ketersediaan Bergabung value

    xml = replaceNthTextElement(xml, 7, candidate.nama);
    xml = replaceNthTextElement(xml, 9, candidate.posisi_dilamar || '-');
    xml = replaceNthTextElement(xml, 11, formatDate(evalData.tanggal));

    // Tahap checkboxes
    let tahapText = '[  ] HRGA [  ] User [  ] Final';
    if (evalData.tahap === 'HRGA') tahapText = checkOption(checkOption('[  ] HRGA [  ] User [  ] Final', 'HRGA'), 'HRGA');
    else if (evalData.tahap === 'User') tahapText = checkOption('[  ] HRGA [  ] User [  ] Final', 'User');
    else if (evalData.tahap === 'Final') tahapText = checkOption('[  ] HRGA [  ] User [  ] Final', 'Final');
    xml = replaceNthTextElement(xml, 13, tahapText);

    xml = replaceNthTextElement(xml, 15, evalData.interviewer || '-');

    // Metode checkboxes
    let metodeText = '[  ] Online [  ] Offline';
    if (evalData.metode === 'Online') metodeText = checkOption('[  ] Online [  ] Offline', 'Online');
    else if (evalData.metode === 'Offline') metodeText = checkOption('[  ] Online [  ] Offline', 'Offline');
    xml = replaceNthTextElement(xml, 17, metodeText);

    // Ekspektasi Gaji (element #19 contains "Rp __________________")
    const gajiText = evalData.ekspektasi_gaji
      ? `Rp ${evalData.ekspektasi_gaji.toLocaleString('id-ID')}`
      : 'Rp -';
    xml = replaceNthTextElement(xml, 19, gajiText);

    xml = replaceNthTextElement(xml, 21, evalData.ketersediaan_bergabung || '-');

    // === PENILAIAN TABLE ===
    // 8 rows, each has: name (odd #) + score (even #)
    // Row 1: #25 Komunikasi, #26 score
    // Row 2: #27 Sikap/Attitude, #28 score
    // Row 3: #29 Integritas, #30 score
    // Row 4: #31 Kesesuaian pengalaman, #32 score
    // Row 5: #33 Kemampuan teknis, #34 score
    // Row 6: #35 Problem solving, #36 score
    // Row 7: #37 Motivasi kerja, #38 score
    // Row 8: #39 Kesesuaian budaya kerja, #40 score

    const aspekNama = [
      'Komunikasi', 'Sikap/Attitude', 'Integritas', 'Kesesuaian pengalaman',
      'Kemampuan teknis', 'Problem solving', 'Motivasi kerja', 'Kesesuaian budaya kerja'
    ];

    for (let i = 0; i < 8; i++) {
      const scoreNum = 26 + i * 2; // #26, #28, #30, #32, #34, #36, #38, #40
      const match = evalData.penilaian?.find(p => p.aspek === aspekNama[i]);
      const skor = match?.skor || 0;
      xml = replaceNthTextElement(xml, scoreNum, skor > 0 ? String(skor) : '___');
    }

    // === RINGKASAN ===
    // #43 Kelebihan kandidat
    // #45 Area yang perlu digali
    // #47 Catatan interviewer
    // #48 Rekomendasi checkboxes
    xml = replaceNthTextElement(xml, 43, evalData.kelebihan || '-');
    xml = replaceNthTextElement(xml, 45, evalData.area_digali || '-');
    xml = replaceNthTextElement(xml, 47, evalData.catatan || '-');

    // Rekomendasi checkboxes
    let rekomText = '[  ] Lanjut tahap berikutnya   [  ] Talent Pool   [  ] Tidak Lanjut';
    if (evalData.rekomendasi === 'Lanjut Tahap Berikutnya') {
      rekomText = '[✓] Lanjut tahap berikutnya   [  ] Talent Pool   [  ] Tidak Lanjut';
    } else if (evalData.rekomendasi === 'Talent Pool') {
      rekomText = '[  ] Lanjut tahap berikutnya   [✓] Talent Pool   [  ] Tidak Lanjut';
    } else if (evalData.rekomendasi === 'Tidak Lanjut') {
      rekomText = '[  ] Lanjut tahap berikutnya   [  ] Talent Pool   [✓] Tidak Lanjut';
    }
    xml = replaceNthTextElement(xml, 48, rekomText);

    // Generate output
    zip.file('word/document.xml', xml);
    const outputBuffer = zip.generate({ type: 'nodebuffer' });

    const safeName = candidate.nama.replace(/[^a-zA-Z0-9\s]/g, '').replace(/\s+/g, '-');

    return new NextResponse(outputBuffer as BodyInit, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="FR-HRGA-001.03-${safeName}.docx"`,
      },
    });
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json({ error: 'Gagal generate dokumen' }, { status: 500 });
  }
}
