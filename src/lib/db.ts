'use server';

import fs from 'fs';
import path from 'path';

// File path for the local JSON database in the workspace
const DB_FILE_PATH = path.join(process.cwd(), 'db_local.json');

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
  jenis_kebutuhan: 'Posisi Baru' | 'Replacement' | 'Tambahan Tim';
  replacement_name?: string;
  status_karyawan: 'PKWT' | 'PKWTT' | 'Magang' | 'Outsource';
  urgensi: 'Tinggi' | 'Sedang' | 'Rendah';
  alasan: string;
  jobdesk: string;
  kualifikasi: {
    pendidikan: string;
    pengalaman: string;
    keahlian: string;
    softskill: string;
    catatan: string;
  };
  range_gaji: { min: number; max: number };
  benefit: string;
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected';
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
  status: 'screening' | 'interview' | 'psikotes' | 'offering' | 'hired' | 'rejected';
  created_at: string;
  // Bio fields
  pendidikan?: string;
  pengalaman?: string;
  keahlian?: string;
}

export interface SelectionTestResult {
  id: string;
  candidate_id: string;
  tanggal_tes: string;
  penyelenggara: string;
  komponen: {
    nama: string;
    nilai: string;
    batas_lulus: string;
    catatan: string;
  }[];
  kesimpulan: 'Lulus' | 'Lulus Bersyarat' | 'Tidak Lulus';
  catatan_akhir: string;
}

export interface InterviewEvaluation {
  id: string;
  candidate_id: string;
  tanggal: string;
  tahap: 'HRGA' | 'User' | 'Final';
  interviewer: string;
  metode: 'Online' | 'Offline';
  ekspektasi_gaji: number;
  ketersediaan_bergabung: string;
  penilaian: {
    aspek: string;
    skor: number;
    catatan: string;
  }[];
  total_skor: number; // Max 40
  kelebihan: string;
  area_digali: string;
  catatan: string;
  rekomendasi: 'Lanjut Tahap Berikutnya' | 'Talent Pool' | 'Tidak Lanjut';
}

