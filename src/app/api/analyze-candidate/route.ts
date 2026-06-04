import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getSelectionTestResultByCandidate,
  getInterviewEvaluationByCandidate,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

// ─── helper ─────────────────────────────────────────────────────────────────

function pct(v: number) {
  return `${Math.round(v * 100)}%`;
}

function buildPrompt(data: {
  candidate: Awaited<ReturnType<typeof getCandidateById>>;
  disc: Awaited<ReturnType<typeof getDiscTestResultByCandidate>>;
  wpt: Awaited<ReturnType<typeof getWptTestResultByCandidate>>;
  koran: Awaited<ReturnType<typeof getKoranTestResultByCandidate>>;
  selection: Awaited<ReturnType<typeof getSelectionTestResultByCandidate>>;
  interview: Awaited<ReturnType<typeof getInterviewEvaluationByCandidate>>;
}): string {
  const { candidate, disc, wpt, koran, selection, interview } = data;
  if (!candidate) return '';

  const lines: string[] = [];

  lines.push(`=== DATA KANDIDAT ===`);
  lines.push(`Nama       : ${candidate.nama}`);
  lines.push(`Posisi     : ${candidate.posisi_dilamar}`);
  lines.push(`Pendidikan : ${candidate.pendidikan || '-'}`);
  lines.push(`Pengalaman : ${candidate.pengalaman || '-'}`);
  lines.push(`Keahlian   : ${candidate.keahlian || '-'}`);

  lines.push(`\n=== A. PROFIL KEPRIBADIAN (DISC TEST) ===`);
  if (disc) {
    lines.push(`D (Dominance)       : ${disc.persen_d}%`);
    lines.push(`I (Influence)       : ${disc.persen_i}%`);
    lines.push(`S (Steadiness)      : ${disc.persen_s}%`);
    lines.push(`C (Conscientiousness): ${disc.persen_c}%`);
    lines.push(`Tipe Primer         : ${disc.tipe_primer}`);
    lines.push(`Tipe Sekunder       : ${disc.tipe_sekunder}`);
  } else {
    lines.push(`(Tes DISC belum dikerjakan)`);
  }

  lines.push(`\n=== B. KEMAMPUAN INTELEKTUAL (WPT / IQ TEST) ===`);
  if (wpt) {
    lines.push(`Skor Total  : ${wpt.skor} / ${wpt.total_soal}`);
    lines.push(`Persentil   : ${pct(wpt.persen_benar)}`);
    lines.push(`Kategori    : ${wpt.kategori}`);
    if (wpt.profil_kemampuan?.length) {
      lines.push(`Profil per Kategori:`);
      wpt.profil_kemampuan.forEach(p => {
        lines.push(`  - ${p.category}: ${p.benar}/${p.total} (${pct(p.persen)}) - ${p.keterangan}`);
      });
    }
    if (wpt.rekomendasi_posisi?.length) {
      lines.push(`Kesesuaian Posisi:`);
      wpt.rekomendasi_posisi.forEach(r => {
        lines.push(`  - ${r.posisi}: ${r.status} (min ${r.skorMin}, ideal ${r.skorIdeal}) — ${r.rekomendasi}`);
      });
    }
  } else {
    lines.push(`(Tes WPT belum dikerjakan)`);
  }

  lines.push(`\n=== C. TES KORAN (PAULI / KRAEPELIN) ===`);
  if (koran) {
    const ar = koran.analysis_result;
    lines.push(`Kecepatan Kerja   : ${ar.kecepatan}`);
    lines.push(`Ketelitian Kerja  : ${ar.ketelitian}`);
    lines.push(`Konsistensi       : ${ar.konsistensi}`);
    lines.push(`Ketahanan Kerja   : ${ar.ketahanan}`);
    lines.push(`Analisis Mendalam : ${ar.reasoning}`);
    lines.push(`Rekomendasi AI    : ${ar.rekomendasi}`);
  } else {
    lines.push(`(Tes Koran belum dikerjakan)`);
  }

  lines.push(`\n=== D. HASIL TES SELEKSI ===`);
  if (selection) {
    lines.push(`Tanggal Tes   : ${selection.tanggal_tes}`);
    lines.push(`Penyelenggara : ${selection.penyelenggara}`);
    lines.push(`Komponen:`);
    selection.komponen.forEach(k => {
      lines.push(`  - ${k.nama}: Nilai ${k.nilai || '-'}, Batas ${k.batas_lulus || '-'}${k.catatan ? `, Catatan: ${k.catatan}` : ''}`);
    });
    lines.push(`Kesimpulan    : ${selection.kesimpulan}`);
    if (selection.catatan_akhir) lines.push(`Catatan Akhir : ${selection.catatan_akhir}`);
  } else {
    lines.push(`(Tes Seleksi belum dikerjakan)`);
  }

  lines.push(`\n=== E. EVALUASI INTERVIEW ===`);
  if (interview) {
    lines.push(`Tanggal      : ${interview.tanggal}`);
    lines.push(`Tahap        : ${interview.tahap}`);
    lines.push(`Interviewer  : ${interview.interviewer}`);
    lines.push(`Metode       : ${interview.metode}`);
    lines.push(`Ekspektasi Gaji       : ${interview.ekspektasi_gaji ? `Rp ${interview.ekspektasi_gaji.toLocaleString('id-ID')}` : '-'}`);
    lines.push(`Ketersediaan Bergabung: ${interview.ketersediaan_bergabung || '-'}`);
    lines.push(`Total Skor   : ${interview.total_skor}`);
    if (interview.penilaian?.length) {
      lines.push(`Penilaian per Aspek:`);
      interview.penilaian.forEach(p => {
        lines.push(`  - ${p.aspek}: ${p.skor || '-'}${p.catatan ? ` (${p.catatan})` : ''}`);
      });
    }
    if (interview.kelebihan) lines.push(`Kelebihan    : ${interview.kelebihan}`);
    if (interview.area_digali) lines.push(`Area Digali  : ${interview.area_digali}`);
    if (interview.catatan) lines.push(`Catatan      : ${interview.catatan}`);
    lines.push(`Rekomendasi  : ${interview.rekomendasi}`);
  } else {
    lines.push(`(Evaluasi Interview belum diisi)`);
  }

  return lines.join('\n');
}

