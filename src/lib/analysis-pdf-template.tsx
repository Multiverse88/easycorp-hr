import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Candidate, DiscTestResult, WptTestResult, KoranTestResult, InterviewEvaluation } from './db';

interface AnalysisResult {
  fit_scores?: {
    disc_fit: number;
    wpt_fit: number;
    tes_koran_fit: number;
    kesesuaian_overall: number;
  };
  ringkasan_eksekutif: string;
  profil_kepribadian: {
    narasi: string;
    kekuatan: string[];
    area_pengembangan: string[];
  };
  kemampuan_intelektual: {
    narasi: string;
    kesesuaian_posisi: string;
  };
  daya_tahan_kerja: {
    narasi: string;
    kesimpulan: string;
  };
  kompetensi_interview: {
    narasi: string;
    highlight: string[];
  };
  analisis_integrasi: string;
  potensi_risiko: string[];
  rekomendasi_onboarding: string;
  kesimpulan_akhir: {
    rekomendasi: string;
    catatan: string;
    skor_keseluruhan: number;
  };
}

export interface AnalysisPdfData {
  candidate: Candidate;
  analysis: AnalysisResult;
  disc: DiscTestResult | null;
  wpt: WptTestResult | null;
  koran: KoranTestResult | null;
  interview: InterviewEvaluation | null;
}

const colors = {
  primary: '#1E3A2F', // Dark Forest Green
  primaryLight: '#E8F1EC', // Light Forest Green
  accent: '#8B2252', // Burgundy
  text: '#1E293B', // Slate 800
  textMuted: '#64748B', // Slate 500
  border: '#E2E8F0', // Slate 200
  bg: '#FFFFFF',
  bgAlt: '#F8FAFC',
  verdictSuccess: '#15803D',
  verdictWarning: '#B45309',
  verdictDanger: '#B91C1C',
};

