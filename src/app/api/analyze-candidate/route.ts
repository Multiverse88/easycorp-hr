import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getInterviewEvaluationByCandidate,
  getAiAnalysisByCandidate,
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
  interview: Awaited<ReturnType<typeof getInterviewEvaluationByCandidate>>;
}): string {
  const { candidate, disc, wpt, koran, interview } = data;
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

  lines.push(`\n=== D. EVALUASI INTERVIEW ===`);
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

    const [disc, wpt, koran, interview] = await Promise.all([
      getDiscTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getKoranTestResultByCandidate(candidateId),
      getInterviewEvaluationByCandidate(candidateId),
    ]);

    const candidateDataText = buildPrompt({ candidate, disc, wpt, koran, interview });

    const systemPrompt = `Anda adalah HR Psikolog Senior dan Konsultan Rekrutmen berpengalaman lebih dari 15 tahun di industri hukum (law firm). 
Tugas Anda adalah menganalisis data kandidat secara komprehensif dan menghasilkan laporan psikologi rekrutmen yang profesional, objektif, dan terstruktur.
Gunakan bahasa Indonesia yang formal, lugas, dan profesional.
Anda harus mengintegrasikan seluruh data (DISC, WPT, Tes Koran, Interview) menjadi satu narasi analisis yang kohesif.`;

    const userPrompt = `Berikut adalah data lengkap kandidat yang perlu Anda analisis:

${candidateDataText}

---

Berdasarkan data di atas, buatlah LAPORAN ANALISIS PSIKOLOGI REKRUTMEN yang komprehensif dalam format JSON berikut:

{
  "fit_scores": {
    "disc_fit": 85, // Angka 0-100 persen tingkat kecocokan kepribadian DISC dengan kriteria jabatan
    "wpt_fit": 80, // Angka 0-100 persen tingkat kecocokan kognitif WPT dengan kriteria jabatan
    "tes_koran_fit": 75, // Angka 0-100 persen tingkat kecocokan daya tahan/kecepatan Tes Koran dengan kriteria jabatan
    "kesesuaian_overall": 80 // Angka 0-100 persen tingkat kesesuaian gabungan keseluruhan kandidat dengan posisi
  },
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

    let content: string | undefined;
    let tokenUsage: { input_tokens: number; output_tokens: number; total_tokens: number } | undefined = undefined;
    let anthropicError: string | undefined = undefined;
    let openAiError: string | undefined = undefined;
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (apiKey) {
      try {
        const aiResponse = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-opus-20240229',
            system: systemPrompt,
            messages: [
              { role: 'user', content: userPrompt },
            ],
            max_tokens: 4000,
            temperature: 0.3,
          }),
        });

        if (aiResponse.ok) {
          const aiResult = await aiResponse.json();
          content = aiResult.content?.[0]?.text as string | undefined;
          if (aiResult.usage) {
            tokenUsage = {
              input_tokens: aiResult.usage.input_tokens || 0,
              output_tokens: aiResult.usage.output_tokens || 0,
              total_tokens: (aiResult.usage.input_tokens || 0) + (aiResult.usage.output_tokens || 0),
            };
          }
        } else {
          const errText = await aiResponse.text();
          anthropicError = `HTTP ${aiResponse.status}: ${errText}`;
          console.warn('Anthropic API returned error, trying OpenAI fallback:', errText);
        }
      } catch (err) {
        anthropicError = `Network/System error: ${err instanceof Error ? err.message : String(err)}`;
        console.error('Anthropic API call failed, trying OpenAI fallback:', err);
      }
    } else {
      anthropicError = 'API key is not configured in process.env';
    }

    // Fallback to OpenAI if Anthropic didn't succeed
    if (!content) {
      console.log('Using OpenAI fallback for candidate analysis...');
      const openAiKey = process.env.OPENAI_API_KEY?.trim();
      if (!openAiKey) {
        openAiError = 'API key is not configured in process.env';
      } else {
        try {
          const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${openAiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              model: 'gpt-4o',
              messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
              ],
              max_tokens: 4096,
              temperature: 0.3,
              response_format: { type: 'json_object' },
            }),
          });

          if (!openAiResponse.ok) {
            const errText = await openAiResponse.text();
            openAiError = `HTTP ${openAiResponse.status}: ${errText}`;
            console.error(`OpenAI API error ${openAiResponse.status}: ${errText}`);
          } else {
            const openAiResult = await openAiResponse.json();
            content = openAiResult.choices?.[0]?.message?.content as string | undefined;
            if (openAiResult.usage) {
              tokenUsage = {
                input_tokens: openAiResult.usage.prompt_tokens || 0,
                output_tokens: openAiResult.usage.completion_tokens || 0,
                total_tokens: openAiResult.usage.total_tokens || 0,
              };
            }
          }
        } catch (err) {
          openAiError = `Network/System error: ${err instanceof Error ? err.message : String(err)}`;
          console.error('OpenAI API call failed:', err);
        }
      }
    }

    if (!content) {
      throw new Error(`Gagal melakukan analisis. [Anthropic Error: ${anthropicError || 'None'}] [OpenAI Error: ${openAiError || 'None'}]`);
    }

    // Strip markdown fence if present
    let cleanJson = content.trim();
    if (cleanJson.startsWith('```json')) cleanJson = cleanJson.slice(7);
    if (cleanJson.startsWith('```')) cleanJson = cleanJson.slice(3);
    if (cleanJson.endsWith('```')) cleanJson = cleanJson.slice(0, -3);
    cleanJson = cleanJson.trim();

    let analysis;
    try {
      // Basic sanitization: replace raw/unescaped control characters/newlines with escaped equivalents
      // or replace literal newlines within string values.
      // A safe way is to parse normally first.
      analysis = JSON.parse(cleanJson);
    } catch (parseError) {
      console.error('JSON parse error details:', parseError);
      console.error('JSON parse error — full raw content:', cleanJson);
      throw new Error('AI tidak mengembalikan JSON yang valid.');
    }

    const { saveAiAnalysis } = await import('@/lib/db');
    await saveAiAnalysis(candidateId, analysis);

    return NextResponse.json({
      success: true,
      candidateId,
      candidateName: candidate.nama,
      generatedAt: new Date().toISOString(),
      analysis,
      usage: tokenUsage,
    });
  } catch (error) {
    console.error('analyze-candidate error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId wajib diisi' }, { status: 400 });
    }

    const existingAnalysis = await getAiAnalysisByCandidate(candidateId);
    if (!existingAnalysis) {
      return NextResponse.json({ success: true, exists: false });
    }

    return NextResponse.json({
      success: true,
      exists: true,
      candidateId,
      analysis: existingAnalysis.analysis,
      generatedAt: existingAnalysis.created_at || new Date().toISOString(),
    });
  } catch (error) {
    console.error('Check analysis status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