// ─── route handler ────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId wajib diisi' }, { status: 400 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    const [disc, wpt, koran, selection, interview] = await Promise.all([
      getDiscTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getKoranTestResultByCandidate(candidateId),
      getSelectionTestResultByCandidate(candidateId),
      getInterviewEvaluationByCandidate(candidateId),
    ]);

    const candidateDataText = buildPrompt({ candidate, disc, wpt, koran, selection, interview });

    const systemPrompt = `Anda adalah HR Psikolog Senior dan Konsultan Rekrutmen berpengalaman lebih dari 15 tahun di industri hukum (law firm). 
Tugas Anda adalah menganalisis data kandidat secara komprehensif dan menghasilkan laporan psikologi rekrutmen yang profesional, objektif, dan terstruktur.
Gunakan bahasa Indonesia yang formal, lugas, dan profesional.
Anda harus mengintegrasikan seluruh data (DISC, WPT, Tes Koran, Tes Seleksi, Interview) menjadi satu narasi analisis yang kohesif.`;

    const userPrompt = `Berikut adalah data lengkap kandidat yang perlu Anda analisis:

${candidateDataText}

---

Berdasarkan data di atas, buatlah LAPORAN ANALISIS PSIKOLOGI REKRUTMEN yang komprehensif dalam format JSON berikut:

{
  "ringkasan_eksekutif": "Paragraf ringkas 3-4 kalimat yang merangkum profil kandidat secara keseluruhan untuk pengambil keputusan.",
  
  "profil_kepribadian": {
    "narasi": "Analisis mendalam 2-3 paragraf mengenai kepribadian kandidat berdasarkan hasil DISC. Jelaskan karakteristik dominan, gaya kerja, pola komunikasi, dan implikasinya untuk posisi yang dilamar.",
    "kekuatan": ["kekuatan 1", "kekuatan 2", "kekuatan 3"],
    "area_pengembangan": ["area 1", "area 2"]
  },
  
  "kemampuan_intelektual": {
    "narasi": "Analisis 1-2 paragraf mengenai kapasitas intelektual berdasarkan WPT. Bandingkan skor dengan standar posisi, jelaskan kemampuan analitis, daya nalar, dan kecepatan berpikir.",
    "kesesuaian_posisi": "Penjelasan singkat mengenai kesesuaian IQ dengan kebutuhan posisi."
  },
  
  "daya_tahan_kerja": {
    "narasi": "Analisis 1-2 paragraf mengenai aspek psikomotor dan ketahanan kerja berdasarkan Tes Koran. Korelasikan dengan tuntutan pekerjaan posisi yang dilamar.",
    "kesimpulan": "Lulus | Dipertimbangkan | Tidak Lulus"
  },
  
  "kompetensi_interview": {
    "narasi": "Analisis 1-2 paragraf mengenai performa interview, kompetensi yang teridentifikasi, dan keselarasan ekspektasi kandidat dengan perusahaan.",
    "highlight": ["kompetensi menonjol 1", "kompetensi menonjol 2"]
  },
  
  "analisis_integrasi": "Analisis integratif 2-3 paragraf yang menghubungkan semua aspek (kepribadian, kecerdasan, daya tahan, performa interview) menjadi gambaran kandidat yang utuh. Identifikasi apakah ada konsistensi atau inkonsistensi antar data.",
  
  "potensi_risiko": ["risiko atau concern 1", "risiko atau concern 2"],
  
  "rekomendasi_onboarding": "Saran 1-2 paragraf mengenai pendekatan onboarding yang sesuai, kebutuhan coaching/mentoring, dan area yang perlu diperhatikan jika kandidat diterima.",
  
  "kesimpulan_akhir": {
    "rekomendasi": "Sangat Direkomendasikan | Direkomendasikan | Dipertimbangkan | Tidak Direkomendasikan",
    "catatan": "1-2 kalimat penjelasan singkat atas rekomendasi tersebut.",
    "skor_keseluruhan": 85
  }
}

PENTING:
- Kembalikan HANYA raw JSON yang valid, tanpa markdown fence \`\`\`json, tanpa teks pembuka/penutup apapun.
- Field "skor_keseluruhan" adalah angka 0-100 yang merepresentasikan keseluruhan penilaian kandidat.
- Rekomendasi harus konsisten dengan data yang ada.
- Jika data tertentu tidak tersedia (misalnya tes belum dikerjakan), tetap berikan analisis berdasarkan data yang ada dan tandai keterbatasan analisis tersebut.`;

    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY tidak dikonfigurasi' }, { status: 500 });
    }

    const aiResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'https://easylegal-recruitment.app',
        'X-Title': 'EasyLegal HR Recruitment System',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4-5',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        max_tokens: 4096,
        temperature: 0.3,
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error('OpenRouter error:', errText);
      throw new Error(`OpenRouter API error ${aiResponse.status}: ${errText.substring(0, 300)}`);
    }

    const aiResult = await aiResponse.json();
    const content = aiResult.choices?.[0]?.message?.content as string | undefined;

    if (!content) {
      throw new Error('Respons AI kosong.');
    }

    // Strip markdown fence if present
    let cleanJson = content.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    let analysis;
    try {
      analysis = JSON.parse(cleanJson);
    } catch {
      console.error('JSON parse error — raw content:', cleanJson.substring(0, 500));
      throw new Error('AI tidak mengembalikan JSON yang valid.');
    }

    return NextResponse.json({
      success: true,
      candidateId,
      candidateName: candidate.nama,
      generatedAt: new Date().toISOString(),
      analysis,
    });
  } catch (error) {
    console.error('analyze-candidate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}
