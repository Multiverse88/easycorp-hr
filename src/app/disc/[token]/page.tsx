'use client';

import React, { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCandidateByToken, saveDiscTestResult, getDiscTestResultByCandidate, Candidate } from '@/lib/db';
import { discQuestions } from '@/lib/discData';
import { calculateDiscResult } from '@/lib/discParser';
import { Check, ArrowRight, MousePointerClick, ListChecks, ThumbsUp, Clock } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

interface AnswerState {
  questionId: number;
  most: string | null;
  least: string | null;
}

function DiscTestContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const isPreview = searchParams.get('preview') === 'true';

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [answers, setAnswers] = useState<AnswerState[]>([]);

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) { setError('Tautan tidak valid atau telah kedaluwarsa.'); return; }
        if (!data.pendidikan) { router.push(`/apply/${token}`); return; }
        const existingTest = await getDiscTestResultByCandidate(data.id);
        if (existingTest && !isPreview) { router.push(`/wpt/${token}`); return; }
        setCandidate(data);
        setAnswers(discQuestions.map(q => ({ questionId: q.id, most: null, least: null })));
        setTimeout(() => setRevealed(true), 80);
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadCandidate();
  }, [token, router, isPreview]);

  const handleSelect = (questionId: number, type: 'most' | 'least', wordText: string) => {
    setAnswers(prev => prev.map(ans => {
      if (ans.questionId !== questionId) return ans;
      let newMost = ans.most;
      let newLeast = ans.least;
      if (type === 'most') { newMost = wordText; if (newLeast === wordText) newLeast = null; }
      else { newLeast = wordText; if (newMost === wordText) newMost = null; }
      return { questionId, most: newMost, least: newLeast };
    }));
  };

  const completedCount = answers.filter(a => a.most !== null && a.least !== null).length;
  const isTestComplete = completedCount === discQuestions.length;
  const progressPercent = discQuestions.length > 0 ? (completedCount / discQuestions.length) * 100 : 0;

  const handleSubmit = async () => {
    if (!isTestComplete || !candidate) { setSubmitError('Selesaikan semua 28 kelompok kata terlebih dahulu.'); return; }
    try {
      setSubmitting(true);
      setSubmitError(null);
      const formattedAnswers = answers.map(a => ({ questionId: a.questionId, most: a.most as string, least: a.least as string }));
      const result = calculateDiscResult(formattedAnswers);
      await saveDiscTestResult({
        candidate_id: candidate.id, answers: formattedAnswers,
        skor_d: result.D.m || 0, skor_i: result.I.m || 0, skor_s: result.S.m || 0, skor_c: result.C.m || 0,
        persen_d: isNaN(result.D.percent) ? 0 : result.D.percent,
        persen_i: isNaN(result.I.percent) ? 0 : result.I.percent,
        persen_s: isNaN(result.S.percent) ? 0 : result.S.percent,
        persen_c: isNaN(result.C.percent) ? 0 : result.C.percent,
        tipe_primer: result.primary, tipe_sekunder: result.secondary, completed_at: new Date().toISOString()
      });
      router.push(`/wpt/${token}`);
    } catch (err: any) {
      setSubmitError(`Gagal mengirim: ${err.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-white">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-[#9A0000] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-[100dvh] bg-white px-6">
        <div className="w-full max-w-sm text-center">
          <div className="w-14 h-14 rounded-2xl border border-red-200 bg-red-50 flex items-center justify-center mx-auto mb-6">
            <span className="text-xl text-red-600 font-light">!</span>
          </div>
          <h2 className="text-2xl font-light text-slate-900 mb-3 tracking-tight">Akses Tidak Valid</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // --- INSTRUCTION SCREEN ---
  if (showInstructions) {
    return (
      <div className="min-h-[100dvh] bg-[#f9f9f7] flex flex-col items-center justify-center px-4 py-12" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        {/* Ambient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 left-1/4 w-[600px] h-[400px] bg-[#9A0000]/4 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Badge */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/logo-ec-icon.png" alt="EC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[#9A0000] text-xs font-semibold uppercase tracking-widest">EasyCorp Assessment</p>
              <p className="text-slate-900 text-sm font-semibold">DISC Behavioral Test</p>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-3">
            Sebelum Memulai
          </h1>
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Baca panduan berikut dengan seksama sebelum mengerjakan tes.
          </p>

          {/* Steps */}
          <div className="space-y-4 mb-10">
            {[
              {
                icon: <ListChecks className="w-5 h-5" />,
                title: '28 Kelompok Kata',
                desc: 'Terdapat 28 kelompok kata sifat, masing-masing berisi 4 pilihan kata.',
              },
              {
                icon: <MousePointerClick className="w-5 h-5" />,
                title: 'Pilih PALING dan PALING TIDAK',
                desc: 'Pada setiap kelompok, pilih satu kata yang paling menggambarkan Anda dan satu kata yang paling tidak menggambarkan Anda.',
              },
              {
                icon: <ThumbsUp className="w-5 h-5" />,
                title: 'Jawab dengan Jujur',
                desc: 'Tidak ada jawaban benar atau salah. Pilih kata yang paling mencerminkan kepribadian Anda sehari-hari.',
              },
              {
                icon: <Clock className="w-5 h-5" />,
                title: 'Tidak Ada Batas Waktu',
                desc: 'Anda dapat mengerjakan dengan santai. Pastikan semua 28 kelompok terjawab sebelum mengirim.',
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-10 h-10 rounded-xl bg-red-50 border border-[#9A0000]/15 flex items-center justify-center shrink-0 text-[#9A0000]">
                  {step.icon}
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm mb-0.5">{step.title}</p>
                  <p className="text-slate-900 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={() => { setShowInstructions(false); setTimeout(() => setRevealed(true), 80); }}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#9A0000] text-white text-sm font-semibold hover:bg-red-800 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#9A0000]/20"
          >
            Mulai Tes DISC
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-[#9A0000] mt-4">
            Anda tidak dapat kembali ke halaman ini setelah memulai
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-[100dvh] bg-[#f9f9f7]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <LoadingOverlay visible={submitting} message="Memproses evaluasi..." />

      {/* Subtle ambient tint — very light */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 left-1/4 w-[700px] h-[400px] bg-[#9A0000]/4 rounded-full blur-[140px]" />
      </div>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-100">
        <div
          className="h-full bg-[#9A0000] transition-all duration-500 ease-out"
          style={{ width: `${progressPercent}%` }}
        />
      </div>

      {/* Floating Nav Pill */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-2xl">
        <nav className="bg-white/95 backdrop-blur-xl border border-slate-200 rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src="/logo-ec-icon.png" alt="EC Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[#9A0000] text-sm font-medium hidden sm:block">DISC Behavioral</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-900 text-xs font-semibold hidden sm:block truncate max-w-[140px]">{candidate?.nama}</span>
            <div className="flex items-center gap-2 bg-red-50 border border-[#9A0000]/20 rounded-lg px-3 py-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-[#9A0000]" />
              <span className="text-slate-900 font-mono text-xs font-semibold">{completedCount}<span className="text-[#9A0000]">/28</span></span>
            </div>
          </div>
        </nav>
      </div>

      <div className="relative z-10 pt-28 pb-44 px-4 sm:px-6 max-w-6xl mx-auto">

        {/* Hero — Editorial Split */}
        <div className="mb-20 grid grid-cols-1 md:grid-cols-2 gap-12 items-end">
          <div>
            <p className="text-[#9A0000] text-xs font-medium tracking-[0.25em] uppercase mb-6">Penilaian Perilaku</p>
            <h1
              style={{ fontSize: 'clamp(2.5rem, 4vw, 4.5rem)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
              className="text-slate-900 font-light max-w-xl"
            >
              Profil{' '}
              <span
                className="inline-block rounded-xl align-middle mx-1 overflow-hidden"
                style={{ width: 'clamp(3rem, 5.5vw, 5rem)', height: 'clamp(1.8rem, 3vw, 2.8rem)', backgroundImage: 'url(https://picsum.photos/seed/personality/400/200)', backgroundSize: 'cover', backgroundPosition: 'center', filter: 'grayscale(20%) contrast(1.1) brightness(0.95)' }}
              />{' '}
              Kepribadian DISC
            </h1>
          </div>
          <div className="md:pb-1">
            <p className="text-slate-900 text-sm leading-relaxed max-w-sm">
              Pilih satu kata yang <strong className="text-[#9A0000] font-semibold">paling menggambarkan</strong> dan satu yang <strong className="text-[#9A0000] font-semibold">paling tidak menggambarkan</strong> diri Anda pada setiap kelompok.
            </p>
            <div className="mt-7 flex gap-4 text-xs text-[#9A0000] font-medium uppercase tracking-widest">
              <span>28 Kelompok</span>
              <span className="text-slate-900">•</span>
              <span>Tidak ada batas waktu</span>
            </div>
          </div>
        </div>

        {/* Column Headers */}
        <div className="mb-4 flex items-center justify-end gap-3 pr-1 max-w-3xl ml-auto">
          <span className="text-[10px] text-slate-900 font-semibold uppercase tracking-widest w-12 text-center">Paling</span>
          <span className="text-[10px] text-slate-900 font-semibold uppercase tracking-widest w-12 text-center">Tidak</span>
        </div>

        {/* Question Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 grid-flow-dense">
          {discQuestions.map((q, qIdx) => {
            const answer = answers.find(a => a.questionId === q.id) || { questionId: q.id, most: null, least: null };
            const isComplete = answer.most && answer.least;

            return (
              <div
                key={q.id}
                className={`group relative rounded-2xl border transition-all duration-300 overflow-hidden bg-white ${
                  isComplete
                    ? 'border-[#9A0000]/20 shadow-sm shadow-[#9A0000]/5'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-sm'
                }`}
                style={{
                  opacity: revealed ? 1 : 0,
                  transform: revealed ? 'translateY(0)' : 'translateY(12px)',
                  transition: `opacity 0.4s ease ${(qIdx % 9) * 25}ms, transform 0.4s ease ${(qIdx % 9) * 25}ms, border-color 0.2s, box-shadow 0.2s`
                }}
              >
                {/* Card header */}
                <div className={`flex items-center justify-between px-5 pt-4 pb-3 border-b ${isComplete ? 'border-[#9A0000]/20 bg-red-50/60' : 'border-slate-100 bg-slate-50'}`}>
                  <div className="flex items-center gap-2.5">
                    <span className={`w-5 h-5 rounded-md text-[10px] font-mono flex items-center justify-center transition-all ${isComplete ? 'bg-[#9A0000] text-white' : 'bg-slate-200 text-slate-900'}`}>
                      {isComplete ? <Check className="w-2.5 h-2.5" strokeWidth={3} /> : q.id}
                    </span>
                    <span className="text-[9px] text-[#9A0000] font-semibold uppercase tracking-[0.15em]">Kelompok {q.id}</span>
                  </div>
                  <div className="flex gap-2 text-[9px] text-slate-900 font-semibold">
                    <span className="w-12 text-center">Paling</span>
                    <span className="w-12 text-center">Tidak</span>
                  </div>
                </div>

                {/* Word rows */}
                <div className="divide-y divide-slate-100">
                  {q.words.map((word) => {
                    const isMost = answer.most === word.text;
                    const isLeast = answer.least === word.text;
                    return (
                      <div key={word.text} className="flex items-center justify-between px-5 py-3.5 hover:bg-slate-50 transition-colors">
                        <span className={`text-sm font-semibold leading-tight transition-colors ${(isMost || isLeast) ? 'text-[#9A0000]' : 'text-slate-900'}`}>
                          {word.text}
                        </span>
                        <div className="flex gap-2 shrink-0">
                          {/* MOST */}
                          <button
                            onClick={() => handleSelect(q.id, 'most', word.text)}
                            aria-label={`${word.text} - paling`}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 ${
                              isMost
                                ? 'bg-[#9A0000] shadow-md shadow-[#9A0000]/20'
                                : 'bg-slate-100 hover:bg-red-50 hover:border-[#9A0000]/30 border border-slate-200'
                            }`}
                          >
                            {isMost && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>
                          {/* LEAST */}
                          <button
                            onClick={() => handleSelect(q.id, 'least', word.text)}
                            aria-label={`${word.text} - tidak`}
                            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-all duration-150 active:scale-90 ${
                              isLeast
                                ? 'bg-slate-700 shadow-md shadow-slate-400/20'
                                : 'bg-slate-100 hover:bg-slate-200 border border-slate-200'
                            }`}
                          >
                            {isLeast && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Sticky Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 bg-white/90 backdrop-blur-2xl border-t border-slate-200">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <p className="text-slate-900 text-sm font-medium">
                <span className="text-[#9A0000] font-bold">{completedCount}</span>
                <span className="text-slate-900"> dari 28 selesai</span>
              </p>
              {submitError && <p className="text-red-600 text-xs mt-0.5">{submitError}</p>}
            </div>
            {/* Dot progress */}
            <div className="hidden sm:flex gap-1 flex-wrap max-w-[200px]">
              {discQuestions.map((q) => {
                const a = answers.find(x => x.questionId === q.id);
                const done = a?.most && a?.least;
                return (
                  <div key={q.id} className={`w-1.5 h-1.5 rounded-full transition-colors duration-300 ${done ? 'bg-[#9A0000]' : 'bg-slate-200'}`} />
                );
              })}
            </div>
          </div>

          <button
            onClick={handleSubmit}
            disabled={!isTestComplete || submitting}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] w-full sm:w-auto justify-center ${
              isTestComplete
                ? 'bg-[#9A0000] text-white hover:bg-red-800 shadow-lg shadow-[#9A0000]/20'
                : 'bg-slate-100 text-slate-900 border border-slate-300 cursor-not-allowed opacity-50'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {submitting ? 'Mengirim...' : 'Kirim Evaluasi'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function DiscTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-[#9A0000] rounded-full animate-spin" />
      </div>
    }>
      <DiscTestContent />
    </Suspense>
  );
}
