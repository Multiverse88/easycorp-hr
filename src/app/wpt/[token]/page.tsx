'use client';

import React, { useState, useEffect, useCallback, useRef, Suspense } from 'react';
import { useRouter, useParams, useSearchParams } from 'next/navigation';
import { getCandidateByToken, saveWptTestResult, getWptTestResultByCandidate, getDiscTestResultByCandidate, Candidate } from '@/lib/db';
import { wptQuestions, WPT_DURATION_MINUTES, WPT_TOTAL_QUESTIONS } from '@/lib/wptData';
import { calculateWptResult } from '@/lib/wptParser';
import { ChevronLeft, ChevronRight, Clock, Check, ArrowRight, Brain, AlarmClock, Navigation, CheckCircle } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

function WptTestContent() {
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const token = params.token as string;
  const isPreview = searchParams.get('preview') === 'true';

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(WPT_DURATION_MINUTES * 60);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) { setError('Tautan tidak valid atau telah kedaluwarsa.'); return; }
        if (!data.pendidikan) { router.push(`/apply/${token}`); return; }
        const discResult = await getDiscTestResultByCandidate(data.id);
        if (!discResult && !isPreview) { router.push(`/disc/${token}`); return; }
        const existingTest = await getWptTestResultByCandidate(data.id);
        if (existingTest && !isPreview) { router.push(`/papikostik/${token}`); return; }
        setCandidate(data);
        setAnswers(wptQuestions.map(q => ({ questionId: q.id, answer: '' })));
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

  const handleSubmit = useCallback(async () => {
    if (!candidate || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;
    try {
      setSubmitting(true);
      setSubmitError(null);
      const answeredQuestions = answers.filter(a => a.answer.trim() !== '');
      const result = calculateWptResult(answeredQuestions);
      await saveWptTestResult({
        candidate_id: candidate.id, answers: answeredQuestions,
        skor: result.skor, total_soal: WPT_TOTAL_QUESTIONS,
        persen_benar: Math.round(result.persenBenar * 100) / 100,
        kategori: result.kategori, profil_kemampuan: result.profilKemampuan,
        rekomendasi_posisi: result.rekomendasiPosisi, completed_at: new Date().toISOString(),
      });
      router.push(`/papikostik/${token}`);
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      setSubmitError(`Gagal mengirim: ${errorMsg}`);
      autoSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [candidate, answers, router, token]);

  useEffect(() => {
    if (loading || submitted || submitting || error || showInstructions) return;
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) { if (timerRef.current) clearInterval(timerRef.current); handleSubmit(); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [loading, submitted, submitting, error, showInstructions, handleSubmit]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => prev.map(a => a.questionId === questionId ? { ...a, answer: value } : a));
  };

  const currentQuestion = wptQuestions[currentIdx];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const answeredCount = answers.filter(a => a.answer.trim() !== '').length;
  const isTestComplete = answeredCount === WPT_TOTAL_QUESTIONS;
  const progressPercent = WPT_TOTAL_QUESTIONS > 0 ? (answeredCount / WPT_TOTAL_QUESTIONS) * 100 : 0;
  const isTimeCritical = timeLeft <= 60;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
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
          <h2 className="text-2xl font-light text-slate-900 mb-3">Akses Error</h2>
          <p className="text-slate-400 text-sm leading-relaxed mb-8">{error}</p>
          <button
            onClick={() => router.push(`/disc/${token}`)}
            className="w-full bg-[#9A0000] text-white py-3.5 rounded-xl text-sm font-medium hover:bg-red-800 transition-colors"
          >
            Mulai DISC Dulu
          </button>
        </div>
      </div>
    );
  }

  // --- INSTRUCTION SCREEN ---
  if (showInstructions) {
    return (
      <div className="min-h-[100dvh] bg-[#f9f9f7] flex flex-col items-center justify-center px-4 py-12" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-[#9A0000]/4 rounded-full blur-[140px]" />
        </div>

        <div className="relative z-10 w-full max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-9 h-9 flex items-center justify-center shrink-0">
              <img src="/logo-ec-icon.png" alt="EC Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <p className="text-[#9A0000] text-xs font-semibold uppercase tracking-widest">EasyCorp Assessment</p>
              <p className="text-slate-900 text-sm font-semibold">WPT — Kemampuan Kognitif</p>
            </div>
          </div>

          <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-3">Sebelum Memulai</h1>
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Baca panduan berikut dengan seksama.{' '}
            <strong className="text-[#9A0000]">Timer dimulai saat Anda menekan tombol Mulai.</strong>
          </p>

          <div className="space-y-4 mb-10">
            {[
              {
                icon: <Brain className="w-5 h-5" />,
                title: `${WPT_TOTAL_QUESTIONS} Soal Kognitif`,
                desc: 'Soal mencakup kemampuan numerik, verbal, logika, dan penalaran analitis.',
              },
              {
                icon: <AlarmClock className="w-5 h-5" />,
                title: `Waktu ${WPT_DURATION_MINUTES} Menit`,
                desc: 'Timer mulai berjalan saat Anda menekan "Mulai Tes". Tes otomatis terkirim saat waktu habis.',
              },
              {
                icon: <Navigation className="w-5 h-5" />,
                title: 'Navigasi Bebas',
                desc: 'Klik nomor soal di bagian atas untuk berpindah antar soal. Soal yang sudah dijawab ditandai warna merah.',
              },
              {
                icon: <CheckCircle className="w-5 h-5" />,
                title: 'Jawab Sebanyak Mungkin',
                desc: 'Tidak ada pengurangan nilai untuk jawaban salah. Utamakan soal yang Anda yakin, lalu kerjakan sisanya.',
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

          <button
            onClick={() => { setShowInstructions(false); setTimeout(() => setRevealed(true), 80); }}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#9A0000] text-white text-sm font-semibold hover:bg-red-800 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#9A0000]/20"
          >
            Mulai Tes & Jalankan Timer
            <ArrowRight className="w-5 h-5" />
          </button>

          <p className="text-center text-xs text-[#9A0000] mt-4">
            Timer {WPT_DURATION_MINUTES} menit dimulai saat tombol ini ditekan
          </p>
        </div>
      </div>
    );
  }

  return (
    <main className="overflow-x-hidden w-full max-w-full min-h-[100dvh] bg-[#f9f9f7]" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <LoadingOverlay visible={submitting} message="Mengirim jawaban..." />

      {/* Subtle ambient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[400px] bg-[#9A0000]/3 rounded-full blur-[140px]" />
      </div>

      {/* Top progress bar */}
      <div className="fixed top-0 left-0 right-0 z-50 h-[3px] bg-slate-100">
        <div className="h-full bg-[#9A0000] transition-all duration-500 ease-out" style={{ width: `${progressPercent}%` }} />
      </div>

      {/* Floating Nav Pill */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-2xl">
        <nav className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src="/logo-ec-icon.png" alt="EC Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[#9A0000] font-medium text-sm hidden sm:block">WPT Kognitif</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-slate-900 font-semibold text-xs hidden sm:block truncate max-w-[130px]">{candidate?.nama}</span>
            <div className={`flex items-center gap-2 rounded-lg px-3 py-1.5 font-mono text-xs border transition-all ${
              isTimeCritical
                ? 'bg-red-50 border-red-200 text-red-600 animate-pulse'
                : 'bg-red-50 border-[#9A0000]/20 text-slate-900 font-semibold'
            }`}>
              <Clock className="w-3.5 h-3.5" />
              <span>{formatTime(timeLeft)}</span>
            </div>
          </div>
        </nav>
      </div>

      <div className="relative z-10 pt-28 pb-44 px-4 sm:px-6 max-w-4xl mx-auto">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-[#9A0000] text-xs font-medium tracking-[0.25em] uppercase mb-5">Kemampuan Kognitif</p>
          <h1
            style={{ fontSize: 'clamp(2.2rem, 3.5vw, 4rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}
            className="text-slate-900 font-light max-w-5xl mb-6"
          >
            Penilaian{' '}
            <span className="text-[#9A0000]">Problem Solving</span>
          </h1>
          <p className="text-slate-900 text-sm leading-relaxed max-w-md">
            {WPT_TOTAL_QUESTIONS} soal untuk mengukur kemampuan berpikir analitis dan logika. Waktu {WPT_DURATION_MINUTES} menit.
          </p>
        </div>

        {/* Question navigator dots */}
        <div className="mb-10 flex gap-1.5 flex-wrap max-w-2xl">
          {answers.map((ans, idx) => {
            const isDone = ans.answer.trim() !== '';
            const isActive = idx === currentIdx;
            return (
              <button
                key={ans.questionId}
                onClick={() => setCurrentIdx(idx)}
                className={`w-6 h-6 rounded-md text-[9px] font-mono transition-all duration-200 ${
                  isActive ? 'bg-[#9A0000] text-white scale-110 shadow-md shadow-[#9A0000]/20' :
                  isDone ? 'bg-red-50 text-[#9A0000] border border-[#9A0000]/30' :
                  'bg-white text-slate-900 border border-slate-300 hover:border-slate-300'
                }`}
              >
                {idx + 1}
              </button>
            );
          })}
        </div>

        {/* Main Question Card */}
        {currentQuestion && (
          <div
            className="rounded-3xl border border-slate-200 bg-white overflow-hidden mb-8 shadow-sm"
            style={{
              opacity: revealed ? 1 : 0,
              transform: revealed ? 'translateY(0)' : 'translateY(16px)',
              transition: 'opacity 0.5s ease, transform 0.5s ease',
            }}
          >
            {/* Card top strip */}
            <div className="bg-slate-50 border-b border-slate-100 px-8 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-slate-900 text-xs font-mono">{String(currentIdx + 1).padStart(2, '0')}</span>
                <span className="text-slate-900 text-xs">/</span>
                <span className="text-slate-900 text-xs font-mono">{WPT_TOTAL_QUESTIONS}</span>
              </div>
              <span className="text-[#9A0000] text-xs uppercase tracking-widest">{currentQuestion.category}</span>
            </div>

            <div className="p-8 md:p-12">
              <p className="text-xl md:text-2xl font-light text-slate-900 leading-relaxed mb-10 whitespace-pre-line tracking-tight">
                {currentQuestion.question}
              </p>

              {currentQuestion.image && (
                <div className="mb-8 rounded-2xl overflow-hidden border border-slate-100 inline-block">
                  <img src={currentQuestion.image} alt="Referensi" className="max-h-48 w-auto object-contain" />
                </div>
              )}

              {/* Options */}
              {currentQuestion.type === 'pilihan_ganda' && currentQuestion.options && (
                <div className="grid gap-3">
                  {currentQuestion.options.map((opt, optIdx) => {
                    const value = String(optIdx + 1);
                    const isSelected = currentAnswer?.answer === value;
                    return (
                      <button
                        key={optIdx}
                        onClick={() => handleAnswerChange(currentQuestion.id, value)}
                        className={`group w-full flex items-center text-left p-5 rounded-2xl border transition-all duration-200 active:scale-[0.99] ${
                          isSelected
                            ? 'border-[#9A0000]/30 bg-red-50/60 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        <div className={`w-7 h-7 rounded-xl flex items-center justify-center text-xs font-mono mr-5 shrink-0 transition-all ${
                          isSelected ? 'bg-[#9A0000] text-white' : 'bg-slate-100 text-slate-400 group-hover:bg-slate-200'
                        }`}>
                          {isSelected ? <Check className="w-3.5 h-3.5" strokeWidth={3} /> : optIdx + 1}
                        </div>
                        <span className={`font-light text-sm md:text-base leading-snug transition-colors ${isSelected ? 'text-slate-900' : 'text-slate-900 group-hover:text-slate-900'}`}>
                          {currentQuestion.optionImages?.[optIdx] ? (
                            <img src={currentQuestion.optionImages[optIdx]} alt={`Opsi ${optIdx + 1}`} className="h-12 w-auto" />
                          ) : opt}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'ya_tidak' && (
                <div className="grid grid-cols-2 gap-4">
                  {['YA', 'TIDAK'].map(opt => {
                    const isSelected = currentAnswer?.answer === opt;
                    return (
                      <button
                        key={opt}
                        onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                        className={`p-5 rounded-2xl border font-medium text-sm tracking-wider transition-all duration-200 active:scale-[0.98] ${
                          isSelected
                            ? 'border-[#9A0000]/30 bg-red-50/60 text-slate-900 shadow-sm'
                            : 'border-slate-200 text-slate-900 hover:border-slate-300 hover:bg-slate-50'
                        }`}
                      >
                        {opt}
                      </button>
                    );
                  })}
                </div>
              )}

              {currentQuestion.type === 'isian' && (
                <input
                  type="text"
                  value={currentAnswer?.answer || ''}
                  onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                  placeholder="Tulis jawaban..."
                  className="w-full p-5 rounded-2xl border border-slate-200 bg-slate-50 text-slate-900 font-light placeholder:text-slate-300 focus:outline-none focus:border-[#9A0000]/40 focus:ring-2 focus:ring-[#9A0000]/10 transition-all text-base"
                />
              )}
            </div>

            {/* Pagination */}
            <div className="border-t border-slate-100 px-8 py-5 flex items-center justify-between bg-slate-50/50">
              <button
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="flex items-center gap-2 text-sm text-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                <ChevronLeft className="w-4 h-4" /> Sebelumnya
              </button>
              <span className="text-[#9A0000] font-semibold text-xs font-mono">{answeredCount} terjawab</span>
              <button
                onClick={() => setCurrentIdx(prev => Math.min(wptQuestions.length - 1, prev + 1))}
                disabled={currentIdx === wptQuestions.length - 1}
                className="flex items-center gap-2 text-sm text-slate-900 hover:text-slate-900 disabled:opacity-30 disabled:pointer-events-none transition-colors"
              >
                Berikutnya <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Submit Footer */}
      <div className="fixed bottom-0 left-0 right-0 z-50 px-4 py-4 bg-white/90 backdrop-blur-2xl border-t border-slate-200">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <p className="text-slate-900 text-sm">
              <span className="text-slate-900 font-semibold">{answeredCount}</span>
              <span className="text-[#9A0000] font-semibold"> dari {WPT_TOTAL_QUESTIONS} terjawab</span>
            </p>
            {submitError && <p className="text-red-600 text-xs mt-0.5">{submitError}</p>}
          </div>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`flex items-center gap-2.5 px-8 py-3.5 rounded-xl text-sm font-medium transition-all duration-200 active:scale-[0.97] w-full sm:w-auto justify-center ${
              isTestComplete
                ? 'bg-[#9A0000] text-white hover:bg-red-800 shadow-lg shadow-[#9A0000]/20'
                : 'bg-slate-100 text-slate-900 opacity-50 border border-slate-200'
            }`}
          >
            {submitting ? (
              <div className="w-4 h-4 border-2 border-[#9A0000]/30 border-t-[#9A0000] rounded-full animate-spin" />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
            {submitting ? 'Mengirim...' : 'Kirim Jawaban'}
          </button>
        </div>
      </div>
    </main>
  );
}

export default function WptTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-[#9A0000] rounded-full animate-spin" />
      </div>
    }>
      <WptTestContent />
    </Suspense>
  );
}