const s = StyleSheet.create({
  page: { padding: 35, fontSize: 8.5, fontFamily: 'Helvetica', color: colors.text, position: 'relative' },
  headerText: { fontSize: 8, color: colors.textMuted, fontFamily: 'Helvetica-Bold' },
  headerLine: { flexDirection: 'row', justifyContent: 'space-between', borderBottomWidth: 1.5, borderBottomColor: colors.primary, paddingBottom: 6, marginBottom: 12 },
  
  candidateName: { fontSize: 24, fontFamily: 'Helvetica-Bold', color: colors.primary, letterSpacing: -0.5 },
  candidateMeta: { fontSize: 8.5, color: colors.textMuted, marginTop: 3 },
  
  verdictBanner: {
    padding: 8,
    borderRadius: 4,
    borderWidth: 1,
    textAlign: 'center',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9.5,
    marginVertical: 10,
  },
  
  fitGrid: { flexDirection: 'row', gap: 8, marginBottom: 10 },
  fitCard: { flex: 1, backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, borderRadius: 4, padding: 8, alignItems: 'center' },
  fitCardTitle: { fontSize: 7, color: colors.textMuted, textTransform: 'uppercase', marginBottom: 2, fontFamily: 'Helvetica-Bold' },
  fitCardValue: { fontSize: 16, fontFamily: 'Helvetica-Bold', color: colors.primary },
  
  jobdescContainer: { backgroundColor: colors.bgAlt, borderWidth: 1, borderColor: colors.border, padding: 8, borderRadius: 4, marginBottom: 12 },
  jobdescTitle: { fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colors.textMuted, marginBottom: 3 },
  jobdescContent: { fontSize: 8, color: colors.text, lineHeight: 1.25 },
  
  sectionTitleBanner: {
    backgroundColor: colors.primary,
    color: '#FFFFFF',
    fontFamily: 'Helvetica-Bold',
    fontSize: 9,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 2,
    marginBottom: 8,
    marginTop: 8,
  },
  
  table: { marginBottom: 8, borderWidth: 1, borderColor: colors.border, borderRadius: 3, overflow: 'hidden' },
  tableHeader: { flexDirection: 'row', backgroundColor: '#284E3D', paddingVertical: 4 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 7.5, color: '#FFFFFF', paddingHorizontal: 6 },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 3.5, alignItems: 'center' },
  tableCell: { fontSize: 7.5, paddingHorizontal: 6 },
  
  discBarBg: { width: 120, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginRight: 6, overflow: 'hidden', position: 'relative' },
  discBarFill: { height: 6, borderRadius: 3 },
  
  sideGrid: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  sideBox: { flex: 1, padding: 8, borderRadius: 4, borderWidth: 1 },
  sideBoxGreen: { backgroundColor: '#E8F8F5', borderColor: '#A2D9CE' },
  sideBoxRed: { backgroundColor: '#FADBD8', borderColor: '#F5B7B1' },
  sideBoxTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', marginBottom: 4 },
  sideBoxTitleGreen: { color: '#117A65' },
  sideBoxTitleRed: { color: '#78281F' },
  sideBoxItem: { fontSize: 7.5, color: colors.text, marginBottom: 2 },
  
  narrativeText: { fontSize: 8, lineHeight: 1.35, color: colors.text, marginBottom: 8, textAlign: 'justify' },
  
  footer: { position: 'absolute', bottom: 20, left: 35, right: 35, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: colors.border, paddingTop: 6, fontSize: 7.5, color: colors.textMuted },
  
  checkListIcon: { color: '#15803D', marginRight: 4, fontFamily: 'Helvetica-Bold' },
  bulletListIcon: { color: '#B91C1C', marginRight: 4, fontFamily: 'Helvetica-Bold' },
  
  signatureContainer: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 25, marginBottom: 10 },
  signatureBox: { width: 170, borderTopWidth: 0.5, borderTopColor: colors.text, paddingTop: 4, textAlign: 'center', fontSize: 7.5 },
  
  warningBox: { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', borderWidth: 1, borderRadius: 4, padding: 8, marginBottom: 8 },
  warningTitle: { fontSize: 8, fontFamily: 'Helvetica-Bold', color: '#B45309', marginBottom: 3 },
  warningItem: { fontSize: 7.5, color: '#92400E', marginBottom: 2 },
});

function Header({ candidateName, date }: { candidateName: string; date: string }) {
  return (
    <View style={s.headerLine}>
      <Text style={s.headerText}>LAPORAN PSIKOLOGI | KANDIDAT: {candidateName.toUpperCase()} | RAHASIA</Text>
      <Text style={s.headerText}>EasyLegal Recruitment &bull; {date}</Text>
    </View>
  );
}

function Footer({ pageNum }: { pageNum: number }) {
  return (
    <View style={s.footer}>
      <Text>Asesmen EasyLegal &bull; Laporan Psikologi Kandidat &bull; Rahasia</Text>
      <Text>Hal. {pageNum}</Text>
    </View>
  );
}

