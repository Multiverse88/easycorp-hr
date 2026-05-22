-- ============================================
-- EasyLegal Recruitment System - Supabase Migration
-- Jalankan seluruh script ini di Supabase SQL Editor
-- ============================================

-- ENUM TYPES
CREATE TYPE jenis_kebutuhan AS ENUM ('Posisi Baru', 'Replacement', 'Tambahan Tim');
CREATE TYPE status_karyawan AS ENUM ('PKWT', 'PKWTT', 'Magang', 'Outsource');
CREATE TYPE urgensi_level AS ENUM ('Tinggi', 'Sedang', 'Rendah');
CREATE TYPE mr_status AS ENUM ('draft', 'submitted', 'verified', 'approved', 'rejected');
CREATE TYPE candidate_status AS ENUM ('screening', 'interview', 'psikotes', 'offering', 'hired', 'rejected');
CREATE TYPE kesimpulan_type AS ENUM ('Lulus', 'Lulus Bersyarat', 'Tidak Lulus');
CREATE TYPE tahap_type AS ENUM ('HRGA', 'User', 'Final');
CREATE TYPE metode_type AS ENUM ('Online', 'Offline');
CREATE TYPE rekomendasi_type AS ENUM ('Lanjut Tahap Berikutnya', 'Talent Pool', 'Tidak Lanjut');