export interface DiscTestResult {
  id: string;
  candidate_id: string;
  answers: { questionId: number; most: string; least: string }[];
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

interface DatabaseSchema {
  manpower_requests: ManpowerRequest[];
  candidates: Candidate[];
  selection_test_results: SelectionTestResult[];
  interview_evaluations: InterviewEvaluation[];
  disc_tests: DiscTestResult[];
}

// Inisialisasi data default (seeding)
const INITIAL_DATABASE: DatabaseSchema = {
  manpower_requests: [
    {
      id: 'mr-1',
      no_request: 'MR/05/2026/001',
      tanggal: '2026-05-10',
      divisi: 'Legal & Compliance',
      pemohon: 'Ahmad Subardjo',
      jabatan_pemohon: 'Legal Manager',
      atasan_pemohon: 'Direktur Operasional',
      posisi: 'Legal Officer (LO)',
      jumlah: 1,
      lokasi: 'Jakarta (Head Office)',
      tanggal_dibutuhkan: '2026-06-01',
      jenis_kebutuhan: 'Replacement',
      replacement_name: 'Dewi Lestari',
      status_karyawan: 'PKWTT',
      urgensi: 'Tinggi',
      alasan: 'Dewi Lestari mengundurkan diri per 31 Mei 2026. Legal Officer sangat kritikal untuk menangani pengurusan akta notaris, OSS NIB, dan perizinan legalitas klien.',
      jobdesk: 'Mengurus 60-100 proyek legalitas per bulan meliputi pendirian PT, CV, Yayasan, perizinan berusaha OSS RBA, koordinasi dengan notaris, dan pembuatan draf kontrak hukum perusahaan.',
      kualifikasi: {
        pendidikan: 'S1 Hukum',
        pengalaman: 'Minimal 1 tahun pengalaman menangani korporasi / perizinan OSS.',
        keahlian: 'Memahami hukum perusahaan, pengoperasian sistem OSS RBA, draf akta notaris.',
        softskill: 'Sangat teliti, berorientasi detail, dapat mengelola banyak berkas bersamaan.',
        catatan: 'Lebih disukai yang memiliki relasi dengan notaris.'
      },
      range_gaji: { min: 6000000, max: 8500000 },
      benefit: 'BPJS Kesehatan, BPJS Ketenagakerjaan, Laptop Kantor, Tunjangan Parkir',
      status: 'approved',
      approval_user_at: '2026-05-10',
      approval_hrga_at: '2026-05-11',
      approval_management_at: '2026-05-12'
    },
    {
      id: 'mr-2',
      no_request: 'MR/05/2026/002',
      tanggal: '2026-05-12',
      divisi: 'Customer Relationship Management',
      pemohon: 'Shinta Widyawati',
      jabatan_pemohon: 'CRM Manager',
      atasan_pemohon: 'Direktur Marketing',
      posisi: 'Customer Care / CRM',
      jumlah: 2,
      lokasi: 'Jakarta (Head Office)',
      tanggal_dibutuhkan: '2026-06-15',
      jenis_kebutuhan: 'Tambahan Tim',
      status_karyawan: 'PKWT',
      urgensi: 'Sedang',
      alasan: 'Peningkatan volume klien inbound di EasyLegal yang membutuhkan penanganan komplain cepat dan follow up lead agar loyalitas klien terjaga.',
      jobdesk: 'Menangani pesan masuk (inbound), melayani komplain dengan ramah, mengelola administrasi CRM, menjaga hubungan baik dengan klien (relationship builder).',
      kualifikasi: {
        pendidikan: 'D3/S1 Semua Jurusan',
        pengalaman: 'Fresh graduate diperbolehkan, berpengalaman di Call Center / CRM disukai.',
        keahlian: 'Lancar mengetik, mahir menggunakan WhatsApp Business & Spreadsheet.',
        softskill: 'Empati tinggi, sangat sabar menghadapi komplain, komunikasi lisan & tertulis yang baik.',
        catatan: 'Bersedia bekerja shift jika diperlukan.'
      },
      range_gaji: { min: 4500000, max: 5500000 },
      benefit: 'BPJS, Insentif Rating Layanan, Laptop Kantor',
      status: 'verified',
      approval_user_at: '2026-05-12',
      approval_hrga_at: '2026-05-14'
    },
    {
      id: 'mr-3',
      no_request: 'MR/05/2026/003',
      tanggal: '2026-05-15',
      divisi: 'Sales & Inbound Marketing',
      pemohon: 'Budi Haryono',
      jabatan_pemohon: 'Sales Lead',
      atasan_pemohon: 'Direktur Utama',
      posisi: 'PLA (Pre-Closing Lead Agent)',
      jumlah: 1,
      lokasi: 'Jakarta (Head Office)',
      tanggal_dibutuhkan: '2026-06-01',
      jenis_kebutuhan: 'Posisi Baru',
      status_karyawan: 'PKWTT',
      urgensi: 'Tinggi',
      alasan: 'Mengejar target konversi sales bulanan. PLA bertugas melakukan follow up lead inbound secara agresif hingga deal closing tahap awal.',
      jobdesk: 'Melakukan penawaran jasa hukum EasyLegal, closing awal via telepon/WA, menangani objection handling, koordinasi dengan tim Legal untuk pricing.',
      kualifikasi: {
        pendidikan: 'D3/S1 Komunikasi, Hukum, atau Manajemen',
        pengalaman: 'Min 1 tahun sebagai Telesales / Telemarketing dengan rekam jejak target tercapai.',
        keahlian: 'Teknik negosiasi, closing skill, objection handling.',
        softskill: 'Agresif mengejar target, tangguh, persuasif, komunikatif.',
        catatan: 'Ada bonus performa per closing.'
      },
      range_gaji: { min: 5000000, max: 7000000 },
      benefit: 'BPJS, Komisi Penjualan Tanpa Batas, Tunjangan Pulsa/Telepon',
      status: 'submitted',
      approval_user_at: '2026-05-15'
    }
  ],
  candidates: [
    {
      id: 'cnd-1',
      nama: 'Tiara Nabila',
      email: 'tiara.nabila@example.com',
      telepon: '081234567890',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-tiara',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-15T09:00:00Z',
      pendidikan: 'S1 Ilmu Komunikasi, Universitas Indonesia',
      pengalaman: 'Magang sebagai Customer Service di Startup EduTech selama 6 bulan',
      keahlian: 'WhatsApp Business, Zendesk, Microsoft Excel'
    },
    {
      id: 'cnd-2',
      nama: 'Amnila Hanisah Rifainy',
      email: 'amnila.hanisah@example.com',
      telepon: '081234567891',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-amnila',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-15T10:00:00Z',
      pendidikan: 'S1 Sastra Inggris, Universitas Negeri Jakarta',
      pengalaman: 'Customer Care Representative di Retail Company selama 1 tahun',
      keahlian: 'Komunikasi Bahasa Inggris, CRM Systems'
    },
    {
      id: 'cnd-3',
      nama: 'Fika Nur Fatmala',
      email: 'fika.nur@example.com',
      telepon: '081234567892',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-fika',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-16T08:30:00Z',
      pendidikan: 'D3 Administrasi Bisnis, Politeknik Negeri Jakarta',
      pengalaman: 'Staff Administrasi dan CS di Klinik Kesehatan selama 1.5 tahun',
      keahlian: 'Data entry, scheduling, customer handling'
    },
    {
      id: 'cnd-4',
      nama: 'Fauzia Rahmawati',
      email: 'fauzia.rahma@example.com',
      telepon: '081234567893',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-fauzia',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-16T11:00:00Z',
      pendidikan: 'S1 Hubungan Internasional, Universitas Padjadjaran',
      pengalaman: 'Client Relation Staff di Biro Jasa Imigrasi selama 1 tahun',
      keahlian: 'Negosiasi, penanganan keluhan klien asing'
    },
    {
      id: 'cnd-5',
      nama: 'SALMAN ARYANA',
      email: 'salman.aryana@example.com',
      telepon: '081234567894',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-salman',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-17T09:15:00Z',
      pendidikan: 'S1 Manajemen Bisnis, Binus University',
      pengalaman: 'Telesales Agent di Bank Swasta selama 1 tahun',
      keahlian: 'Sales pitch, product description, closing deal'
    },
    {
      id: 'cnd-6',
      nama: 'Wulan Eka Refiana',
      email: 'wulan.eka@example.com',
      telepon: '081234567895',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-wulan',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-17T14:20:00Z',
      pendidikan: 'D3 Hubungan Masyarakat, Universitas Diponegoro',
      pengalaman: 'Frontliner Call Center Asuransi selama 1 tahun',
      keahlian: 'Call handling protocol, stress management'
    },
    {
      id: 'cnd-7',
      nama: 'Mulyanasari (Riri)',
      email: 'mulyana.riri@example.com',
      telepon: '081234567896',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-riri',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-18T09:00:00Z',
      pendidikan: 'S1 Psikologi, Universitas Mercu Buana',
      pengalaman: 'Recruitment Staff & CS Officer di BPO Company selama 1.5 tahun',
      keahlian: 'Interviewing, service excellence'
    },
    {
      id: 'cnd-8',
      nama: 'yumita',
      email: 'yumita@example.com',
      telepon: '081234567897',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-yumita',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-18T11:45:00Z',
      pendidikan: 'S1 Manajemen Keuangan, Universitas Pancasila',
      pengalaman: 'Administrasi Piutang & CS di Finance Company selama 2 tahun',
      keahlian: 'Billing coordination, dispute handling'
    },
    {
      id: 'cnd-9',
      nama: 'Ela Yuniar',
      email: 'ela.yuniar@example.com',
      telepon: '081234567898',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-ela',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-19T09:30:00Z',
      pendidikan: 'S1 Ilmu Administrasi Negara, Universitas Brawijaya',
      pengalaman: 'Customer Service Officer di Instansi Pemerintah selama 1 tahun',
      keahlian: 'SOP compliance, service oriented'
    },
    {
      id: 'cnd-10',
      nama: 'yunia raventi',
      email: 'yunia.raventi@example.com',
      telepon: '081234567899',
      posisi_dilamar: 'Customer Care / CRM',
      manpower_request_id: 'mr-2',
      token: 'token-yunia',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-19T13:00:00Z',
      pendidikan: 'S1 Sosiologi, Universitas Sebelas Maret',
      pengalaman: 'Guest Relation Officer di Hotel selama 1.5 tahun',
      keahlian: 'Handling difficult guest, hospitality attitude'
    },
    {
      id: 'cnd-11',
      nama: 'AULIA AZMI IZZATUL HAQ',
      email: 'aulia.azmi@example.com',
      telepon: '081234567800',
      posisi_dilamar: 'Legal Officer (LO)',
      manpower_request_id: 'mr-1',
      token: 'token-aulia',
      token_expires_at: '2026-06-30',
      status: 'psikotes',
      created_at: '2026-05-20T10:00:00Z',
      pendidikan: 'S1 Hukum Perdata, Universitas Diponegoro',
      pengalaman: 'Asisten Notaris & PPAT selama 1.5 tahun',
      keahlian: 'OSS RBA, Pembuatan Akta PT/CV, drafting Kontrak'
    }
  ],
  selection_test_results: [],
  interview_evaluations: [],
  disc_tests: [
    // Pre-populate DISC scores for the 11 mock candidates directly from sheet 4/5
    {
      id: 'dt-1',
      candidate_id: 'cnd-1',
      answers: [],
      skor_d: 7, skor_i: 6, skor_s: 20, skor_c: 8,
      persen_d: 0, persen_i: 0, persen_s: 100, persen_c: 0, // Disederhanakan untuk persentase visual raw
      tipe_primer: 'S — Steadiness',
      tipe_sekunder: 'C — Conscientiousness',
      completed_at: '2026-05-15T15:30:00Z'
    },
    {
      id: 'dt-2',
      candidate_id: 'cnd-2',
      answers: [],
      skor_d: 3, skor_i: 7, skor_s: 20, skor_c: 14,
      persen_d: 0, persen_i: 0, persen_s: 60, persen_c: 40,
      tipe_primer: 'S — Steadiness',
      tipe_sekunder: 'C — Conscientiousness',
      completed_at: '2026-05-16T16:15:00Z'
    },
    {
      id: 'dt-3',
      candidate_id: 'cnd-3',
      answers: [],
      skor_d: 4, skor_i: 8, skor_s: 16, skor_c: 14,
      persen_d: 0, persen_i: 10, persen_s: 50, persen_c: 40,
      tipe_primer: 'S — Steadiness',
      tipe_sekunder: 'C — Conscientiousness',
      completed_at: '2026-05-16T17:40:00Z'
    },
    {
      id: 'dt-4',
      candidate_id: 'cnd-4',
      answers: [],
      skor_d: 3, skor_i: 10, skor_s: 16, skor_c: 12,
      persen_d: 0, persen_i: 25, persen_s: 50, persen_c: 25,
      tipe_primer: 'S — Steadiness',
      tipe_sekunder: 'C — Conscientiousness',
      completed_at: '2026-05-17T11:00:00Z'
    },
    {
      id: 'dt-5',
      candidate_id: 'cnd-5',
      answers: [],
      skor_d: 10, skor_i: 4, skor_s: 15, skor_c: 12,
      persen_d: 25, persen_i: 0, persen_s: 50, persen_c: 25,
      tipe_primer: 'S — Steadiness',
      tipe_sekunder: 'C — Conscientiousness',
      completed_at: '2026-05-17T16:50:00Z'
    },
    {
      id: 'dt-6',
      candidate_id: 'cnd-6',
      answers: [],
      skor_d: 6, skor_i: 4, skor_s: 15, skor_c: 16,
      persen_d: 0, persen_i: 0, persen_s: 48, persen_c: 52,
      tipe_primer: 'C — Conscientiousness',
      tipe_sekunder: 'S — Steadiness',
      completed_at: '2026-05-18T10:10:00Z'
    },
    {
      id: 'dt-7',
      candidate_id: 'cnd-7',
      answers: [],
      skor_d: 4, skor_i: 6, skor_s: 15, skor_c: 16,
      persen_d: 0, persen_i: 0, persen_s: 48, persen_c: 52,
      tipe_primer: 'C — Conscientiousness',
      tipe_sekunder: 'S — Steadiness',
      completed_at: '2026-05-18T13:40:00Z'
    },
    {
      id: 'dt-8',
      candidate_id: 'cnd-8',
      answers: [],
      skor_d: 7, skor_i: 9, skor_s: 14, skor_c: 11,
      persen_d: 0, persen_i: 20, persen_s: 50, persen_c: 30,
      tipe_primer: 'S — Steadiness',
      tipe_sekunder: 'C — Conscientiousness',
      completed_at: '2026-05-18T19:20:00Z'
    },
    {
      id: 'dt-9',
      candidate_id: 'cnd-9',
      answers: [],
      skor_d: 3, skor_i: 9, skor_s: 14, skor_c: 15,
      persen_d: 0, persen_i: 20, persen_s: 40, persen_c: 40,
      tipe_primer: 'C — Conscientiousness',
      tipe_sekunder: 'S — Steadiness',
      completed_at: '2026-05-19T11:20:00Z'
    },
    {
      id: 'dt-10',
      candidate_id: 'cnd-10',
      answers: [],
      skor_d: 3, skor_i: 9, skor_s: 14, skor_c: 15,
      persen_d: 0, persen_i: 20, persen_s: 40, persen_c: 40,
      tipe_primer: 'C — Conscientiousness',
      tipe_sekunder: 'S — Steadiness',
      completed_at: '2026-05-19T15:00:00Z'
    },
    {
      id: 'dt-11',
      candidate_id: 'cnd-11',
      answers: [],
      skor_d: 4, skor_i: 3, skor_s: 13, skor_c: 21,
      persen_d: 0, persen_i: 0, persen_s: 20, persen_c: 80,
      tipe_primer: 'C — Conscientiousness',
      tipe_sekunder: 'S — Steadiness',
      completed_at: '2026-05-20T14:45:00Z'
    }
  ]
};

// Helper to read database
async function getRawDb(): Promise<DatabaseSchema> {
  try {
    if (!fs.existsSync(DB_FILE_PATH)) {
      fs.writeFileSync(DB_FILE_PATH, JSON.stringify(INITIAL_DATABASE, null, 2), 'utf8');
      return INITIAL_DATABASE;
    }
    const content = fs.readFileSync(DB_FILE_PATH, 'utf8');
    return JSON.parse(content);
  } catch (error) {
    console.error('Error reading db_local.json:', error);
    return INITIAL_DATABASE;
  }
}

// Helper to write database
async function saveRawDb(data: DatabaseSchema): Promise<void> {
  try {
    fs.writeFileSync(DB_FILE_PATH, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error('Error writing db_local.json:', error);
  }
}

// ==========================================
// 1. MANPOWER REQUEST ACTIONS
// ==========================================

export async function getManpowerRequests(): Promise<ManpowerRequest[]> {
  const db = await getRawDb();
  return db.manpower_requests;
}

export async function getManpowerRequestById(id: string): Promise<ManpowerRequest | undefined> {
  const db = await getRawDb();
  return db.manpower_requests.find(x => x.id === id);
}

export async function saveManpowerRequest(req: Omit<ManpowerRequest, 'id' | 'no_request' | 'status'> & { id?: string }): Promise<ManpowerRequest> {
  const db = await getRawDb();
  
  if (req.id) {
    // Update
    const idx = db.manpower_requests.findIndex(x => x.id === req.id);
    if (idx !== -1) {
      const existing = db.manpower_requests[idx];
      const updated: ManpowerRequest = {
        ...existing,
        ...req,
        id: req.id,
        status: existing.status // Keep status
      };
      db.manpower_requests[idx] = updated;
      await saveRawDb(db);
      return updated;
    }
  }

  // Create New
  const count = db.manpower_requests.length + 1;
  const seq = String(count).padStart(3, '0');
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  
  const no_request = `MR/${month}/${year}/${seq}`;
  const id = `mr-${Date.now()}`;
  
  const newReq: ManpowerRequest = {
    ...req,
    id,
    no_request,
    status: 'submitted',
    approval_user_at: now.toISOString().split('T')[0]
  };

  db.manpower_requests.push(newReq);
  await saveRawDb(db);
  return newReq;
}

export async function approveManpowerRequest(id: string, role: 'hrga' | 'management'): Promise<ManpowerRequest | undefined> {
  const db = await getRawDb();
  const idx = db.manpower_requests.findIndex(x => x.id === id);
  if (idx === -1) return undefined;

  const req = db.manpower_requests[idx];
  const nowStr = new Date().toISOString().split('T')[0];

  if (role === 'hrga') {
    req.status = 'verified';
    req.approval_hrga_at = nowStr;
  } else if (role === 'management') {
    req.status = 'approved';
    req.approval_management_at = nowStr;
  }

  db.manpower_requests[idx] = req;
  await saveRawDb(db);
  return req;
}

export async function rejectManpowerRequest(id: string): Promise<ManpowerRequest | undefined> {
  const db = await getRawDb();
  const idx = db.manpower_requests.findIndex(x => x.id === id);
  if (idx === -1) return undefined;

  db.manpower_requests[idx].status = 'rejected';
  await saveRawDb(db);
  return db.manpower_requests[idx];
}

// ==========================================
// 2. CANDIDATE ACTIONS
// ==========================================

export async function getCandidates(): Promise<Candidate[]> {
  const db = await getRawDb();
  return db.candidates;
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  const db = await getRawDb();
  return db.candidates.find(x => x.id === id);
}

export async function getCandidateByToken(token: string): Promise<Candidate | undefined> {
  const db = await getRawDb();
  return db.candidates.find(x => x.token === token);
}

export async function createCandidate(cand: Omit<Candidate, 'id' | 'token' | 'token_expires_at' | 'status' | 'created_at'>): Promise<Candidate> {
  const db = await getRawDb();
  const id = `cnd-${Date.now()}`;
  const token = `token-${Math.random().toString(36).substring(2, 15)}`;
  
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 14); // 2 weeks expiry

  const newCand: Candidate = {
    ...cand,
    id,
    token,
    token_expires_at: expiry.toISOString().split('T')[0],
    status: 'screening',
    created_at: new Date().toISOString()
  };

  db.candidates.push(newCand);
  await saveRawDb(db);
  return newCand;
}

export async function updateCandidateStatus(id: string, status: Candidate['status']): Promise<Candidate | undefined> {
  const db = await getRawDb();
  const idx = db.candidates.findIndex(x => x.id === id);
  if (idx === -1) return undefined;

  db.candidates[idx].status = status;
  await saveRawDb(db);
  return db.candidates[idx];
}

export async function saveCandidateBio(token: string, bio: { pendidikan: string; pengalaman: string; keahlian: string }): Promise<Candidate | undefined> {
  const db = await getRawDb();
  const idx = db.candidates.findIndex(x => x.token === token);
  if (idx === -1) return undefined;

  db.candidates[idx].pendidikan = bio.pendidikan;
  db.candidates[idx].pengalaman = bio.pengalaman;
  db.candidates[idx].keahlian = bio.keahlian;
  db.candidates[idx].status = 'psikotes'; // Automatically moves to psikotes stage after bio submission
  
  await saveRawDb(db);
  return db.candidates[idx];
}

// ==========================================
// 3. INTERVIEW EVALUATIONS (FR-HRGA-001.03)
// ==========================================

export async function getInterviewEvaluationByCandidate(candidateId: string): Promise<InterviewEvaluation | undefined> {
  const db = await getRawDb();
  return db.interview_evaluations.find(x => x.candidate_id === candidateId);
}

export async function saveInterviewEvaluation(evalData: Omit<InterviewEvaluation, 'id'> & { id?: string }): Promise<InterviewEvaluation> {
  const db = await getRawDb();
  
  if (evalData.id) {
    const idx = db.interview_evaluations.findIndex(x => x.id === evalData.id);
    if (idx !== -1) {
      db.interview_evaluations[idx] = { ...evalData, id: evalData.id };
      await saveRawDb(db);
      return db.interview_evaluations[idx];
    }
  }

  const id = `ev-${Date.now()}`;
  const newEval = { ...evalData, id };
  db.interview_evaluations.push(newEval);
  
  // Update candidate status to 'interview' if not already
  const cIdx = db.candidates.findIndex(x => x.id === evalData.candidate_id);
  if (cIdx !== -1 && db.candidates[cIdx].status === 'psikotes') {
    db.candidates[cIdx].status = 'interview';
  }

  await saveRawDb(db);
  return newEval;
}

// ==========================================
// 4. SELECTION TEST RESULTS (FR-HRGA-001.02)
// ==========================================

export async function getSelectionTestResultByCandidate(candidateId: string): Promise<SelectionTestResult | undefined> {
  const db = await getRawDb();
  return db.selection_test_results.find(x => x.candidate_id === candidateId);
}

export async function saveSelectionTestResult(resultData: Omit<SelectionTestResult, 'id'> & { id?: string }): Promise<SelectionTestResult> {
  const db = await getRawDb();

  if (resultData.id) {
    const idx = db.selection_test_results.findIndex(x => x.id === resultData.id);
    if (idx !== -1) {
      db.selection_test_results[idx] = { ...resultData, id: resultData.id };
      await saveRawDb(db);
      return db.selection_test_results[idx];
    }
  }

  const id = `tr-${Date.now()}`;
  const newResult = { ...resultData, id };
  db.selection_test_results.push(newResult);
  await saveRawDb(db);
  return newResult;
}

// ==========================================
// 5. DISC TEST RESULTS
// ==========================================

export async function getDiscTestResultByCandidate(candidateId: string): Promise<DiscTestResult | undefined> {
  const db = await getRawDb();
  return db.disc_tests.find(x => x.candidate_id === candidateId);
}

export async function saveDiscTestResult(res: Omit<DiscTestResult, 'id'>): Promise<DiscTestResult> {
  const db = await getRawDb();
  
  // Remove existing test if any
  const idx = db.disc_tests.findIndex(x => x.candidate_id === res.candidate_id);
  if (idx !== -1) {
    db.disc_tests.splice(idx, 1);
  }

  const id = `dt-${Date.now()}`;
  const newRes = { ...res, id };
  db.disc_tests.push(newRes);

  // Update candidate status to 'psikotes' completed
  const cIdx = db.candidates.findIndex(x => x.id === res.candidate_id);
  if (cIdx !== -1) {
    db.candidates[cIdx].status = 'interview'; // Automatically advance to interview stage after DISC
  }

  await saveRawDb(db);
  return newRes;
}