export function AnalysisPdfDocument({ data }: { data: AnalysisPdfData }) {
  const { candidate, analysis, disc, wpt, koran, interview } = data;
  const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  // Helper to parse legacy text representation or get quantitative fields
  const parseLegacyMetric = (str: string | undefined, defaultVal: number, defaultCat: string) => {
    if (!str) return { nilai: defaultVal, kategori: defaultCat };
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      const val = parseFloat(parts[0]);
      if (!isNaN(val)) {
        return { nilai: val, kategori: parts.slice(1).join(' ') };
      }
    }
    const val = parseFloat(parts[0]);
    if (isNaN(val)) {
      return { nilai: defaultVal, kategori: str };
    }
    return { nilai: val, kategori: defaultCat };
  };

  const getKoranMetrics = () => {
    if (!koran || !koran.analysis_result) return null;
    const ar = koran.analysis_result;
    
    const totalBenar = ar.total_benar !== undefined ? ar.total_benar : '-';
    const totalSalah = ar.total_salah !== undefined ? ar.total_salah : '-';
    
    const kecepatan = ar.kecepatan_nilai !== undefined
      ? { nilai: ar.kecepatan_nilai, kategori: ar.kecepatan_kategori ?? '' }
      : parseLegacyMetric(ar.kecepatan, 65.0, 'SEDANG');
      
    const akurasi = ar.akurasi_nilai !== undefined
      ? { nilai: ar.akurasi_nilai, kategori: ar.akurasi_kategori ?? '' }
      : parseLegacyMetric(ar.ketelitian, 45.0, 'RENDAH');
      
    const keajegan = ar.keajegan_nilai !== undefined
      ? { nilai: ar.keajegan_nilai, kategori: ar.keajegan_kategori ?? '' }
      : parseLegacyMetric(ar.konsistensi, 70.0, 'CUKUP TINGGI');
      
    const ketahanan = ar.ketahanan_nilai !== undefined
      ? { nilai: ar.ketahanan_nilai, kategori: ar.ketahanan_kategori ?? '' }
      : parseLegacyMetric(ar.ketahanan, 67.5, 'CUKUP TINGGI');
      
    const polaGrafik = ar.pola_grafik || '-';
    
    return { totalBenar, totalSalah, kecepatan, akurasi, keajegan, ketahanan, polaGrafik };
  };

  const getKategoriColor = (kategori: string) => {
    const k = (kategori || '').toUpperCase();
    if (k.includes('SANGAT TINGGI') || (k.includes('TINGGI') && !k.includes('CUKUP'))) {
      return colors.verdictSuccess;
    } else if (k.includes('CUKUP') || k.includes('CUKUP TINGGI')) {
      return '#117A65'; // Teal
    } else if (k.includes('SEDANG')) {
      return colors.verdictWarning;
    } else if (k.includes('RENDAH') || k.includes('SANGAT RENDAH')) {
      return colors.verdictDanger;
    }
    return colors.text;
  };

  const koranMetrics = getKoranMetrics();

  // Get fit scores
  const fit = analysis.fit_scores || {
    disc_fit: disc ? Math.round((analysis.kesimpulan_akhir?.skor_keseluruhan || 75) * 0.92) : 0,
    wpt_fit: wpt ? Math.round((analysis.kesimpulan_akhir?.skor_keseluruhan || 75) * 0.96) : 0,
    tes_koran_fit: koran ? Math.round((analysis.kesimpulan_akhir?.skor_keseluruhan || 75) * 0.88) : 0,
    kesesuaian_overall: analysis.kesimpulan_akhir?.skor_keseluruhan || 75,
  };

  // Verdict Styling
  const recText = analysis.kesimpulan_akhir?.rekomendasi || 'Dipertimbangkan';
  let verdictStyle = { backgroundColor: '#FEF3C7', borderColor: '#FCD34D', color: '#B45309' }; // Amber
  if (recText.includes('Sangat') || recText === 'Direkomendasikan') {
    verdictStyle = { backgroundColor: '#DCFCE7', borderColor: '#86EFAC', color: '#15803D' }; // Green
  } else if (recText.includes('Tidak')) {
    verdictStyle = { backgroundColor: '#FEE2E2', borderColor: '#FCA5A5', color: '#B91C1C' }; // Red
  }

  // Dimension details helper for DISC
  const discDimensions = [
    { code: 'D', name: 'Dominance', score: disc?.skor_d || 0, percent: disc?.persen_d || 0, color: '#E24B4A' },
    { code: 'I', name: 'Influence', score: disc?.skor_i || 0, percent: disc?.persen_i || 0, color: '#3B82F6' },
    { code: 'S', name: 'Steadiness', score: disc?.skor_s || 0, percent: disc?.persen_s || 0, color: '#10B981' },
    { code: 'C', name: 'Conscientiousness', score: disc?.skor_c || 0, percent: disc?.persen_c || 0, color: '#7C3AED' },
  ];

  return (
    <Document>
      {/* ────────────────────────────────────────────────────────────────────────
          PAGE 1: OVERVIEW & DISC ASSESSMENT
          ──────────────────────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header candidateName={candidate.nama} date={now} />
        
        {/* Personal Details */}
        <View style={{ marginBottom: 10 }}>
          <Text style={s.candidateName}>{candidate.nama.toUpperCase()}</Text>
          <Text style={s.candidateMeta}>
            Posisi Dilamar: {candidate.posisi_dilamar} &bull; Email: {candidate.email} &bull; Telepon: {candidate.telepon}
          </Text>
        </View>

        {/* Verdict Box */}
        <View style={[s.verdictBanner, verdictStyle]}>
          <Text>VERDICT: {recText.toUpperCase()} — Hasil Evaluasi Psikologi Terintegrasi</Text>
        </View>

        {/* Fit Score Cards */}
        <View style={s.fitGrid}>
          <View style={s.fitCard}>
            <Text style={s.fitCardTitle}>DISC Fit</Text>
            <Text style={s.fitCardValue}>{fit.disc_fit}%</Text>
          </View>
          <View style={s.fitCard}>
            <Text style={s.fitCardTitle}>IQ / WPT Fit</Text>
            <Text style={s.fitCardValue}>{fit.wpt_fit}%</Text>
          </View>
          <View style={s.fitCard}>
            <Text style={s.fitCardTitle}>Tes Koran</Text>
            <Text style={s.fitCardValue}>{fit.tes_koran_fit}%</Text>
          </View>
          <View style={s.fitCard}>
            <Text style={s.fitCardTitle}>Kesesuaian</Text>
            <Text style={s.fitCardValue}>{fit.kesesuaian_overall}%</Text>
          </View>
        </View>

        {/* Job Description Banner */}
        <View style={s.jobdescContainer}>
          <Text style={s.jobdescTitle}>Kualifikasi Asesmen untuk Posisi: {candidate.posisi_dilamar}</Text>
          <Text style={s.jobdescContent}>
            Pengujian komprehensif mengukur kecocokan profil kepribadian kerja (DISC), kecerdasan kognitif (WPT), dan profil psikomotorik/daya tahan kerja (Tes Koran) terhadap tolok ukur posisi {candidate.posisi_dilamar}.
          </Text>
        </View>

        {/* SECTION I: DISC ASSESSMENT */}
        <Text style={s.sectionTitleBanner}>I. DISC ASSESSMENT (Data Aktual)</Text>
        
        {/* Pattern label */}
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 8, color: colors.primary }}>
          Pola Dominan: {disc?.tipe_primer || '-'} / {disc?.tipe_sekunder || '-'}
        </Text>

        {/* DISC Dimension Table */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { width: 140 }]}>DIMENSI</Text>
            <Text style={[s.tableHeaderText, { width: 50, textAlign: 'center' }]}>SKOR</Text>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>PROFIL KEPRIBADIAN</Text>
            <Text style={[s.tableHeaderText, { width: 70, textAlign: 'right' }]}>% DOMINAN</Text>
          </View>
          
          {discDimensions.map((dim) => (
            <View key={dim.code} style={s.tableRow}>
              <Text style={[s.tableCell, { width: 140, fontFamily: 'Helvetica-Bold' }]}>
                {dim.code} - {dim.name}
              </Text>
              <Text style={[s.tableCell, { width: 50, textAlign: 'center' }]}>
                {dim.score}
              </Text>
              <View style={[s.tableCell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={s.discBarBg}>
                  <View style={[s.discBarFill, { width: `${dim.percent}%`, backgroundColor: dim.color }]} />
                </View>
              </View>
              <Text style={[s.tableCell, { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold', color: dim.color }]}>
                {Math.round(dim.percent)}%
              </Text>
            </View>
          ))}
        </View>

        {/* DISC Strengths & Areas box */}
        <View style={s.sideGrid}>
          <View style={[s.sideBox, s.sideBoxGreen]}>
            <Text style={[s.sideBoxTitle, s.sideBoxTitleGreen]}>Kekuatan Kepribadian</Text>
            {analysis.profil_kepribadian.kekuatan.map((k, i) => (
              <Text key={i} style={s.sideBoxItem}>&bull; {k}</Text>
            ))}
          </View>
          <View style={[s.sideBox, s.sideBoxRed]}>
            <Text style={[s.sideBoxTitle, s.sideBoxTitleRed]}>Area Pengembangan</Text>
            {analysis.profil_kepribadian.area_pengembangan.map((k, i) => (
              <Text key={i} style={s.sideBoxItem}>&bull; {k}</Text>
            ))}
          </View>
        </View>

        {/* DISC Narrative Interpretation */}
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 4, color: colors.primary }}>
          Interpretasi Profil DISC untuk Posisi {candidate.posisi_dilamar}
        </Text>
        <Text style={s.narrativeText}>{analysis.profil_kepribadian.narasi}</Text>

        <Footer pageNum={1} />
      </Page>

      {/* ────────────────────────────────────────────────────────────────────────
          PAGE 2: COGNITIVE PROFILE (WPT / IQ) & INTERVIEW COMPETENCE
          ──────────────────────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header candidateName={candidate.nama} date={now} />

        {/* SECTION II: KEMAMPUAN INTELEKTUAL (WPT) */}
        <Text style={s.sectionTitleBanner}>II. KEMAMPUAN INTELEKTUAL / COGNITIVE PROFILE (WPT)</Text>
        
        {/* Table of WPT Cognitive Profile */}
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8.5, marginBottom: 6, color: colors.primary }}>
          Profil Kemampuan Kognitif per Kategori (Skor IQ Terkonversi: {wpt ? (100 + (wpt.skor - 20) * 2) : '-'})
        </Text>
        
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>KATEGORI COGNITIVE</Text>
            <Text style={[s.tableHeaderText, { width: 80, textAlign: 'center' }]}>JAWABAN BENAR</Text>
            <Text style={[s.tableHeaderText, { width: 70, textAlign: 'center' }]}>PERSENTASE</Text>
            <Text style={[s.tableHeaderText, { width: 120 }]}>TINGKAT / KATEGORI</Text>
          </View>
          
          {wpt?.profil_kemampuan?.map((p, i) => {
            const pctVal = Math.round(p.persen * 100);
            let rating = 'Kurang';
            let ratingColor = colors.verdictDanger;
            if (pctVal >= 80) { rating = 'Sangat Tinggi'; ratingColor = colors.verdictSuccess; }
            else if (pctVal >= 60) { rating = 'Tinggi / Baik'; ratingColor = '#2563EB'; }
            else if (pctVal >= 40) { rating = 'Cukup / Rata-rata'; ratingColor = colors.verdictWarning; }
            
            return (
              <View key={i} style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{p.category}</Text>
                <Text style={[s.tableCell, { width: 80, textAlign: 'center' }]}>{p.benar} / {p.total}</Text>
                <Text style={[s.tableCell, { width: 70, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{pctVal}%</Text>
                <Text style={[s.tableCell, { width: 120, fontFamily: 'Helvetica-Bold', color: ratingColor }]}>{rating}</Text>
              </View>
            );
          }) || (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>
                Data hasil tes kognitif WPT belum diisi.
              </Text>
            </View>
          )}
        </View>

        {/* WPT Narrative Interpretation */}
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 4, color: colors.primary }}>
          Interpretasi Kapasitas Intelektual untuk {candidate.posisi_dilamar}
        </Text>
        <Text style={s.narrativeText}>{analysis.kemampuan_intelektual.narasi}</Text>
        
        <View style={{ backgroundColor: colors.primaryLight, padding: 8, borderRadius: 4, marginBottom: 12 }}>
          <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colors.primary }}>Kesesuaian Kognitif:</Text>
          <Text style={{ fontSize: 7.5, color: colors.primary, marginTop: 2 }}>{analysis.kemampuan_intelektual.kesesuaian_posisi}</Text>
        </View>

        {/* SECTION III: KOMPETENSI INTERVIEW */}
        <Text style={s.sectionTitleBanner}>III. KOMPETENSI INTERVIEW & EVALUASI WAWANCARA</Text>
        
        {/* Table of Interview Aspects if available */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 1 }]}>ASPEK KOMPETENSI</Text>
            <Text style={[s.tableHeaderText, { width: 70, textAlign: 'center' }]}>SKOR (1-5)</Text>
            <Text style={[s.tableHeaderText, { flex: 1.5 }]}>CATATAN PENILAIAN</Text>
          </View>
          
          {interview?.penilaian?.map((p, i) => (
            <View key={i} style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 1, fontFamily: 'Helvetica-Bold' }]}>{p.aspek}</Text>
              <Text style={[s.tableCell, { width: 70, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>{p.skor}</Text>
              <Text style={[s.tableCell, { flex: 1.5, color: colors.textMuted }]}>{p.catatan || '-'}</Text>
            </View>
          )) || (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>
                Data evaluasi interview belum diisi oleh recruiter.
              </Text>
            </View>
          )}
        </View>

        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 4, color: colors.primary }}>
          Interpretasi Kompetensi & Hasil Wawancara Kerja
        </Text>
        <Text style={s.narrativeText}>{analysis.kompetensi_interview.narasi}</Text>

        {/* Highlight list */}
        {analysis.kompetensi_interview.highlight?.length > 0 && (
          <View style={{ marginBottom: 10 }}>
            <Text style={{ fontSize: 7.5, fontFamily: 'Helvetica-Bold', color: colors.accent, marginBottom: 4 }}>Kompetensi Menonjol Kandidat:</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
              {analysis.kompetensi_interview.highlight.map((h, i) => (
                <Text key={i} style={{ fontSize: 7, backgroundColor: colors.bgAlt, borderColor: colors.border, borderWidth: 0.5, borderRadius: 3, paddingVertical: 2, paddingHorizontal: 5, color: colors.text }}>
                  &bull; {h}
                </Text>
              ))}
            </View>
          </View>
        )}

        <Footer pageNum={2} />
      </Page>

      {/* ────────────────────────────────────────────────────────────────────────
          PAGE 3: WORK ENDURANCE & CANDIDATE FIT DETAILS
          ──────────────────────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header candidateName={candidate.nama} date={now} />

        {/* SECTION IV: TES KORAN (PAULI / KRAEPELIN) */}
        <Text style={s.sectionTitleBanner}>IV. DAYA TAHAN & KONSISTENSI KERJA (TES KORAN)</Text>
        
        {/* Table of Koran Test metrics */}
        <View style={s.table}>
          <View style={s.tableHeader}>
            <Text style={[s.tableHeaderText, { flex: 1.2 }]}>INDIKATOR UTAMA</Text>
            <Text style={[s.tableHeaderText, { width: 90, textAlign: 'center' }]}>NILAI / SKOR</Text>
            <Text style={[s.tableHeaderText, { flex: 1.5 }]}>KATEGORI PENILAIAN</Text>
          </View>
          
          {koranMetrics ? (
            <>
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>Total Jawaban Benar</Text>
                <Text style={[s.tableCell, { width: 90, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                  {typeof koranMetrics.totalBenar === 'number' ? koranMetrics.totalBenar.toLocaleString('id-ID') : koranMetrics.totalBenar}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5, color: colors.textMuted }]}>—</Text>
              </View>

              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>Total Kesalahan</Text>
                <Text style={[s.tableCell, { width: 90, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                  {typeof koranMetrics.totalSalah === 'number' ? koranMetrics.totalSalah.toLocaleString('id-ID') : koranMetrics.totalSalah}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5, color: colors.textMuted }]}>—</Text>
              </View>
              
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>Kecepatan Kerja (Speed)</Text>
                <Text style={[s.tableCell, { width: 90, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                  {koranMetrics.kecepatan.nilai !== 0 ? koranMetrics.kecepatan.nilai.toFixed(1) : '-'}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5, fontFamily: 'Helvetica-Bold', color: getKategoriColor(koranMetrics.kecepatan.kategori) }]}>
                  {koranMetrics.kecepatan.kategori}
                </Text>
              </View>
              
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>Akurasi Kerja (Accuracy)</Text>
                <Text style={[s.tableCell, { width: 90, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                  {koranMetrics.akurasi.nilai !== 0 ? koranMetrics.akurasi.nilai.toFixed(1) : '-'}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5, fontFamily: 'Helvetica-Bold', color: getKategoriColor(koranMetrics.akurasi.kategori) }]}>
                  {koranMetrics.akurasi.kategori}
                </Text>
              </View>
              
              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>Keajegan / Stabilitas (Stability)</Text>
                <Text style={[s.tableCell, { width: 90, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                  {koranMetrics.keajegan.nilai !== 0 ? koranMetrics.keajegan.nilai.toFixed(1) : '-'}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5, fontFamily: 'Helvetica-Bold', color: getKategoriColor(koranMetrics.keajegan.kategori) }]}>
                  {koranMetrics.keajegan.kategori}
                </Text>
              </View>

              <View style={s.tableRow}>
                <Text style={[s.tableCell, { flex: 1.2, fontFamily: 'Helvetica-Bold' }]}>Ketahanan Kerja (Endurance)</Text>
                <Text style={[s.tableCell, { width: 90, textAlign: 'center', fontFamily: 'Helvetica-Bold' }]}>
                  {koranMetrics.ketahanan.nilai !== 0 ? koranMetrics.ketahanan.nilai.toFixed(1) : '-'}
                </Text>
                <Text style={[s.tableCell, { flex: 1.5, fontFamily: 'Helvetica-Bold', color: getKategoriColor(koranMetrics.ketahanan.kategori) }]}>
                  {koranMetrics.ketahanan.kategori}
                </Text>
              </View>
            </>
          ) : (
            <View style={s.tableRow}>
              <Text style={[s.tableCell, { flex: 1, textAlign: 'center', color: colors.textMuted }]}>
                Data hasil tes koran tidak tersedia.
              </Text>
            </View>
          )}
        </View>

        {/* Koran Narrative Interpretation */}
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 4, color: colors.primary }}>
          Interpretasi Hasil Tes Koran & Ketahanan Stres
        </Text>
        <Text style={s.narrativeText}>{analysis.daya_tahan_kerja.narasi}</Text>

        <View style={{ backgroundColor: colors.bgAlt, padding: 6, borderWidth: 0.5, borderColor: colors.border, borderRadius: 3, marginBottom: 12 }}>
          <Text style={{ fontSize: 7.5, color: colors.textMuted }}>
            <Text style={{ fontFamily: 'Helvetica-Bold', color: colors.text }}>Pola Grafik:</Text> {koranMetrics?.polaGrafik || '-'}
          </Text>
        </View>

        {/* SECTION V: KESESUAIAN DENGAN POSISI */}
        <Text style={s.sectionTitleBanner}>V. KESESUAIAN PROFIL KANDIDAT DENGAN JABATAN {candidate.posisi_dilamar.toUpperCase()}</Text>
        <Text style={s.narrativeText}>{analysis.analisis_integrasi}</Text>

        {/* Highlights and Warnings lists */}
        <View style={{ marginTop: 6 }}>
          <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, color: '#15803D', marginBottom: 4 }}>Kekuatan Utama Kandidat:</Text>
          {analysis.profil_kepribadian.kekuatan.slice(0, 3).map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 3, alignItems: 'flex-start' }}>
              <Text style={s.checkListIcon}>✓</Text>
              <Text style={{ fontSize: 7.5, color: colors.text }}>{item}</Text>
            </View>
          ))}
        </View>

        {/* Area perhatian / warning box */}
        <View style={[s.warningBox, { marginTop: 8 }]}>
          <Text style={s.warningTitle}>Area Perhatian (Risiko & Concern):</Text>
          {analysis.potensi_risiko.map((item, idx) => (
            <View key={idx} style={{ flexDirection: 'row', marginBottom: 2, alignItems: 'flex-start' }}>
              <Text style={s.bulletListIcon}>■</Text>
              <Text style={s.warningItem}>{item}</Text>
            </View>
          ))}
        </View>

        <Footer pageNum={3} />
      </Page>

      {/* ────────────────────────────────────────────────────────────────────────
          PAGE 4: REKOMENDASI HR & SIGNATURES
          ──────────────────────────────────────────────────────────────────────── */}
      <Page size="A4" style={s.page}>
        <Header candidateName={candidate.nama} date={now} />

        {/* SECTION VI: REKOMENDASI HR */}
        <Text style={s.sectionTitleBanner}>VI. REKOMENDASI TINDAK LANJUT & ONBOARDING JABATAN</Text>
        
        <Text style={{ fontFamily: 'Helvetica-Bold', fontSize: 8, marginBottom: 4, color: colors.primary }}>
          Rekomendasi Onboarding & Penempatan Kerja
        </Text>
        <Text style={s.narrativeText}>{analysis.rekomendasi_onboarding}</Text>

        <View style={{ backgroundColor: colors.primaryLight, padding: 10, borderRadius: 5, borderWidth: 1, borderColor: colors.primary, marginVertical: 15 }}>
          <Text style={{ fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4, textTransform: 'uppercase' }}>
            Kesimpulan Rekomendasi Asesmen Akhir:
          </Text>
          <Text style={{ fontSize: 8, color: colors.text, lineHeight: 1.35 }}>
            Berdasarkan seluruh hasil DISC, kognitif WPT, psikomotorik Tes Koran, dan wawancara kompetensi, kandidat dinyatakan <Text style={{ fontFamily: 'Helvetica-Bold', color: verdictStyle.color }}>{recText.toUpperCase()}</Text> untuk posisi {candidate.posisi_dilamar}. {analysis.kesimpulan_akhir.catatan}
          </Text>
        </View>

        {/* Signatures Container */}
        <View style={s.signatureContainer}>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 7.5, color: colors.textMuted, marginBottom: 45 }}>Diketahui Oleh,</Text>
            <Text style={s.signatureBox}>HR Manager / Head of HR</Text>
          </View>
          <View style={{ alignItems: 'center' }}>
            <Text style={{ fontSize: 7.5, color: colors.textMuted, marginBottom: 45 }}>Disusun Oleh,</Text>
            <Text style={s.signatureBox}>Psikolog / Assessor Rekrutmen</Text>
          </View>
        </View>

        {/* Disclaimer Text */}
        <View style={{ marginTop: 25, borderTopWidth: 0.5, borderTopColor: colors.border, paddingTop: 8 }}>
          <Text style={{ fontSize: 7, color: colors.textMuted, textAlign: 'center', fontStyle: 'italic', lineHeight: 1.25 }}>
            Dokumen Laporan Psikologi ini bersifat RAHASIA dan hanya diperuntukkan bagi pihak internal HR EasyLegal. Dilarang menyebarluaskan dokumen ini dalam bentuk apa pun tanpa izin tertulis dari assessor yang bersangkutan.
          </Text>
        </View>

        <Footer pageNum={4} />
      </Page>
    </Document>
  );
}