-- 1. MANPOWER REQUESTS
CREATE TABLE manpower_requests (
  id TEXT PRIMARY KEY,
  no_request TEXT NOT NULL,
  tanggal DATE NOT NULL,
  divisi TEXT NOT NULL,
  pemohon TEXT NOT NULL,
  jabatan_pemohon TEXT NOT NULL,
  atasan_pemohon TEXT NOT NULL,
  posisi TEXT NOT NULL,
  jumlah INTEGER NOT NULL DEFAULT 1,
  lokasi TEXT NOT NULL,
  tanggal_dibutuhkan DATE NOT NULL,
  jenis_kebutuhan jenis_kebutuhan NOT NULL,
  replacement_name TEXT,
  status_karyawan status_karyawan NOT NULL,
  urgensi urgensi_level NOT NULL,
  alasan TEXT NOT NULL,
  jobdesk TEXT NOT NULL,
  kualifikasi JSONB NOT NULL,
  range_gaji JSONB NOT NULL,
  benefit TEXT NOT NULL,
  status mr_status NOT NULL DEFAULT 'draft',
  approval_user_at DATE,
  approval_hrga_at DATE,
  approval_management_at DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. CANDIDATES
CREATE TABLE candidates (
  id TEXT PRIMARY KEY,
  nama TEXT NOT NULL,
  email TEXT NOT NULL,
  telepon TEXT NOT NULL,
  posisi_dilamar TEXT NOT NULL,
  manpower_request_id TEXT REFERENCES manpower_requests(id) ON DELETE SET NULL,
  token TEXT UNIQUE NOT NULL,
  token_expires_at DATE NOT NULL,
  status candidate_status NOT NULL DEFAULT 'screening',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  pendidikan TEXT,
  pengalaman TEXT,
  keahlian TEXT
);

-- 3. SELECTION TEST RESULTS
CREATE TABLE selection_test_results (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tanggal_tes DATE NOT NULL,
  penyelenggara TEXT NOT NULL,
  komponen JSONB NOT NULL DEFAULT '[]',
  kesimpulan kesimpulan_type NOT NULL,
  catatan_akhir TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. INTERVIEW EVALUATIONS
CREATE TABLE interview_evaluations (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  tanggal DATE NOT NULL,
  tahap tahap_type NOT NULL,
  interviewer TEXT NOT NULL,
  metode metode_type NOT NULL,
  ekspektasi_gaji INTEGER,
  ketersediaan_bergabung TEXT,
  penilaian JSONB NOT NULL DEFAULT '[]',
  total_skor INTEGER NOT NULL DEFAULT 0,
  kelebihan TEXT,
  area_digali TEXT,
  catatan TEXT,
  rekomendasi rekomendasi_type NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. DISC TESTS
CREATE TABLE disc_tests (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '[]',
  skor_d INTEGER NOT NULL DEFAULT 0,
  skor_i INTEGER NOT NULL DEFAULT 0,
  skor_s INTEGER NOT NULL DEFAULT 0,
  skor_c INTEGER NOT NULL DEFAULT 0,
  persen_d NUMERIC NOT NULL DEFAULT 0,
  persen_i NUMERIC NOT NULL DEFAULT 0,
  persen_s NUMERIC NOT NULL DEFAULT 0,
  persen_c NUMERIC NOT NULL DEFAULT 0,
  tipe_primer TEXT NOT NULL,
  tipe_sekunder TEXT NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL
);

-- 6. PROFILES (linked to auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'hrga' CHECK (role IN ('hrga', 'management', 'admin')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_candidates_token ON candidates(token);
CREATE INDEX idx_candidates_manpower ON candidates(manpower_request_id);
CREATE INDEX idx_selection_test_candidate ON selection_test_results(candidate_id);
CREATE INDEX idx_interview_candidate ON interview_evaluations(candidate_id);
CREATE INDEX idx_disc_candidate ON disc_tests(candidate_id);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE manpower_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE candidates ENABLE ROW LEVEL SECURITY;
ALTER TABLE selection_test_results ENABLE ROW LEVEL SECURITY;
ALTER TABLE interview_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE disc_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- PROFILES: users can read own profile
CREATE POLICY "Users can read own profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- MANPOWER REQUESTS: authenticated users can do everything
CREATE POLICY "Authenticated users can manage manpower requests"
  ON manpower_requests FOR ALL
  USING (auth.role() = 'authenticated');

-- CANDIDATES: authenticated can manage, anonymous can read (for token pages)
CREATE POLICY "Authenticated users can manage candidates"
  ON candidates FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anonymous can read candidates"
  ON candidates FOR SELECT
  USING (true);

-- SELECTION TEST RESULTS: authenticated only
CREATE POLICY "Authenticated users can manage selection tests"
  ON selection_test_results FOR ALL
  USING (auth.role() = 'authenticated');

-- INTERVIEW EVALUATIONS: authenticated only
CREATE POLICY "Authenticated users can manage interview evaluations"
  ON interview_evaluations FOR ALL
  USING (auth.role() = 'authenticated');

-- DISC TESTS: authenticated can manage, anonymous can insert
CREATE POLICY "Authenticated users can manage disc tests"
  ON disc_tests FOR ALL
  USING (auth.role() = 'authenticated');

CREATE POLICY "Anonymous can insert disc tests"
  ON disc_tests FOR INSERT
  WITH CHECK (true);

-- ============================================
-- AUTH TRIGGER: auto-create profile on signup
-- ============================================

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, role)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'full_name', ''), 'hrga');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================
-- SEED DATA
-- ============================================

-- Manpower Requests
INSERT INTO manpower_requests (id, no_request, tanggal, divisi, pemohon, jabatan_pemohon, atasan_pemohon, posisi, jumlah, lokasi, tanggal_dibutuhkan, jenis_kebutuhan, replacement_name, status_karyawan, urgensi, alasan, jobdesk, kualifikasi, range_gaji, benefit, status, approval_user_at, approval_hrga_at, approval_management_at) VALUES
('mr-1', 'MR/05/2026/001', '2026-05-10', 'Legal & Compliance', 'Ahmad Subardjo', 'Legal Manager', 'Direktur Operasional', 'Legal Officer (LO)', 1, 'Jakarta (Head Office)', '2026-06-01', 'Replacement', 'Dewi Lestari', 'PKWTT', 'Tinggi', 'Dewi Lestari mengundurkan diri per 31 Mei 2026. Legal Officer sangat kritikal untuk menangani pengurusan akta notaris, OSS NIB, dan perizinan legalitas klien.', 'Mengurus 60-100 proyek legalitas per bulan meliputi pendirian PT, CV, Yayasan, perizinan berusaha OSS RBA, koordinasi dengan notaris, dan pembuatan draf kontrak hukum perusahaan.', '{"pendidikan":"S1 Hukum","pengalaman":"Minimal 1 tahun pengalaman menangani korporasi / perizinan OSS.","keahlian":"Memahami hukum perusahaan, pengoperasian sistem OSS RBA, draf akta notaris.","softskill":"Sangat teliti, berorientasi detail, dapat mengelola banyak berkas bersamaan.","catatan":"Lebih disukai yang memiliki relasi dengan notaris."}', '{"min":6000000,"max":8500000}', 'BPJS Kesehatan, BPJS Ketenagakerjaan, Laptop Kantor, Tunjangan Parkir', 'approved', '2026-05-10', '2026-05-11', '2026-05-12'),
('mr-2', 'MR/05/2026/002', '2026-05-12', 'Customer Relationship Management', 'Shinta Widyawati', 'CRM Manager', 'Direktur Marketing', 'Customer Care / CRM', 2, 'Jakarta (Head Office)', '2026-06-15', 'Tambahan Tim', NULL, 'PKWT', 'Sedang', 'Peningkatan volume klien inbound di EasyLegal yang membutuhkan penanganan komplain cepat dan follow up lead agar loyalitas klien terjaga.', 'Menangani pesan masuk (inbound), melayani komplain dengan ramah, mengelola administrasi CRM, menjaga hubungan baik dengan klien (relationship builder).', '{"pendidikan":"D3/S1 Semua Jurusan","pengalaman":"Fresh graduate diperbolehkan, berpengalaman di Call Center / CRM disukai.","keahlian":"Lancar mengetik, mahir menggunakan WhatsApp Business & Spreadsheet.","softskill":"Empati tinggi, sangat sabar menghadapi komplain, komunikasi lisan & tertulis yang baik.","catatan":"Bersedia bekerja shift jika diperlukan."}', '{"min":4500000,"max":5500000}', 'BPJS, Insentif Rating Layanan, Laptop Kantor', 'verified', '2026-05-12', '2026-05-14', NULL),
('mr-3', 'MR/05/2026/003', '2026-05-15', 'Sales & Inbound Marketing', 'Budi Haryono', 'Sales Lead', 'Direktur Utama', 'PLA (Pre-Closing Lead Agent)', 1, 'Jakarta (Head Office)', '2026-06-01', 'Posisi Baru', NULL, 'PKWTT', 'Tinggi', 'Mengejar target konversi sales bulanan. PLA bertugas melakukan follow up lead inbound secara agresif hingga deal closing tahap awal.', 'Melakukan penawaran jasa hukum EasyLegal, closing awal via telepon/WA, menangani objection handling, koordinasi dengan tim Legal untuk pricing.', '{"pendidikan":"D3/S1 Komunikasi, Hukum, atau Manajemen","pengalaman":"Min 1 tahun sebagai Telesales / Telemarketing dengan rekam jejak target tercapai.","keahlian":"Teknik negosiasi, closing skill, objection handling.","softskill":"Agresif mengejar target, tangguh, persuasif, komunikatif.","catatan":"Ada bonus performa per closing."}', '{"min":5000000,"max":7000000}', 'BPJS, Komisi Penjualan Tanpa Batas, Tunjangan Pulsa/Telepon', 'submitted', '2026-05-15', NULL, NULL);

-- Candidates
INSERT INTO candidates (id, nama, email, telepon, posisi_dilamar, manpower_request_id, token, token_expires_at, status, created_at, pendidikan, pengalaman, keahlian) VALUES
('cnd-1', 'Tiara Nabila', 'tiara.nabila@example.com', '081234567890', 'Customer Care / CRM', 'mr-2', 'token-tiara', '2026-06-30', 'psikotes', '2026-05-15T09:00:00Z', 'S1 Ilmu Komunikasi, Universitas Indonesia', 'Magang sebagai Customer Service di Startup EduTech selama 6 bulan', 'WhatsApp Business, Zendesk, Microsoft Excel'),
('cnd-2', 'Amnila Hanisah Rifainy', 'amnila.hanisah@example.com', '081234567891', 'Customer Care / CRM', 'mr-2', 'token-amnila', '2026-06-30', 'psikotes', '2026-05-15T10:00:00Z', 'S1 Sastra Inggris, Universitas Negeri Jakarta', 'Customer Care Representative di Retail Company selama 1 tahun', 'Komunikasi Bahasa Inggris, CRM Systems'),
('cnd-3', 'Fika Nur Fatmala', 'fika.nur@example.com', '081234567892', 'Customer Care / CRM', 'mr-2', 'token-fika', '2026-06-30', 'psikotes', '2026-05-16T08:30:00Z', 'D3 Administrasi Bisnis, Politeknik Negeri Jakarta', 'Staff Administrasi dan CS di Klinik Kesehatan selama 1.5 tahun', 'Data entry, scheduling, customer handling'),
('cnd-4', 'Fauzia Rahmawati', 'fauzia.rahma@example.com', '081234567893', 'Customer Care / CRM', 'mr-2', 'token-fauzia', '2026-06-30', 'psikotes', '2026-05-16T11:00:00Z', 'S1 Hubungan Internasional, Universitas Padjadjaran', 'Client Relation Staff di Biro Jasa Imigrasi selama 1 tahun', 'Negosiasi, penanganan keluhan klien asing'),
('cnd-5', 'SALMAN ARYANA', 'salman.aryana@example.com', '081234567894', 'Customer Care / CRM', 'mr-2', 'token-salman', '2026-06-30', 'psikotes', '2026-05-17T09:15:00Z', 'S1 Manajemen Bisnis, Binus University', 'Telesales Agent di Bank Swasta selama 1 tahun', 'Sales pitch, product description, closing deal'),
('cnd-6', 'Wulan Eka Refiana', 'wulan.eka@example.com', '081234567895', 'Customer Care / CRM', 'mr-2', 'token-wulan', '2026-06-30', 'psikotes', '2026-05-17T14:20:00Z', 'D3 Hubungan Masyarakat, Universitas Diponegoro', 'Frontliner Call Center Asuransi selama 1 tahun', 'Call handling protocol, stress management'),
('cnd-7', 'Mulyanasari (Riri)', 'mulyana.riri@example.com', '081234567896', 'Customer Care / CRM', 'mr-2', 'token-riri', '2026-06-30', 'psikotes', '2026-05-18T09:00:00Z', 'S1 Psikologi, Universitas Mercu Buana', 'Recruitment Staff & CS Officer di BPO Company selama 1.5 tahun', 'Interviewing, service excellence'),
('cnd-8', 'yumita', 'yumita@example.com', '081234567897', 'Customer Care / CRM', 'mr-2', 'token-yumita', '2026-06-30', 'psikotes', '2026-05-18T11:45:00Z', 'S1 Manajemen Keuangan, Universitas Pancasila', 'Administrasi Piutang & CS di Finance Company selama 2 tahun', 'Billing coordination, dispute handling'),
('cnd-9', 'Ela Yuniar', 'ela.yuniar@example.com', '081234567898', 'Customer Care / CRM', 'mr-2', 'token-ela', '2026-06-30', 'psikotes', '2026-05-19T09:30:00Z', 'S1 Ilmu Administrasi Negara, Universitas Brawijaya', 'Customer Service Officer di Instansi Pemerintah selama 1 tahun', 'SOP compliance, service oriented'),
('cnd-10', 'yunia raventi', 'yunia.raventi@example.com', '081234567899', 'Customer Care / CRM', 'mr-2', 'token-yunia', '2026-06-30', 'psikotes', '2026-05-19T13:00:00Z', 'S1 Sosiologi, Universitas Sebelas Maret', 'Guest Relation Officer di Hotel selama 1.5 tahun', 'Handling difficult guest, hospitality attitude'),
('cnd-11', 'AULIA AZMI IZZATUL HAQ', 'aulia.azmi@example.com', '081234567800', 'Legal Officer (LO)', 'mr-1', 'token-aulia', '2026-06-30', 'psikotes', '2026-05-20T10:00:00Z', 'S1 Hukum Perdata, Universitas Diponegoro', 'Asisten Notaris & PPAT selama 1.5 tahun', 'OSS RBA, Pembuatan Akta PT/CV, drafting Kontrak');

-- DISC Tests
INSERT INTO disc_tests (id, candidate_id, answers, skor_d, skor_i, skor_s, skor_c, persen_d, persen_i, persen_s, persen_c, tipe_primer, tipe_sekunder, completed_at) VALUES
('dt-1', 'cnd-1', '[]', 7, 6, 20, 8, 0, 0, 100, 0, 'S — Steadiness', 'C — Conscientiousness', '2026-05-15T15:30:00Z'),
('dt-2', 'cnd-2', '[]', 3, 7, 20, 14, 0, 0, 60, 40, 'S — Steadiness', 'C — Conscientiousness', '2026-05-16T16:15:00Z'),
('dt-3', 'cnd-3', '[]', 4, 8, 16, 14, 0, 10, 50, 40, 'S — Steadiness', 'C — Conscientiousness', '2026-05-16T17:40:00Z'),
('dt-4', 'cnd-4', '[]', 3, 10, 16, 12, 0, 25, 50, 25, 'S — Steadiness', 'C — Conscientiousness', '2026-05-17T11:00:00Z'),
('dt-5', 'cnd-5', '[]', 10, 4, 15, 12, 25, 0, 50, 25, 'S — Steadiness', 'C — Conscientiousness', '2026-05-17T16:50:00Z'),
('dt-6', 'cnd-6', '[]', 6, 4, 15, 16, 0, 0, 48, 52, 'C — Conscientiousness', 'S — Steadiness', '2026-05-18T10:10:00Z'),
('dt-7', 'cnd-7', '[]', 4, 6, 15, 16, 0, 0, 48, 52, 'C — Conscientiousness', 'S — Steadiness', '2026-05-18T13:40:00Z'),
('dt-8', 'cnd-8', '[]', 7, 9, 14, 11, 0, 20, 50, 30, 'S — Steadiness', 'C — Conscientiousness', '2026-05-18T19:20:00Z'),
('dt-9', 'cnd-9', '[]', 3, 9, 14, 15, 0, 20, 40, 40, 'C — Conscientiousness', 'S — Steadiness', '2026-05-19T11:20:00Z'),
('dt-10', 'cnd-10', '[]', 3, 9, 14, 15, 0, 20, 40, 40, 'C — Conscientiousness', 'S — Steadiness', '2026-05-19T15:00:00Z'),
('dt-11', 'cnd-11', '[]', 4, 3, 13, 21, 0, 0, 20, 80, 'C — Conscientiousness', 'S — Steadiness', '2026-05-20T14:45:00Z');
