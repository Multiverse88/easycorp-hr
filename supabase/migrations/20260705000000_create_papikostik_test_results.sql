-- ==========================================
-- 1. CREATE CANDIDATES TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.candidates (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    nama text NOT NULL,
    email text,
    telepon text,
    posisi_dilamar text NOT NULL,
    manpower_request_id text,
    token text NOT NULL,
    token_expires_at text NOT NULL,
    status text DEFAULT 'interview_user' NOT NULL,
    created_at timestamp with time zone DEFAULT now() NOT NULL,
    pendidikan text,
    pengalaman text,
    keahlian text,
    ai_analysis jsonb,

    CONSTRAINT candidates_pkey PRIMARY KEY (id),
    CONSTRAINT candidates_token_key UNIQUE (token)
);

ALTER TABLE public.candidates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users" ON public.candidates FOR ALL USING (true);

-- ==========================================
-- 2. CREATE PAPIKOSTIK_TEST_RESULTS TABLE
-- ==========================================
CREATE TABLE IF NOT EXISTS public.papikostik_test_results (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    candidate_id uuid NOT NULL,
    nama_file text NOT NULL,
    results jsonb NOT NULL,
    completed_at timestamp with time zone DEFAULT now() NOT NULL,

    CONSTRAINT papikostik_test_results_pkey PRIMARY KEY (id),
    CONSTRAINT papikostik_test_results_candidate_id_fkey FOREIGN KEY (candidate_id) REFERENCES public.candidates(id) ON DELETE CASCADE,
    CONSTRAINT papikostik_test_results_candidate_id_key UNIQUE (candidate_id)
);

ALTER TABLE public.papikostik_test_results ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all operations for authenticated users" ON public.papikostik_test_results FOR ALL USING (true);
