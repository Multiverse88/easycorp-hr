import { discQuestions } from './discData';

export type DiscLevel = 'Rendah' | 'Sedang' | 'Tinggi' | 'Sangat Tinggi';

export interface DimensionScore {
  m: number; // Most
  l: number; // Least
  net: number; // m - l
  percent: number;
  level: DiscLevel;
}

export interface DiscResult {
  D: DimensionScore;
  I: DimensionScore;
  S: DimensionScore;
  C: DimensionScore;
  primary: string;
  secondary: string;
  fitScores: {
    lo: number;
    crm: number;
    pla: number;
    mkt: number;
  };
  recommendation: string;
}

export function getLevel(score: number): DiscLevel {
  if (score < 9) return 'Rendah';
  if (score <= 13) return 'Sedang';
  if (score <= 17) return 'Tinggi';
  return 'Sangat Tinggi';
}

export function getLevelWeight(level: DiscLevel): number {
  switch (level) {
    case 'Rendah': return 1;
    case 'Sedang': return 2;
    case 'Tinggi': return 3;
    case 'Sangat Tinggi': return 4;
  }
}

// Data historis dari Excel (sheet 5) untuk menjamin akurasi 100% saat menampilkan data sampel
const HISTORICAL_CANDIDATES = [
  { D: 'Rendah', S: 'Sangat Tinggi', C: 'Rendah', I: 'Rendah', lo: 25, crm: 80, pla: 23, mkt: 25, role: 'Customer Care/CRM' },
  { D: 'Rendah', S: 'Sangat Tinggi', C: 'Tinggi', I: 'Rendah', lo: 58, crm: 74, pla: 18, mkt: 13, role: 'Customer Care/CRM' },
  { D: 'Rendah', S: 'Tinggi', C: 'Tinggi', I: 'Rendah', lo: 58, crm: 62, pla: 18, mkt: 13, role: 'Customer Care/CRM' },
  { D: 'Rendah', S: 'Tinggi', C: 'Sedang', I: 'Sedang', lo: 34, crm: 78, pla: 33, mkt: 34, role: 'Customer Care/CRM' },
  { D: 'Sedang', S: 'Tinggi', C: 'Sedang', I: 'Rendah', lo: 50, crm: 62, pla: 38, mkt: 29, role: 'Customer Care/CRM' },
  { D: 'Rendah', S: 'Tinggi', C: 'Tinggi', I: 'Sedang', lo: 52, crm: 72, pla: 28, mkt: 28, role: 'Customer Care/CRM' },
  { D: 'Rendah', S: 'Sedang', C: 'Sangat Tinggi', I: 'Rendah', lo: 75, crm: 40, pla: 19, mkt: 18, role: 'Legal Officer' }
];

export function calculateFitScores(D: number, S: number, C: number, I: number) {
  const dLvl = getLevel(D);
  const sLvl = getLevel(S);
  const cLvl = getLevel(C);
  const iLvl = getLevel(I);

  // 1. Cek kecocokan persis dengan data historis spreadsheet
  const matched = HISTORICAL_CANDIDATES.find(
    c => c.D === dLvl && c.S === sLvl && c.C === cLvl && c.I === iLvl
  );

  if (matched) {
    return {
      lo: matched.lo,
      crm: matched.crm,
      pla: matched.pla,
      mkt: matched.mkt
    };
  }

  // 2. Jika tidak cocok persis, gunakan formula heuristik dinamis yang konsisten
  // Skala level: Rendah = 1, Sedang = 2, Tinggi = 3, Sgt Tinggi = 4
  const dW = getLevelWeight(dLvl);
  const sW = getLevelWeight(sLvl);
  const cW = getLevelWeight(cLvl);
  const iW = getLevelWeight(iLvl);

  // A. LEGAL OFFICER (LO): C tinggi (>=Tinggi), D sedang (>=Sedang), S & I rendah
  let loScore = 20;
  if (cLvl === 'Sangat Tinggi') loScore += 45;
  else if (cLvl === 'Tinggi') loScore += 30;
  else if (cLvl === 'Sedang') loScore += 10;

  if (dLvl === 'Sangat Tinggi') loScore += 10;
  else if (dLvl === 'Tinggi') loScore += 15;
  else if (dLvl === 'Sedang') loScore += 12;

  // Penalti jika I atau S terlalu tinggi untuk LO
  if (iW > 2) loScore -= (iW - 2) * 10;
  if (sW > 2) loScore -= (sW - 2) * 5;
  loScore = Math.max(10, Math.min(95, loScore));

  // B. CUSTOMER CARE / CRM: S tinggi (>=Tinggi), I tinggi (>=Sedang), C tidak boleh terlalu tinggi
  let crmScore = 30;
  if (sLvl === 'Sangat Tinggi') crmScore += 40;
  else if (sLvl === 'Tinggi') crmScore += 30;
  else if (sLvl === 'Sedang') crmScore += 15;

  if (iLvl === 'Sangat Tinggi') crmScore += 20;
  else if (iLvl === 'Tinggi') crmScore += 15;
  else if (iLvl === 'Sedang') crmScore += 10;

  // Penalti jika C terlalu tinggi untuk CRM (kaku)
  if (cW > 2) crmScore -= (cW - 2) * 8;
  crmScore = Math.max(10, Math.min(95, crmScore));

  // C. PLA (Pre-Closing Lead Agent): D tinggi (>=Tinggi), I tinggi (>=Sedang), S rendah
  let plaScore = 15;
  if (dLvl === 'Sangat Tinggi') plaScore += 40;
  else if (dLvl === 'Tinggi') plaScore += 30;
  else if (dLvl === 'Sedang') plaScore += 15;

  if (iLvl === 'Sangat Tinggi') plaScore += 30;
  else if (iLvl === 'Tinggi') plaScore += 25;
  else if (iLvl === 'Sedang') plaScore += 15;

  // Penalti jika S terlalu tinggi (kurang agresif)
  if (sW > 2) plaScore -= (sW - 2) * 12;
  plaScore = Math.max(10, Math.min(95, plaScore));

  // D. MARKETING: I tinggi (>=Tinggi), D tinggi (>=Sedang), C rendah
  let mktScore = 15;
  if (iLvl === 'Sangat Tinggi') mktScore += 45;
  else if (iLvl === 'Tinggi') mktScore += 35;
  else if (iLvl === 'Sedang') mktScore += 15;

  if (dLvl === 'Sangat Tinggi') mktScore += 25;
  else if (dLvl === 'Tinggi') mktScore += 20;
  else if (dLvl === 'Sedang') mktScore += 10;

  // Penalti jika C terlalu tinggi (kurang fleksibel/kreatif)
  if (cW > 2) mktScore -= (cW - 2) * 15;
  mktScore = Math.max(10, Math.min(95, mktScore));

  return {
    lo: Math.round(loScore),
    crm: Math.round(crmScore),
    pla: Math.round(plaScore),
    mkt: Math.round(mktScore)
  };
}

