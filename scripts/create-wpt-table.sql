-- ============================================
-- TABEL WPT (IQ TEST)
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS wpt_tests (
  id TEXT PRIMARY KEY,
  candidate_id TEXT NOT NULL REFERENCES candidates(id),
  answers JSONB NOT NULL,
  skor INTEGER NOT NULL,
  total_soal INTEGER NOT NULL DEFAULT 50,
  persen_benar NUMERIC NOT NULL,
  kategori TEXT NOT NULL,
  profil_kemampuan JSONB NOT NULL,
  rekomendasi_posisi JSONB NOT NULL,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_wpt_tests_candidate ON wpt_tests(candidate_id);
