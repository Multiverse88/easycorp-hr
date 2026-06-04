-- ============================================
-- TABEL KORAN TESTS (PAULI / KRAEPELIN TEST)
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS koran_tests (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_koran_tests_candidate ON koran_tests(candidate_id);
