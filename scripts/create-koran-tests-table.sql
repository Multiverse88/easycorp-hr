-- ============================================
-- TABEL KORAN TESTS (PAULI / KRAEPELIN TEST)
-- Jalankan di Supabase SQL Editor
-- ============================================

CREATE TABLE IF NOT EXISTS public.koran_tests (
  id TEXT PRIMARY KEY,
  candidate_id uuid NOT NULL REFERENCES public.candidates(id) ON DELETE CASCADE,
  nama_file TEXT NOT NULL,
  foto_url TEXT NOT NULL,
  analysis_result JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_koran_tests_candidate ON public.koran_tests(candidate_id);

-- Notify postgrest to reload the schema cache
NOTIFY pgrst, 'reload schema';
