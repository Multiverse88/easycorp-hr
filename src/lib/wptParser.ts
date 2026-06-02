import { wptQuestions, WPT_BENCHMARKS } from './wptData';

export interface WptAnswer {
  questionId: number;
  answer: string;
}

export interface ProfilKategori {
  category: string;
  total: number;
  benar: number;
  persen: number;
  keterangan: string;
}

export interface RekomendasiPosisi {
  posisi: string;
  skorMin: number;
  skorIdeal: string;
  status: string;
  rekomendasi: string;
}

export interface WptResult {
  skor: number;
  persenBenar: number;
  kategori: string;
  profilKemampuan: ProfilKategori[];
  rekomendasiPosisi: RekomendasiPosisi[];
  keputusanFinal: string;
}

function normalizeAnswer(answer: string): string {
  return answer.trim().toUpperCase().replace(/\s+/g, ' ');
}

function isAnswerCorrect(userAnswer: string, correctAnswer: string): boolean {
  const norm = normalizeAnswer(userAnswer);
  const correct = normalizeAnswer(correctAnswer);
  return norm === correct;
}

function getKategori(skor: number): string {
  if (skor >= 40) return 'Superior';
  if (skor >= 33) return 'Sangat Baik';
  if (skor >= 27) return 'Baik';
  if (skor >= 21) return 'Cukup';
  if (skor >= 15) return 'Perlu Perhatian';
  return 'Tidak Memenuhi Syarat';
}

function getKategoriProfil(persen: number): string {
  if (persen >= 0.8) return 'Sangat Baik';
  if (persen >= 0.6) return 'Baik';
  if (persen >= 0.4) return 'Cukup';
  return 'Perlu Ditingkatkan';
}

function getPosisiStatus(skor: number, posisi: string): { status: string; rekomendasi: string } {
  const benchmark = WPT_BENCHMARKS[posisi];
  if (!benchmark) return { status: '-', rekomendasi: '-' };

  if (skor >= benchmark.ideal.split('-').map(Number)[1]) {
    return {
      status: 'Sangat Sesuai',
      rekomendasi: `Direkomendasikan — kemampuan analitis memenuhi standar ${posisi}`,
    };
  }
  if (skor >= benchmark.min) {
    return {
      status: 'Sesuai',
      rekomendasi: `Dapat dipertimbangkan dengan catatan`,
    };
  }
  if (skor >= benchmark.min - 4) {
    return {
      status: 'Perlu Review',
      rekomendasi: 'Perlu evaluasi lebih lanjut',
    };
  }
  return {
    status: 'Tidak Sesuai',
    rekomendasi: `Tidak direkomendasikan untuk posisi ini`,
  };
}

export function calculateWptResult(answers: WptAnswer[]): WptResult {
  let skor = 0;
  const categoryStats: Record<string, { total: number; benar: number }> = {};

  for (const q of wptQuestions) {
    if (!categoryStats[q.category]) {
      categoryStats[q.category] = { total: 0, benar: 0 };
    }
    categoryStats[q.category].total++;

    const userAnswer = answers.find(a => a.questionId === q.id);
    if (userAnswer && isAnswerCorrect(userAnswer.answer, q.correctAnswer)) {
      skor++;
      categoryStats[q.category].benar++;
    }
  }

  const persenBenar = skor / wptQuestions.length;
  const kategori = getKategori(skor);

  const profilKemampuan: ProfilKategori[] = Object.entries(categoryStats).map(([cat, stats]) => ({
    category: cat,
    total: stats.total,
    benar: stats.benar,
    persen: stats.total > 0 ? stats.benar / stats.total : 0,
    keterangan: getKategoriProfil(stats.total > 0 ? stats.benar / stats.total : 0),
  }));

  const rekomendasiPosisi: RekomendasiPosisi[] = Object.entries(WPT_BENCHMARKS).map(([posisi, bm]) => {
    const { status, rekomendasi } = getPosisiStatus(skor, posisi);
    return {
      posisi,
      skorMin: bm.min,
      skorIdeal: bm.ideal,
      status,
      rekomendasi,
    };
  });

  let keputusanFinal = '';
  if (skor >= 28) {
    keputusanFinal = `Berdasarkan skor WPT ${skor}/50, kandidat DIREKOMENDASIKAN untuk posisi PLA atau LO dengan kemampuan analitis yang kuat.`;
  } else if (skor >= 23) {
    keputusanFinal = `Berdasarkan skor WPT ${skor}/50, kandidat DIREKOMENDASIKAN untuk posisi LO atau Marketing dengan kemampuan rata-rata tinggi.`;
  } else if (skor >= 20) {
    keputusanFinal = `Berdasarkan skor WPT ${skor}/50, kandidat DIREKOMENDASIKAN untuk posisi Marketing atau CRM.`;
  } else if (skor >= 15) {
    keputusanFinal = `Berdasarkan skor WPT ${skor}/50, kandidat DAPAT DIPERTIMBANGKAN untuk posisi CRM atau Internship.`;
  } else {
    keputusanFinal = `Berdasarkan skor WPT ${skor}/50, kandidat TIDAK DIREKOMENDASIKAN berdasarkan standar minimal EasyLegal.`;
  }

  return {
    skor,
    persenBenar,
    kategori,
    profilKemampuan,
    rekomendasiPosisi,
    keputusanFinal,
  };
}
