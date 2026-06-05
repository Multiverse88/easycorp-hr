'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, saveWptTestResult, getWptTestResultByCandidate, getDiscTestResultByCandidate, Candidate } from '@/lib/db';
import { wptQuestions, WPT_DURATION_MINUTES, WPT_TOTAL_QUESTIONS } from '@/lib/wptData';
import { calculateWptResult } from '@/lib/wptParser';
import { Brain, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2, CheckCircle, Clock } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function WptTestPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // WPT state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<{ questionId: number; answer: string }[]>([]);
  const [timeLeft, setTimeLeft] = useState(WPT_DURATION_MINUTES * 60);
  const [isPaused, setIsPaused] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const autoSubmittedRef = useRef(false);

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) {
          setError('Tautan tidak valid atau telah kedaluwarsa. Silakan hubungi HR EasyLegal.');
          return;
        }

        if (!data.pendidikan) {
          router.push(`/apply/${token}`);
          return;
        }

        // Check if DISC test completed first
        const discResult = await getDiscTestResultByCandidate(data.id);
        if (!discResult) {
          router.push(`/disc/${token}`);
          return;
        }

        // Check if WPT already completed
        const existingTest = await getWptTestResultByCandidate(data.id);
        if (existingTest) {
          setError('ALREADY_COMPLETED');
          return;
        }

        setCandidate(data);

        const initialAnswers = wptQuestions.map(q => ({
          questionId: q.id,
          answer: '',
        }));
        setAnswers(initialAnswers);
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    }

    if (token) {
      loadCandidate();
    }
  }, [token, router]);

  const handleSubmit = useCallback(async () => {
    if (!candidate || autoSubmittedRef.current) return;
    autoSubmittedRef.current = true;

    try {
      setSubmitting(true);
      setSubmitError(null);

      const answeredQuestions = answers.filter(a => a.answer.trim() !== '');
      const result = calculateWptResult(answeredQuestions);

      const wptData = {
        candidate_id: candidate.id,
        answers: answeredQuestions,
        skor: result.skor,
        total_soal: WPT_TOTAL_QUESTIONS,
        persen_benar: Math.round(result.persenBenar * 100) / 100,
        kategori: result.kategori,
        profil_kemampuan: result.profilKemampuan,
        rekomendasi_posisi: result.rekomendasiPosisi,
        completed_at: new Date().toISOString(),
      };

      await saveWptTestResult(wptData);
      setSubmitted(true);
    } catch (err: unknown) {
      console.error('WPT submit error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      if (errorMsg === 'WPT_TEST_ALREADY_COMPLETED') {
        setSubmitError('Tes WPT sudah pernah diselesaikan.');
      } else {
        setSubmitError(`Gagal mengirim jawaban: ${errorMsg}`);
      }
      autoSubmittedRef.current = false;
    } finally {
      setSubmitting(false);
    }
  }, [candidate, answers]);

  // Timer countdown
  useEffect(() => {
    if (loading || submitted || submitting || error || isPaused) return;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) clearInterval(timerRef.current);
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loading, submitted, submitting, error, isPaused, handleSubmit]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers(prev => prev.map(a =>
      a.questionId === questionId ? { ...a, answer: value } : a
    ));
  };

  const currentQuestion = wptQuestions[currentIdx];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id);
  const isCurrentAnswered = currentAnswer && currentAnswer.answer.trim() !== '';

  const answeredCount = answers.filter(a => a.answer.trim() !== '').length;
  const isTestComplete = answeredCount === WPT_TOTAL_QUESTIONS;

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const unansweredQuestions = answers
    .map((a, idx) => ({ ...a, idx }))
    .filter(a => a.answer.trim() === '');

  const handleNext = () => {
    if (currentIdx < wptQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(15_60%_97%)]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(350_60%_50%)]" />
        <p className="mt-4 text-slate-600 text-sm font-medium">Menyiapkan Tes IQ (WPT)...</p>
      </div>
    );
  }

  if (error === 'DISC_NOT_COMPLETED') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(15_60%_97%)] px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-amber-50 text-amber-600 mb-4">
            <AlertTriangle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">DISC Belum Selesai</h2>
          <p className="text-slate-600 mb-6">
            Anda harus menyelesaikan tes DISC terlebih dahulu sebelum mengerjakan tes IQ (WPT).
          </p>
          <button
            onClick={() => router.push(`/disc/${token}`)}
            className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(350_55%_55%)] to-[hsl(350_60%_45%)] text-white font-bold px-6 py-3 rounded-xl text-sm"
          >
            Kerjakan Tes DISC
          </button>
        </div>
      </div>
    );
  }

  if (error === 'ALREADY_COMPLETED') {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(15_60%_97%)] px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-blue-50 text-blue-600 mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Tes WPT Sudah Selesai</h2>
          <p className="text-slate-600 mb-6">
            Token ini sudah digunakan untuk menyelesaikan tes WPT. Setiap token hanya bisa digunakan satu kali.
          </p>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            EasyLegal Recruitment System
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(15_60%_97%)] px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-4">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mb-2">Tautan Tidak Valid</h2>
          <p className="text-slate-600 mb-6">{error}</p>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            EasyLegal Recruitment System
          </div>
        </div>
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(15_60%_97%)] px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-emerald-50 text-emerald-600 mb-4">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Semua Tes Selesai</h2>
          <p className="text-slate-600 mb-2">
            Terima kasih, <strong>{candidate?.nama}</strong>.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Jawaban asesmen DISC dan Tes IQ (WPT) Anda telah berhasil dikirimkan. Tim HR akan menghubungi Anda untuk tahap selanjutnya.
          </p>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            EasyLegal Recruitment System
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(15_60%_97%)] flex flex-col page-enter">
      <LoadingOverlay visible={submitting} message="Mengirim jawaban WPT..." />

      {/* Bespoke Top Navbar for EasyLegal Assessment Portal - White SaaS Header */}
      <nav className="bg-white border-b border-slate-200 py-3 px-4 sm:px-6 shadow-sm flex items-center justify-between text-sm font-semibold select-none z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <img src="/logo-easylegal.png" alt="EasyLegal Logo" className="h-9 w-auto object-contain" />
          <span className="hidden sm:inline-block text-slate-400 text-xs font-semibold pl-3 border-l border-slate-200">
            Assessment Portal
          </span>
        </div>
        
        <div className="flex items-center gap-4 text-xs font-semibold">
          <span className="bg-[#9A0000]/10 text-[#9A0000] border border-[#9A0000]/25 rounded-full px-3 py-0.5 font-bold uppercase tracking-wider text-[10px] hidden md:inline-block">
            WPT IQ Test
          </span>
          {candidate && (
            <span className="text-slate-600 text-xs pl-3 border-l border-slate-200 md:border-l-0">
              Kandidat: <strong className="text-slate-800 font-extrabold">{candidate.nama}</strong>
            </span>
          )}
        </div>
      </nav>

      {/* Main Container */}
      <div className="flex-1 py-8 px-4 sm:px-6">
        <div className="max-w-3xl mx-auto space-y-6">
          {/* Header */}
          <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2.5 bg-[#9A0000]/10 text-[#9A0000] rounded-xl">
                <Brain className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-lg font-extrabold text-slate-950">Tes IQ — WPT (Wonderlic Personnel Test)</h1>
                <p className="text-xs text-slate-500 font-medium font-semibold">EasyLegal Recruitment &bull; {WPT_TOTAL_QUESTIONS} Soal &bull; {WPT_DURATION_MINUTES} Menit</p>
              </div>
            </div>
             <div className="flex flex-col items-center sm:items-end gap-1 select-none">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-red-500" />
                <span className={`text-lg font-extrabold tabular-nums transition-colors
                  ${timeLeft <= 60 
                    ? 'text-red-600 animate-pulse' 
                    : timeLeft <= 180 
                      ? 'text-amber-600' 
                      : 'text-slate-700'
                  }`}
                >
                  {formatTime(timeLeft)}
                </span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                Sisa Waktu
              </span>
            </div>
          </div>

          {/* Petunjuk in Brand Crimson & Soft Pinkish-Cream */}
          <div className="border border-[hsl(15_30%_88%)] rounded-xl overflow-hidden shadow-sm transition-all duration-300">
            {/* Petunjuk Header - Brand Crimson */}
            <div className="bg-[#9A0000] text-white px-4 py-2.5 flex items-center gap-1.5 font-bold text-sm tracking-wide">
              <AlertTriangle className="w-4 h-4 text-white" />
              <span>PETUNJUK PENGERJAAN</span>
            </div>
            {/* Petunjuk Body - Soft Pinkish-Cream */}
            <div className="bg-[#FAF2F2] p-4 sm:p-5 text-slate-700 text-xs sm:text-[13px] font-semibold space-y-2.5 leading-relaxed">
              <ul className="list-decimal list-inside space-y-1.5 text-slate-800 leading-relaxed font-bold">
                <li>Jawab setiap soal dengan memilih atau mengetik jawaban yang tepat.</li>
                <li>Soal berupa pilihan ganda, Ya/Tidak, atau isian singkat.</li>
                <li>Waktu pengerjaan: <strong>{WPT_DURATION_MINUTES} menit</strong>. Jawaban otomatis dikirim saat waktu habis.</li>
                <li>Jawab semua soal sebelum waktu habis untuk hasil terbaik.</li>
              </ul>
            </div>
          </div>

          {/* Progress Bar & Stepper Panel */}
          <div className="bg-white border border-slate-200 shadow-sm rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <span className="text-xs text-slate-500 font-extrabold">Progress Asesmen WPT</span>
              <span className="text-xs font-extrabold text-[#9A0000]">
                {answeredCount} dari {WPT_TOTAL_QUESTIONS} Soal Terjawab ({Math.round((answeredCount / WPT_TOTAL_QUESTIONS) * 100)}%)
              </span>
            </div>
            {/* Progress Bar Brand Crimson */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#9A0000] to-[#E30000] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(answeredCount / WPT_TOTAL_QUESTIONS) * 100}%` }}
              />
            </div>

            {/* Stepper Dots */}
            <div className="mt-1 flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 justify-center">
              {answers.map((ans, idx) => {
                const isDone = ans.answer.trim() !== '';
                const isActive = idx === currentIdx;
                return (
                  <button
                    key={ans.questionId}
                    type="button"
                    onClick={() => setCurrentIdx(idx)}
                    className={`w-6 h-6 rounded-md text-[10px] font-bold transition-all duration-150 flex items-center justify-center border
                      ${isActive
                        ? 'bg-[#9A0000] text-white border-[#9A0000] shadow scale-105'
                        : isDone
                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold'
                          : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                      }`}
                  >
                    {idx + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Warning unanswered */}
          {currentIdx === wptQuestions.length - 1 && unansweredQuestions.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-extrabold text-sm">Masih Ada Soal Belum Dijawab</h4>
              </div>
              <p className="text-sm mb-2 font-semibold">
                Ada {unansweredQuestions.length} soal yang belum terjawab. Klik nomor soal di bawah untuk langsung menuju soal tersebut:
              </p>
              <div className="flex flex-wrap gap-2">
                {unansweredQuestions.slice(0, 20).map(q => (
                  <button
                    key={q.questionId}
                    type="button"
                    onClick={() => setCurrentIdx(q.idx)}
                    className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-200 transition"
                  >
                    {q.idx + 1}
                  </button>
                ))}
                {unansweredQuestions.length > 20 && (
                  <span className="text-xs text-red-500 self-center font-bold">+{unansweredQuestions.length - 20} lagi</span>
                )}
              </div>
            </div>
          )}

          {/* Question Card */}
          {currentQuestion && (
            <div className="bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden">
              {/* Card Header in Brand Crimson */}
              <div className="bg-[#9A0000] text-white px-6 py-4 flex justify-between items-center select-none">
                <span className="text-xs font-extrabold tracking-wider uppercase text-white">{currentQuestion.category}</span>
                <span className="text-xs font-bold bg-white/15 text-white border border-white/20 px-3 py-1 rounded-full">
                  Soal {currentIdx + 1} dari {WPT_TOTAL_QUESTIONS}
                </span>
              </div>

              <div className="p-6">
                <p className="text-base font-bold text-slate-800 mb-6 whitespace-pre-line leading-relaxed">
                  {currentQuestion.question}
                </p>

                {currentQuestion.image && (
                  <div className="mb-6 flex justify-center bg-white p-4 rounded-xl border border-slate-200/60 shadow-sm max-w-full overflow-hidden">
                    <img 
                      src={currentQuestion.image} 
                      alt="Visual Question" 
                      className="max-h-56 w-auto object-contain select-none pointer-events-none rounded-lg" 
                    />
                  </div>
                )}

                {/* Pilihan Ganda */}
                {currentQuestion.type === 'pilihan_ganda' && currentQuestion.options && (
                  <div className={currentQuestion.optionImages ? "grid grid-cols-2 gap-4" : "space-y-3"}>
                    {currentQuestion.options.map((opt, optIdx) => {
                      const value = String(optIdx + 1);
                      const isSelected = currentAnswer?.answer === value;
                      return (
                        <button
                          key={optIdx}
                          type="button"
                          onClick={() => handleAnswerChange(currentQuestion.id, value)}
                          className={currentQuestion.optionImages 
                            ? `p-4 rounded-xl border-2 transition-all font-semibold text-sm flex flex-col items-center justify-center gap-3 min-h-[140px] text-center
                              ${optIdx === 4 ? 'col-span-2 justify-self-center w-full md:w-[calc(50%-8px)]' : 'w-full'}
                              ${isSelected
                                ? 'border-[#9A0000] bg-[#FAF2F2]/45 text-[#9A0000] shadow-sm scale-[1.02]'
                                : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700'
                              }`
                            : `w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all font-semibold text-sm flex items-center gap-3
                              ${isSelected
                                ? 'border-[#9A0000] bg-[#FAF2F2]/45 text-[#9A0000] shadow-sm'
                                : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-700'
                              }`
                          }
                        >
                          <span className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-extrabold shrink-0 transition-colors
                            ${isSelected
                              ? 'border-[#9A0000] bg-[#9A0000] text-white'
                              : 'border-slate-300 text-slate-400'
                            }`}
                          >
                            {optIdx + 1}
                          </span>
                          {currentQuestion.optionImages && currentQuestion.optionImages[optIdx] ? (
                            <img 
                              src={currentQuestion.optionImages[optIdx]} 
                              alt={`Option ${optIdx + 1}`} 
                              className="h-16 w-auto object-contain bg-white p-1 rounded-lg border border-slate-200 shadow-sm select-none pointer-events-none" 
                            />
                          ) : (
                            <span className="font-bold text-slate-800">{opt}</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Ya/Tidak */}
                {currentQuestion.type === 'ya_tidak' && (
                  <div className="grid grid-cols-2 gap-4">
                    {['YA', 'TIDAK'].map(opt => {
                      const isSelected = currentAnswer?.answer === opt;
                      return (
                        <button
                          key={opt}
                          type="button"
                          onClick={() => handleAnswerChange(currentQuestion.id, opt)}
                          className={`px-5 py-4 rounded-xl border-2 transition-all font-extrabold text-base text-center
                            ${isSelected
                              ? opt === 'YA'
                                ? 'border-emerald-500 bg-emerald-50 text-emerald-700 shadow-sm'
                                : 'border-rose-500 bg-rose-50 text-rose-700 shadow-sm'
                              : 'border-slate-200 hover:border-slate-350 hover:bg-slate-50 text-slate-600'
                            }`}
                        >
                          {opt}
                        </button>
                      );
                    })}
                  </div>
                )}

                {/* Isian */}
                {currentQuestion.type === 'isian' && (
                  <div>
                    <input
                      type="text"
                      value={currentAnswer?.answer || ''}
                      onChange={(e) => handleAnswerChange(currentQuestion.id, e.target.value)}
                      placeholder="Ketik jawaban Anda di sini..."
                      className="w-full px-5 py-3.5 rounded-xl border-2 border-slate-200 focus:border-[#9A0000] focus:ring-2 focus:ring-[#9A0000]/10 outline-none transition text-base font-semibold text-slate-800 placeholder:text-slate-400"
                    />
                    <p className="text-xs text-slate-400 mt-2 font-medium">*Jawaban bisa berupa angka, pecahan, huruf, atau kata. Contoh: 3, A, 1/8, TIDAK</p>
                  </div>
                )}

                <div className="mt-5 text-center select-none">
                  {isCurrentAnswered ? (
                    <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-extrabold px-4 py-1.5 rounded-full text-xs border border-emerald-200">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Sudah Dijawab
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 font-semibold px-4 py-1.5 rounded-full text-xs border border-slate-200">
                      Belum Dijawab
                    </span>
                  )}
                </div>
              </div>

              {/* Navigation */}
              <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center select-none">
                <button
                  type="button"
                  onClick={handlePrev}
                  disabled={currentIdx === 0}
                  className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-600 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Sebelumnya
                </button>

                <button
                  type="button"
                  onClick={handleNext}
                  disabled={currentIdx === wptQuestions.length - 1}
                  className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-600 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm focus:outline-none"
                >
                  Selanjutnya
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-medium">{submitError}</p>
              </div>
            </div>
          )}

          {/* Submit Box */}
          <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-5 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <h5 className="font-extrabold text-slate-800 text-sm">Selesaikan Semua Soal</h5>
              <p className="text-xs text-slate-400 font-medium font-semibold">Tombol kirim aktif setelah semua {WPT_TOTAL_QUESTIONS} soal terjawab. Atau jawaban otomatis dikirim saat waktu habis.</p>
            </div>
            <button
              type="button"
              onClick={handleSubmit}
              disabled={!isTestComplete || submitting}
              className={`inline-flex items-center gap-2 font-bold px-6 py-3 rounded-xl text-sm transition shadow-md
                ${isTestComplete
                  ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-700 hover:to-emerald-800 text-white shadow-emerald-100 hover:shadow-lg'
                  : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                }`}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Mengirimkan Jawaban...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Kirim Hasil Tes WPT
                </>
              )}
            </button>
          </div>

          <div className="text-center mt-6 text-xs text-slate-400">
            EasyLegal &copy; 2026. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
}
