-- ==========================================
-- MIGRATION: Add missing columns + new tables
-- for Prisma migration from Supabase SDK
-- ==========================================

-- 1. Create users table (replacing Supabase Auth + profiles)
CREATE TABLE IF NOT EXISTS easycorp.users (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT DEFAULT 'hr' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 2. Add missing columns to candidates
ALTER TABLE easycorp.candidates ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'interview_user';
ALTER TABLE easycorp.candidates ADD COLUMN IF NOT EXISTS ai_analysis JSONB;

-- 3. Add missing columns to manpower_requests
ALTER TABLE easycorp.manpower_requests ADD COLUMN IF NOT EXISTS jenis_kebutuhan TEXT;
ALTER TABLE easycorp.manpower_requests ADD COLUMN IF NOT EXISTS status_karyawan TEXT;
ALTER TABLE easycorp.manpower_requests ADD COLUMN IF NOT EXISTS urgensi TEXT;
ALTER TABLE easycorp.manpower_requests ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'submitted';

-- 4. Add missing columns to selection_test_results
ALTER TABLE easycorp.selection_test_results ADD COLUMN IF NOT EXISTS kesimpulan TEXT;

-- 5. Add missing columns to interview_evaluations
ALTER TABLE easycorp.interview_evaluations ADD COLUMN IF NOT EXISTS tahap TEXT;
ALTER TABLE easycorp.interview_evaluations ADD COLUMN IF NOT EXISTS metode TEXT;
ALTER TABLE easycorp.interview_evaluations ADD COLUMN IF NOT EXISTS rekomendasi TEXT;

-- 6. Create papikostik_test_results table (was in public schema before)
CREATE TABLE IF NOT EXISTS easycorp.papikostik_test_results (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL UNIQUE,
  nama_file TEXT NOT NULL,
  results JSONB NOT NULL,
  completed_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  FOREIGN KEY (candidate_id) REFERENCES easycorp.candidates(id) ON DELETE CASCADE
);
