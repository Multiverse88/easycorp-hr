import { getPapikostikSessionByToken, getCandidateByToken, getCandidateById, createPapikostikSession } from '@/lib/db';
import { notFound, redirect } from 'next/navigation';
import { submitPapikostikPage } from '@/app/actions/papikostik';
import questions from '@/lib/papikostik-questions.json';
import { ArrowRight, BookOpen, ToggleLeft, ThumbsUp, Layers } from 'lucide-react';

export default async function PapikostikTestPage({
  params,
  searchParams
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ preview?: string }>;
}) {
  const resolvedParams = await params;
  const resolvedSearch = await searchParams;
  const isPreview = resolvedSearch.preview === 'true';
  
  let candidate = await getCandidateByToken(resolvedParams.token);
  let session = null;

  if (!candidate) {
    session = await getPapikostikSessionByToken(resolvedParams.token);
    if (session) {
      candidate = await getCandidateById(session.candidate_id);
    }
  }

  if (!candidate) notFound();

  if (!session) {
    session = await createPapikostikSession(candidate.id);
  }

  if (!isPreview && session.status === 'COMPLETED') {
    redirect(`/koran/${resolvedParams.token}`);
  }

  const currentPage = session.current_page;
  const startIndex = (currentPage - 1) * 10;
  const endIndex = Math.min(currentPage * 10, 90);
  const pageQuestions = questions.slice(startIndex, endIndex);
  const totalPages = 9;
  const progress = Math.round(((currentPage - 1) / totalPages) * 100);
  const submitAction = submitPapikostikPage.bind(null, resolvedParams.token, currentPage);

  return (
    <main
      className="overflow-x-hidden w-full max-w-full min-h-[100dvh] bg-[#f9f9f7]"
      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
    >
      {/* Subtle ambient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-0 w-[600px] h-[400px] bg-[#9A0000]/3 rounded-full blur-[140px]" />
      </div>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-100">
        <div
          className="h-full bg-[#9A0000] transition-all duration-700 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Floating Nav Pill */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-2xl">
        <nav className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src="/logo-ec-icon.png" alt="EC Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[#9A0000] text-sm font-medium hidden sm:block">PAPI Kostick</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-900 text-xs font-semibold hidden sm:block truncate max-w-[130px]">{candidate.nama}</span>
            <div className="flex items-center gap-2 bg-red-50 border border-[#9A0000]/20 rounded-lg px-3 py-1.5">
              <span className="text-slate-900 font-mono text-xs font-semibold">
                {currentPage}<span className="text-[#9A0000]">/{totalPages}</span>
              </span>
            </div>
          </div>
        </nav>
      </div>

      <div className="relative z-10 pt-28 pb-40 px-4 sm:px-6 max-w-3xl mx-auto">

        {/* Hero Header */}
        <div className="mb-16">
          {/* Page progress segments */}
          <div className="flex gap-1.5 mb-8 max-w-xs">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div
                key={i}
                className={`h-1 rounded-full transition-all duration-500 ${
                  i < currentPage - 1 ? 'bg-[#9A0000] flex-1' :
                  i === currentPage - 1 ? 'bg-[#9A0000]/40 flex-1' :
                  'bg-slate-200 flex-[0.4]'
                }`}
              />
            ))}
          </div>
          <p className="text-[#9A0000] text-xs font-medium tracking-[0.25em] uppercase mb-5">Preferensi Kerja</p>
          <h1
            style={{ fontSize: 'clamp(2.2rem, 3.5vw, 4rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}
            className="text-slate-900 font-light max-w-5xl mb-6"
          >
            Inventori{' '}
            <span className="text-[#9A0000]">Kepribadian Kerja</span>
          </h1>
          <p className="text-slate-900 text-sm leading-relaxed max-w-md">
            Pilih pernyataan yang <strong className="text-[#9A0000] font-semibold">paling mencerminkan</strong> diri Anda dari setiap pasangan.
          </p>
        </div>

        {/* Tutorial card — only on page 1 */}
        {currentPage === 1 && (
          <div className="mb-10 rounded-3xl border border-[#9A0000]/15 bg-red-50/40 overflow-hidden">
            <div className="flex items-center gap-3 px-6 py-4 border-b border-[#9A0000]/10">
              <BookOpen className="w-4 h-4 text-[#9A0000]" />
              <span className="text-[#9A0000] text-xs font-semibold uppercase tracking-widest">Panduan Pengerjaan</span>
            </div>
            <div className="p-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                {
                  icon: <Layers className="w-4 h-4" />,
                  title: '9 Halaman, 10 Soal',
                  desc: 'Total 90 pasang pernyataan, dibagi menjadi 9 halaman. Kerjakan satu halaman lalu klik Simpan & Lanjutkan.',
                },
                {
                  icon: <ToggleLeft className="w-4 h-4" />,
                  title: 'Pilih Satu Pernyataan',
                  desc: 'Dari setiap pasangan, pilih pernyataan yang PALING mencerminkan diri Anda. Hanya boleh memilih satu.',
                },
                {
                  icon: <ThumbsUp className="w-4 h-4" />,
                  title: 'Jujur & Spontan',
                  desc: 'Tidak ada jawaban benar atau salah. Ikuti perasaan pertama Anda tanpa terlalu banyak dipikirkan.',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-3">
                  <div className="w-8 h-8 rounded-xl bg-white border border-[#9A0000]/20 flex items-center justify-center shrink-0 text-[#9A0000] mt-0.5">
                    {item.icon}
                  </div>
                  <div>
                    <p className="text-slate-900 font-semibold text-sm mb-1">{item.title}</p>
                    <p className="text-slate-900 text-xs leading-relaxed">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Form */}
        <form action={submitAction as any} className="space-y-4">
          {pageQuestions.map((q, idx) => {
            const existingAnswer = session.answers[q.id.toString()];

            return (
              <div
                key={q.id}
                className="rounded-3xl border border-slate-200 bg-white overflow-hidden hover:border-slate-300 transition-all duration-200 shadow-sm"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-7 pt-5 pb-4 border-b border-slate-100 bg-slate-50">
                  <span className="text-[#9A0000] font-mono text-xs font-semibold">{String(startIndex + idx + 1).padStart(2, '0')}</span>
                  <span className="text-slate-900 text-xs">/</span>
                  <span className="text-slate-900 text-xs font-mono font-semibold">90</span>
                </div>

                <div className="px-7 pb-7 pt-5 space-y-3">
                  {/* Option A */}
                  <label className="relative flex items-start gap-4 p-5 cursor-pointer rounded-2xl border border-slate-200 hover:border-[#9A0000]/30 hover:bg-red-50/40 transition-all duration-200 has-[:checked]:border-[#9A0000]/40 has-[:checked]:bg-red-50/60 group">
                    <div className="flex items-center mt-0.5">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value="a"
                        defaultChecked={existingAnswer === 'a'}
                        required
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center group-has-[:checked]:border-[#9A0000] transition-all">
                        <div className="w-2 h-2 rounded-full bg-[#9A0000] scale-0 group-has-[:checked]:scale-100 transition-transform" />
                      </div>
                    </div>
                    <span className="text-sm font-semibold leading-relaxed text-slate-900 group-has-[:checked]:text-[#9A0000] transition-colors">
                      {q.optionA}
                    </span>
                  </label>

                  {/* Divider */}
                  <div className="flex items-center gap-3 px-2">
                    <div className="flex-1 h-px bg-slate-100" />
                    <span className="text-slate-900 text-[10px] font-semibold uppercase tracking-widest">atau</span>
                    <div className="flex-1 h-px bg-slate-100" />
                  </div>

                  {/* Option B */}
                  <label className="relative flex items-start gap-4 p-5 cursor-pointer rounded-2xl border border-slate-200 hover:border-[#9A0000]/30 hover:bg-red-50/40 transition-all duration-200 has-[:checked]:border-[#9A0000]/40 has-[:checked]:bg-red-50/60 group">
                    <div className="flex items-center mt-0.5">
                      <input
                        type="radio"
                        name={`q_${q.id}`}
                        value="b"
                        defaultChecked={existingAnswer === 'b'}
                        required
                        className="peer sr-only"
                      />
                      <div className="w-5 h-5 rounded-full border-2 border-slate-300 flex items-center justify-center group-has-[:checked]:border-[#9A0000] transition-all">
                        <div className="w-2 h-2 rounded-full bg-[#9A0000] scale-0 group-has-[:checked]:scale-100 transition-transform" />
                      </div>
                    </div>
                    <span className="text-sm font-semibold leading-relaxed text-slate-900 group-has-[:checked]:text-[#9A0000] transition-colors">
                      {q.optionB}
                    </span>
                  </label>
                </div>
              </div>
            );
          })}

          {/* Submit */}
          <div className="pt-8 pb-16 flex flex-col sm:flex-row items-center justify-between gap-6 border-t border-slate-200 mt-8">
            <div>
              <p className="text-slate-900 text-sm font-medium">
                Halaman <span className="text-[#9A0000] font-mono font-bold">{currentPage}</span> dari <span className="text-slate-900 font-mono">{totalPages}</span>
              </p>
            </div>
            <button
              type="submit"
              className="inline-flex items-center gap-3 px-8 py-4 rounded-2xl text-sm font-medium bg-[#9A0000] text-white hover:bg-red-800 transition-all duration-200 active:scale-[0.97] shadow-lg shadow-[#9A0000]/20 w-full sm:w-auto justify-center"
            >
              {currentPage === totalPages ? 'Selesaikan Tes' : 'Simpan & Lanjutkan'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}