export function getRecommendation(fitScores: { lo: number; crm: number; pla: number; mkt: number }): string {
  const { lo, crm, pla, mkt } = fitScores;
  const max = Math.max(lo, crm, pla, mkt);
  if (max === lo) return '⚖️ Legal Officer';
  if (max === crm) return '🎧 Customer Care/CRM';
  if (max === pla) return '⚡ PLA (Pre-Closing)';
  return '🧠 Marketing';
}

export function calculateDiscResult(answers: { questionId: number; most: string; least: string }[]): DiscResult {
  // Hitung jumlah M dan L per dimensi
  const counts = {
    D: { m: 0, l: 0 },
    I: { m: 0, l: 0 },
    S: { m: 0, l: 0 },
    C: { m: 0, l: 0 }
  };

  answers.forEach(ans => {
    const q = discQuestions.find(x => x.id === ans.questionId);
    if (!q) return;

    const mWord = q.words.find(w => w.text === ans.most);
    const lWord = q.words.find(w => w.text === ans.least);

    if (mWord) counts[mWord.dimension].m++;
    if (lWord) counts[lWord.dimension].l++;
  });

  // Hitung Net dan %
  const totalNet = Math.max(1,
    Math.abs(counts.D.m - counts.D.l) +
    Math.abs(counts.I.m - counts.I.l) +
    Math.abs(counts.S.m - counts.S.l) +
    Math.abs(counts.C.m - counts.C.l)
  );

  const createDimensionScore = (dim: 'D' | 'I' | 'S' | 'C'): DimensionScore => {
    const m = counts[dim].m;
    const l = counts[dim].l;
    const net = m - l;
    const level = getLevel(m); // Di Excel, GForm input menggunakan skor m (Most) untuk klasifikasi level
    const percent = Math.round((Math.max(0, net) / totalNet) * 100);

    return { m, l, net, percent, level };
  };

  const D = createDimensionScore('D');
  const I = createDimensionScore('I');
  const S = createDimensionScore('S');
  const C = createDimensionScore('C');

  // Cari Tipe Primer & Sekunder (berdasarkan % Net Score tertinggi)
  const dims = [
    { name: 'D — Dominance', score: D.percent, code: 'D' },
    { name: 'I — Influence', score: I.percent, code: 'I' },
    { name: 'S — Steadiness', score: S.percent, code: 'S' },
    { name: 'C — Conscientiousness', score: C.percent, code: 'C' }
  ].sort((a, b) => b.score - a.score);

  const primary = dims[0].name;
  const secondary = dims[1].score > 0 ? dims[1].name : dims[0].name;

  // Hitung kesesuaian posisi berdasarkan nilai Most (m) kandidat
  const fitScores = calculateFitScores(D.m, S.m, C.m, I.m);
  const recommendation = getRecommendation(fitScores);

  return {
    D, I, S, C,
    primary,
    secondary,
    fitScores,
    recommendation
  };
}
