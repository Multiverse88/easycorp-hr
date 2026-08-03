import { NextResponse } from 'next/server';
import { getCandidateById } from '@/lib/db';
import { prisma } from '@/lib/prisma';
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

    // Generate Randomized KORAN
    const koranBenar = randomInt(1200, 2000);
    const kecepatan = randomInt(50, 90);
    const akurasi = randomInt(50, 90);
    const keajegan = randomInt(50, 90);
    const ketahanan = randomInt(50, 90);
    const koranRekomendasi = akurasi > 75 && kecepatan > 75 ? 'Lulus' : (akurasi > 60 ? 'Dipertimbangkan' : 'Tidak Lulus');

    // Generate Randomized Interview
    const interviewAspek = ['Sikap & Perilaku', 'Komunikasi', 'Pengetahuan Teknis', 'Kecerdasan Emosional', 'Motivasi'];
    const penilaian = interviewAspek.map(aspek => ({
      aspek,
      skor: randomInt(3, 5),
      catatan: `Kandidat menunjukkan performa yang ${['baik', 'sangat baik', 'cukup memuaskan'][randomInt(0, 2)]} pada aspek ini.`
    }));

    const now = new Date().toISOString();

    // Delete existing test data for this candidate first
    await Promise.all([
      prisma.discTest.deleteMany({ where: { candidateId } }),
      prisma.wptTest.deleteMany({ where: { candidateId } }),
      prisma.papikostikTestResult.deleteMany({ where: { candidateId } }),
      prisma.papikostikSession.deleteMany({ where: { candidateId } }),
      prisma.koranTest.deleteMany({ where: { candidateId } }),
      prisma.interviewEvaluation.deleteMany({ where: { candidateId } }),
      prisma.candidateAiAnalysis.deleteMany({ where: { candidateId } }),
    ]);

    // Insert all test data
    await Promise.all([
      prisma.discTest.create({
        data: {
          id: `dev-disc-${Date.now()}`,
          candidateId,
          answers: discAnswers,
          skorD: d, skorI: i, skorS: s, skorC: c,
          persenD: pD, persenI: pI, persenS: pS, persenC: pC,
          tipePrimer: scores[0].type,
          tipeSekunder: scores[1].type,
          completedAt: now,
        }
      }),
      prisma.wptTest.create({
        data: {
          id: `dev-wpt-${Date.now()}`,
          candidateId,
          answers: wptAnswers,
          skor: wptSkor,
          totalSoal: 50,
          persenBenar,
          kategori,
          profilKemampuan: [
            { category: 'Verbal', total: 10, benar: randomInt(5, 10), persen: randomInt(50, 100), keterangan: 'Tinggi' },
            { category: 'Numerik', total: 10, benar: randomInt(4, 10), persen: randomInt(40, 100), keterangan: 'Sedang' },
            { category: 'Logika', total: 10, benar: randomInt(6, 10), persen: randomInt(60, 100), keterangan: 'Tinggi' }
          ],
          rekomendasiPosisi: MOCK_WPT_RESULT.rekomendasi_posisi,
          completedAt: now,
        }
      }),
      prisma.papikostikTestResult.create({
        data: {
          id: `dev-papi-${Date.now()}`,
          candidateId,
          namaFile: 'auto-generated-dev.pdf',
          results: randomPapi,
          completedAt: now,
        }
      }),
      prisma.papikostikSession.create({
        data: {
          id: `ps-dev-${Date.now()}`,
          candidateId,
          token: `dev-${Date.now()}`,
          status: 'COMPLETED',
          currentPage: 10,
          answers: papiAnswers,
          results: randomPapi,
        }
      }),
      prisma.koranTest.create({
        data: {
          id: `dev-koran-${Date.now()}`,
          candidateId,
          namaFile: 'auto-generated-koran.jpg',
          fotoUrl: 'https://placeholder.co/600x800',
          analysisResult: {
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
        }
      }),
      prisma.interviewEvaluation.create({
        data: {
          id: `ie-dev-${Date.now()}`,
          candidateId,
          tanggal: new Date().toISOString().split('T')[0],
          tahap: 'HRGA',
          interviewer: 'Developer Auto',
          metode: 'Online',
          ekspektasiGaji: randomInt(5, 15) * 1000000,
          ketersediaanBergabung: 'ASAP',
          totalSkor: randomInt(60, 95),
          rekomendasi: randomInt(0, 1) === 1 ? 'Lanjut Tahap Berikutnya' : 'Talent Pool',
          penilaian,
          kelebihan: 'Generated via Auto Fill Tool (Tidak menggunakan AI)',
          areaDigali: 'Logika dasar dan algoritma',
          catatan: 'Hasil simulasi acak.',
        }
      }),
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Auto fill tests error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
