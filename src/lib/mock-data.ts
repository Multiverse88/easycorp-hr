import { DiscTestResult, WptTestResult } from './db';

export const MOCK_DISC_RESULT: DiscTestResult = {
  id: 'mock-disc-id',
  candidate_id: 'mock-candidate',
  answers: [],
  skor_d: 18,
  skor_i: 12,
  skor_s: 8,
  skor_c: 4,
  persen_d: 45,
  persen_i: 30,
  persen_s: 15,
  persen_c: 10,
  tipe_primer: 'D',
  tipe_sekunder: 'I',
  completed_at: new Date().toISOString(),
};

export const MOCK_WPT_RESULT: WptTestResult = {
  id: 'mock-wpt-id',
  candidate_id: 'mock-candidate',
  answers: [],
  skor: 35,
  total_soal: 50,
  persen_benar: 0.7,
  kategori: 'Sangat Baik',
  profil_kemampuan: [
    { category: 'Verbal', total: 10, benar: 8, persen: 80, keterangan: 'Tinggi' },
    { category: 'Numerik', total: 10, benar: 7, persen: 70, keterangan: 'Sedang' },
    { category: 'Logika', total: 10, benar: 9, persen: 90, keterangan: 'Tinggi' },
  ],
  rekomendasi_posisi: [
    { posisi: 'Manager', skorMin: 30, skorIdeal: '>35', status: 'RECOMMENDED', rekomendasi: 'Sangat Cocok' }
  ],
  completed_at: new Date().toISOString(),
};
export const MOCK_PAPIKOSTIK_RESULTS = {
  G: { skor: 7, deskripsi: "Pekerja Keras", interpretasi: "Kemauan bekerja keras tinggi" },
  L: { skor: 5, deskripsi: "Kepemimpinan", interpretasi: "Mampu memimpin tim" },
  I: { skor: 6, deskripsi: "Pembuatan Keputusan", interpretasi: "Cepat mengambil keputusan" },
  T: { skor: 4, deskripsi: "Tipe Pekerja Cepat", interpretasi: "Kecepatan kerja standar" },
  V: { skor: 8, deskripsi: "Tipe Kuat", interpretasi: "Penuh semangat dan energi" },
  S: { skor: 6, deskripsi: "Sosialisasi", interpretasi: "Mudah bergaul" },
  R: { skor: 5, deskripsi: "Teoritis", interpretasi: "Pemikir moderat" },
  D: { skor: 7, deskripsi: "Perhatian Terhadap Detail", interpretasi: "Sangat teliti" },
  C: { skor: 5, deskripsi: "Keteraturan", interpretasi: "Cukup teratur" },
  E: { skor: 6, deskripsi: "Emosi", interpretasi: "Stabil emosinya" }
};

export const MOCK_KORAN_RESULT = {
  id: 'mock-koran-id',
  candidate_id: 'mock-candidate',
  nama_file: 'mock-kraepelin.jpg',
  foto_url: '/uploads/mock-kraepelin.jpg',
  analysis_result: {
    kecepatan: '65.0 SEDANG',
    ketelitian: '45.0 RENDAH',
    konsistensi: '70.0 CUKUP TINGGI',
    ketahanan: '67.5 CUKUP TINGGI',
    reasoning: 'Kandidat menunjukkan pola kerja yang konsisten namun dengan tingkat ketelitian yang perlu ditingkatkan.',
    rekomendasi: 'Dipertimbangkan',
    total_benar: 1564,
    total_salah: 34,
    kecepatan_nilai: 65.0,
    kecepatan_kategori: 'SEDANG',
    akurasi_nilai: 45.0,
    akurasi_kategori: 'RENDAH',
    keajegan_nilai: 70.0,
    keajegan_kategori: 'CUKUP TINGGI',
    ketahanan_nilai: 67.5,
    ketahanan_kategori: 'CUKUP TINGGI',
    pola_grafik: 'Grafik menunjukkan sedikit penurunan di tengah tes.'
  },
  created_at: new Date().toISOString()
};
