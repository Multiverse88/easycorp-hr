// Type definitions for EasyLegal Recruitment System

// === Enums / Union Types ===

export type ManpowerStatus = 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected';
export type JenisKebutuhan = 'Posisi Baru' | 'Replacement' | 'Tambahan Tim';
export type StatusKaryawan = 'PKWT' | 'PKWTT' | 'Magang' | 'Outsource';
export type Urgensi = 'Tinggi' | 'Sedang' | 'Rendah';

export type CandidateStatus = 'interview_user' | 'offering' | 'reject';

export type TahapInterview = 'HRGA' | 'User' | 'Final';
export type MetodeInterview = 'Online' | 'Offline';
export type Rekomendasi = 'Lanjut Tahap Berikutnya' | 'Talent Pool' | 'Tidak Lanjut';
export type KesimpulanTes = 'Lulus' | 'Lulus Bersyarat' | 'Tidak Lulus';

// === Interfaces ===

export interface Kualifikasi {
  pendidikan: string;
  pengalaman: string;
  keahlian: string;
  softskill: string;
  catatan: string;
}

export interface RangeGaji {
  min: number;
  max: number;
}

export interface ManpowerRequest {
  id: string;
  no_request: string;
  tanggal: string;
  divisi: string;
  pemohon: string;
  jabatan_pemohon: string;
  atasan_pemohon: string;
  posisi: string;
  jumlah: number;
  lokasi: string;
  tanggal_dibutuhkan: string;
  jenis_kebutuhan: JenisKebutuhan;
  replacement_name?: string;
  status_karyawan: StatusKaryawan;
  urgensi: Urgensi;
  alasan: string;
  jobdesk: string;
  kualifikasi: Kualifikasi;
  range_gaji: RangeGaji;
  benefit: string;
  status: ManpowerStatus;
  approval_user_at?: string;
  approval_hrga_at?: string;
  approval_management_at?: string;
}

export interface Candidate {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  posisi_dilamar: string;
  manpower_request_id?: string;
  token: string;
  token_expires_at: string;
  status: CandidateStatus;
  created_at: string;
  pendidikan?: string;
  pengalaman?: string;
  keahlian?: string;
}

export interface KomponenTes {
  nama: string;
  nilai: string;
  batas_lulus: string;
  catatan: string;
}

export interface SelectionTestResult {
  id: string;
  candidate_id: string;
  tanggal_tes: string;
  penyelenggara: string;
  komponen: KomponenTes[];
  kesimpulan: KesimpulanTes;
  catatan_akhir: string;
}

export interface Penilaian {
  aspek: string;
  skor: number;
  catatan: string;
}

export interface InterviewEvaluation {
  id: string;
  candidate_id: string;
  tanggal: string;
  tahap: TahapInterview;
  interviewer: string;
  metode: MetodeInterview;
  ekspektasi_gaji: number;
  ketersediaan_bergabung: string;
  penilaian: Penilaian[];
  total_skor: number;
  kelebihan: string;
  area_digali: string;
  catatan: string;
  rekomendasi: Rekomendasi;
}

export interface DiscAnswer {
  questionId: number;
  most: string;
  least: string;
}

export interface DiscTestResult {
  id: string;
  candidate_id: string;
  answers: DiscAnswer[];
  skor_d: number;
  skor_i: number;
  skor_s: number;
  skor_c: number;
  persen_d: number;
  persen_i: number;
  persen_s: number;
  persen_c: number;
  tipe_primer: string;
  tipe_sekunder: string;
  completed_at: string;
}
