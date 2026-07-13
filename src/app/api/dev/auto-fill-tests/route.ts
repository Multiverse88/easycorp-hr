import { NextResponse } from 'next/server';
import { getCandidateById } from '@/lib/db';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { MOCK_DISC_RESULT, MOCK_WPT_RESULT, MOCK_PAPIKOSTIK_RESULTS, MOCK_KORAN_RESULT } from '@/lib/mock-data';

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function POST(req: Request) {
  try {
    const { candidateId } = await req.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const candidate = await getCandidateById(candidateId);
    if (!candidate) {
      return NextResponse.json({ error: 'Candidate not found' }, { status: 404 });
    }

    // Generate Randomized DISC
    const d = randomInt(5, 25);
    const i = randomInt(5, 25);
    const s = randomInt(5, 25);
    const c = randomInt(5, 25);
    const total = d + i + s + c;
    const pD = Math.round((d / total) * 100);
    const pI = Math.round((i / total) * 100);
    const pS = Math.round((s / total) * 100);
    const pC = Math.round((c / total) * 100);
    
    // Find highest
    const scores = [
      { type: 'D', score: pD },
      { type: 'I', score: pI },
      { type: 'S', score: pS },
      { type: 'C', score: pC },
    ].sort((a, b) => b.score - a.score);

    const discTypes = ['D', 'I', 'S', 'C'];
    const discAnswers = Array.from({ length: 24 }).map((_, idx) => {
      const most = discTypes[randomInt(0, 3)];
      let least = discTypes[randomInt(0, 3)];
      while (least === most) least = discTypes[randomInt(0, 3)];
      return { questionId: idx + 1, most, least };
    });

    const discPayload = {
      id: `dev-disc-${Date.now()}`,
      candidate_id: candidateId,
      skor_d: d,
      skor_i: i,
      skor_s: s,
      skor_c: c,
      persen_d: pD,
      persen_i: pI,
      persen_s: pS,
      persen_c: pC,
      tipe_primer: scores[0].type,
      tipe_sekunder: scores[1].type,
      answers: discAnswers,
      completed_at: new Date().toISOString()
    };

    // Generate Randomized WPT
    const wptSkor = randomInt(20, 50);
    const persenBenar = wptSkor / 50;
    let kategori = 'Sangat Baik';
    if (wptSkor < 25) kategori = 'Kurang';
    else if (wptSkor < 30) kategori = 'Cukup';
    else if (wptSkor < 35) kategori = 'Baik';
    else if (wptSkor < 40) kategori = 'Sangat Baik';
    else kategori = 'Superior';

    const wptOptions = ['A', 'B', 'C', 'D', 'E'];
    const wptAnswers = Array.from({ length: 50 }).map((_, idx) => ({
      questionId: idx + 1,
      answer: wptOptions[randomInt(0, 4)]
    }));

    const wptPayload = {
      id: `dev-wpt-${Date.now()}`,
      candidate_id: candidateId,
      skor: wptSkor,
      total_soal: 50,
      persen_benar: persenBenar,
      kategori,
      profil_kemampuan: [
        { category: 'Verbal', total: 10, benar: randomInt(5, 10), persen: randomInt(50, 100), keterangan: 'Tinggi' },
        { category: 'Numerik', total: 10, benar: randomInt(4, 10), persen: randomInt(40, 100), keterangan: 'Sedang' },
        { category: 'Logika', total: 10, benar: randomInt(6, 10), persen: randomInt(60, 100), keterangan: 'Tinggi' }
      ],
      rekomendasi_posisi: MOCK_WPT_RESULT.rekomendasi_posisi,
      answers: wptAnswers,
      completed_at: new Date().toISOString()
    };

    // Generate Randomized PAPI
    const randomPapi = Object.entries(MOCK_PAPIKOSTIK_RESULTS).map(([code, data]: [string, any]) => ({
      kode: code,
      aspek: data.deskripsi,
      skor: randomInt(1, 9),
      deskripsi_skor: data.interpretasi
    }));

    const papiAnswers: Record<string, 'a' | 'b'> = {};
    for (let i = 1; i <= 90; i++) {
      papiAnswers[i.toString()] = randomInt(0, 1) === 0 ? 'a' : 'b';
    }

    const papiPayload = {
      candidate_id: candidateId,
      nama_file: 'auto-generated-dev.pdf',
      results: randomPapi,
      completed_at: new Date().toISOString()
    };

    const papiSessionPayload = {
      id: `ps-dev-${Date.now()}`,
      candidate_id: candidateId,
      token: `dev-${Date.now()}`,
      status: 'COMPLETED',
      current_page: 10,
      answers: papiAnswers,
      results: randomPapi,
      created_at: new Date().toISOString()
    };

    // Generate Randomized KORAN
    const koranBenar = randomInt(1200, 2000);
    const kecepatan = randomInt(50, 90);
    const akurasi = randomInt(50, 90);
    const keajegan = randomInt(50, 90);
    const ketahanan = randomInt(50, 90);
    const koranRekomendasi = akurasi > 75 && kecepatan > 75 ? 'Lulus' : (akurasi > 60 ? 'Dipertimbangkan' : 'Tidak Lulus');

    const koranPayload = {
      id: `dev-koran-${Date.now()}`,
      candidate_id: candidateId,
      nama_file: 'auto-generated-koran.jpg',
      foto_url: 'https://placeholder.co/600x800',
      analysis_result: {
        kecepatan: `${kecepatan} SEDANG`,
        ketelitian: `${akurasi} RENDAH`,
        konsistensi: `${keajegan} CUKUP TINGGI`,
        ketahanan: `${ketahanan} CUKUP TINGGI`,
        reasoning: 'Generated by developer auto-fill tool.',
        rekomendasi: koranRekomendasi,
        total_benar: koranBenar,
        total_salah: randomInt(10, 100),
        kecepatan_nilai: kecepatan,
        kecepatan_kategori: 'SEDANG',
        akurasi_nilai: akurasi,
        akurasi_kategori: 'RENDAH',
        keajegan_nilai: keajegan,
        keajegan_kategori: 'CUKUP TINGGI',
        ketahanan_nilai: ketahanan,
        ketahanan_kategori: 'CUKUP TINGGI',
        pola_grafik: 'Grafik fluktuatif.'
      },
      created_at: new Date().toISOString()
    };

    // Generate Randomized Interview
    const interviewAspek = ['Sikap & Perilaku', 'Komunikasi', 'Pengetahuan Teknis', 'Kecerdasan Emosional', 'Motivasi'];
    const penilaian = interviewAspek.map(aspek => ({
      aspek,
      skor: randomInt(3, 5),
      catatan: `Kandidat menunjukkan performa yang ${['baik', 'sangat baik', 'cukup memuaskan'][randomInt(0, 2)]} pada aspek ini.`
    }));

    const interviewPayload = {
      id: `ie-dev-${Date.now()}`,
      candidate_id: candidateId,
      tanggal: new Date().toISOString().split('T')[0],
      tahap: 'HRGA',
      interviewer: 'Developer Auto',
      metode: 'Online',
      ekspektasi_gaji: randomInt(5, 15) * 1000000,
      ketersediaan_bergabung: 'ASAP',
      total_skor: randomInt(60, 95),
      rekomendasi: randomInt(0, 1) === 1 ? 'Lanjut Tahap Berikutnya' : 'Talent Pool',
      penilaian,
      kelebihan: 'Generated via Auto Fill Tool (Tidak menggunakan AI)',
      area_digali: 'Logika dasar dan algoritma',
      catatan: 'Hasil simulasi acak.'
    };

    // Upsert or insert (to avoid duplicates we just delete existing ones first for this candidate)
    await Promise.all([
      supabaseAdmin.from('disc_tests').delete().eq('candidate_id', candidateId),
      supabaseAdmin.from('wpt_tests').delete().eq('candidate_id', candidateId),
      supabaseAdmin.from('papikostik_test_results').delete().eq('candidate_id', candidateId),
      supabaseAdmin.from('papikostik_sessions').delete().eq('candidate_id', candidateId),
      supabaseAdmin.from('koran_tests').delete().eq('candidate_id', candidateId),
      supabaseAdmin.from('interview_evaluations').delete().eq('candidate_id', candidateId),
      supabaseAdmin.from('candidate_ai_analysis').delete().eq('candidate_id', candidateId) // Reset AI so they can rerun it
    ]);

    const [
      discRes,
      wptRes,
      papiRes,
      papiSessionRes,
      koranRes,
      interviewRes
    ] = await Promise.all([
      supabaseAdmin.from('disc_tests').insert(discPayload),
      supabaseAdmin.from('wpt_tests').insert(wptPayload),
      supabaseAdmin.from('papikostik_test_results').insert(papiPayload),
      supabaseAdmin.from('papikostik_sessions').insert(papiSessionPayload),
      supabaseAdmin.from('koran_tests').insert(koranPayload),
      supabaseAdmin.from('interview_evaluations').insert(interviewPayload)
    ]);

    if (interviewRes.error) console.error('Interview Insert Error:', interviewRes.error);
    if (koranRes.error) console.error('Koran Insert Error:', koranRes.error);
    if (discRes.error) console.error('DISC Insert Error:', discRes.error);
    if (wptRes.error) console.error('WPT Insert Error:', wptRes.error);
    if (papiRes.error) console.error('PAPI Insert Error:', papiRes.error);
    if (papiSessionRes.error) console.error('PAPI Session Insert Error:', papiSessionRes.error);

    if (interviewRes.error || koranRes.error || discRes.error || wptRes.error) {
      throw new Error(`Sebagian data gagal diinput. Interview: ${interviewRes.error?.message || 'OK'}, Koran: ${koranRes.error?.message || 'OK'}, DISC: ${discRes.error?.message || 'OK'}, WPT: ${wptRes.error?.message || 'OK'}`);
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Auto fill tests error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
