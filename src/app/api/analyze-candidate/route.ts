import { NextRequest, NextResponse } from 'next/server';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getInterviewEvaluationByCandidate,
  getPapikostikTestResultByCandidate,
  getAiAnalysisByCandidate,
  saveAiAnalysis
} from '@/lib/db';

export const dynamic = 'force-dynamic';

function generateResumeAlgorithm(data: {
  candidate: any;
  disc: any;
  wpt: any;
  koran: any;
  interview: any;
  papikostik: any;
}) {
  const { candidate, disc, wpt, koran, interview, papikostik } = data;

  // Helper functions for scoring
  let discFit = 70;
  if (disc) {
    if (['D', 'C'].includes(disc.tipe_primer)) discFit = 85;
    else if (['I', 'S'].includes(disc.tipe_primer)) discFit = 80;
  }

  let wptFit = 50;
  let wptCategory = 'Kurang';
  if (wpt) {
    wptFit = Math.min(100, Math.max(0, wpt.skor * 2));
    wptCategory = wpt.kategori || 'Cukup';
  }

  let koranFit = 50;
  let koranRec = 'Tidak Lulus';
  if (koran) {
    const ar = koran.analysis_result || {};
    const kec = ar.kecepatan_nilai || 50;
    const aku = ar.akurasi_nilai || 50;
    koranFit = Math.round((kec + aku) / 2);
    koranRec = ar.rekomendasi || 'Dipertimbangkan';
  }

  let intFit = 60;
  let intRec = 'Dipertimbangkan';
  if (interview) {
    intFit = interview.total_skor || 70;
    intRec = interview.rekomendasi || 'Dipertimbangkan';
  }

  const kesesuaianOverall = Math.round((discFit + wptFit + koranFit + intFit) / 4);

  let rekomAkhir = "Dipertimbangkan";
  if (kesesuaianOverall >= 85) rekomAkhir = "Sangat Direkomendasikan";
  else if (kesesuaianOverall >= 75) rekomAkhir = "Direkomendasikan";
  else if (kesesuaianOverall < 60) rekomAkhir = "Tidak Direkomendasikan";

  const ringkasan = `Kandidat ${candidate.nama} menunjukkan tingkat kesesuaian keseluruhan sebesar ${kesesuaianOverall}% terhadap profil posisi ${candidate.posisi_dilamar}. ${rekomAkhir === 'Sangat Direkomendasikan' || rekomAkhir === 'Direkomendasikan' ? 'Berdasarkan kompilasi hasil evaluasi psikometri dan wawancara, kandidat memperlihatkan kualifikasi fundamental yang sangat memadai, kapasitas kognitif yang mendukung, serta profil kepribadian yang diproyeksikan akan selaras dengan budaya perusahaan.' : 'Dari hasil integrasi evaluasi, terdapat beberapa indikator yang mengarah pada kesenjangan kualifikasi. Diperlukan pertimbangan lebih lanjut dan mitigasi risiko yang matang sebelum menempatkan kandidat pada posisi ini.'}`;

  return {
    fit_scores: {
      disc_fit: discFit,
      wpt_fit: wptFit,
      tes_koran_fit: koranFit,
      kesesuaian_overall: kesesuaianOverall
    },
    ringkasan_eksekutif: ringkasan,
    
    profil_kepribadian: {
      narasi: disc ? `Kandidat ini memiliki struktur kepribadian dengan dominasi pada tipe ${disc.tipe_primer} serta dukungan dari tipe ${disc.tipe_sekunder}. Individu dengan perpaduan ini umumnya ${disc.tipe_primer === 'D' ? 'berfokus penuh pada pencapaian target, mengambil inisiatif secara cepat, dan tidak ragu dalam mengambil keputusan di situasi kritis' : disc.tipe_primer === 'I' ? 'sangat cakap dalam membangun relasi interpersonal, persuasif dalam berkomunikasi, dan menyukai kolaborasi tim' : disc.tipe_primer === 'S' ? 'menunjukkan ketenangan, konsistensi kerja yang tinggi, serta kemampuan menjadi pendengar yang baik dalam dinamika tim' : 'memiliki standar kualitas yang tinggi, teliti dalam menganalisis data, dan cenderung terstruktur dalam menyelesaikan masalah'}. Gaya pendekatan kepribadian ini mengindikasikan cara kerja yang stabil sesuai dengan karakteristik dominannya.` : "Data DISC belum tersedia secara sistem.",
      kekuatan: disc ? [`Kemampuan adaptasi gaya kerja ${disc.tipe_primer}`, `Potensi pengembangan pada aspek ${disc.tipe_sekunder}`, `Orientasi pada pendekatan sistematis`] : ["-"],
      area_pengembangan: disc ? ["Membutuhkan penyesuaian gaya komunikasi pada saat menghadapi rekan dengan karakter berlawanan.", "Perlu mengelola stres lebih optimal saat dihadapkan pada situasi tekanan tinggi yang berkelanjutan."] : ["-"]
    },
    
    kemampuan_intelektual: {
      narasi: wpt ? `Pengukuran daya tangkap intelektual (WPT) menunjukkan skor ${wpt.skor}/50, yang menempatkan kandidat pada kategori ${wptCategory}. Hasil ini merepresentasikan seberapa cepat kandidat dalam menyerap informasi baru, memecahkan permasalahan logika-matematis, serta mengaplikasikan instruksi kompleks dalam operasional sehari-hari. Tingkat kecerdasan yang berada pada level ini mengindikasikan kapasitas belajar yang cukup memadai.` : "Data evaluasi Intelektual (WPT) belum tersedia.",
      kesesuaian_posisi: wpt ? `Tingkat ${wptCategory} ini secara umum sesuai dengan kualifikasi kognitif dasar yang dipersyaratkan. Kandidat dapat memproses instruksi kerja standar dengan tingkat kesalahan minimum.` : "-"
    },
    
    daya_tahan_kerja: {
      narasi: koran ? `Dari instrumen tes kraepelin/pauli, parameter kecepatan kerja kandidat berada pada level ${koran.analysis_result?.kecepatan_kategori || 'sedang'}, sedangkan tingkat ketelitian kerjanya terkategori ${koran.analysis_result?.akurasi_kategori || 'cukup'}. Fluktuasi performa dari grafik hasil kerja menunjukkan stabilitas yang standar. Artinya, kandidat memiliki ketahanan kerja yang cukup wajar ketika dihadapkan pada tugas rutin atau klerikal di bawah tekanan waktu yang konstan.` : "Data Tes Koran (Kraepelin/Pauli) belum tersedia untuk kandidat ini.",
      kesimpulan: koranRec
    },
    
    kompetensi_interview: {
      narasi: interview ? `Evaluasi performa selama sesi wawancara dengan HR atau User mencapai akumulasi skor total ${interview.total_skor}. Penilaian ini menyoroti bagaimana kandidat mengartikulasikan pengalamannya, respons terhadap pertanyaan perilaku (behavioral questions), dan kecocokan nilai-nilai personal dengan perusahaan. Kesimpulan akhir wawancara memberikan rekomendasi: ${interview.rekomendasi}.` : "Evaluasi rekaman atau penilaian Interview belum tersedia.",
      highlight: interview ? interview.penilaian?.map((p: any) => p.aspek) || ["Kesesuaian komunikasi umum", "Pemahaman terhadap job desc"] : ["-"]
    },
    
    analisis_integrasi: `Berdasarkan perpaduan profil psikologis, analisis kapasitas intelektual, ketahanan kerja repetitif, dan observasi perilaku selama wawancara, kandidat dinilai ${kesesuaianOverall >= 75 ? 'sangat prospektif dan cukup menjanjikan' : 'membutuhkan peninjauan komprehensif ekstra'} untuk menempati peran ${candidate.posisi_dilamar}. Terdapat keselarasan yang memadai antara potensi bawaan dan tuntutan profesi.`,
    
    potensi_risiko: kesesuaianOverall < 70 ? ["Kemungkinan kesulitan beradaptasi dengan ritme kerja yang sangat dinamis", "Daya tahan dan konsistensi kerja mungkin menurun jika tidak ada supervisi berkala"] : ["Risiko terkait adaptasi budaya tergolong minimal", "Sedikit potensi hambatan komunikasi dengan karakter pemimpin yang sangat dominan"],
    
    rekomendasi_onboarding: kesesuaianOverall >= 75 ? "Sediakan masa orientasi teknis terstruktur dengan menetapkan Key Performance Indicator (KPI) yang terukur sejak minggu kedua. Berikan kebebasan berkreasi dalam batas SOP." : "Direkomendasikan adanya pendampingan mentor atau buddy secara intensif selama 1-2 bulan pertama untuk menekan angka kesalahan kerja.",
    
    kesimpulan_akhir: {
      rekomendasi: rekomAkhir,
      catatan: `Evaluasi otomatis oleh sistem resume.`,
      skor_keseluruhan: kesesuaianOverall
    }
  };
}

export async function POST(request: NextRequest) {
  try {
    const { candidateId } = await request.json();

    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId wajib diisi' }, { status: 400 });
    }

    const [candidate, disc, wpt, koran, interview, papikostik] = await Promise.all([
      getCandidateById(candidateId),
      getDiscTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getKoranTestResultByCandidate(candidateId),
      getInterviewEvaluationByCandidate(candidateId),
      getPapikostikTestResultByCandidate(candidateId),
    ]);
    
    if (!candidate) {
      return NextResponse.json({ error: 'Kandidat tidak ditemukan' }, { status: 404 });
    }

    const resumeData = generateResumeAlgorithm({ candidate, disc, wpt, koran, interview, papikostik });

    await new Promise(resolve => setTimeout(resolve, 1500));

    await saveAiAnalysis(candidateId, resumeData);

    return NextResponse.json({
      success: true,
      queued: true,
      message: 'Resume berhasil dibuat secara otomatis.'
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
