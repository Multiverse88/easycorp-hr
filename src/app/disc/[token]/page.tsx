'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, saveDiscTestResult, getDiscTestResultByCandidate, Candidate } from '@/lib/db';
import { discQuestions } from '@/lib/discData';
import { calculateDiscResult } from '@/lib/discParser';
import { Award, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

interface AnswerState {
  questionId: number;
  most: string | null;
  least: string | null;
}

export default function DiscTestPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // DISC state
  const [currentIdx, setCurrentIdx] = useState(0);
  const [answers, setAnswers] = useState<AnswerState[]>([]);

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) {
          setError('Tautan tidak valid atau telah kedaluwarsa. Silakan hubungi HR EasyLegal.');
          return;
        }

        // Jika belum isi biodata, arahkan ke halaman apply
        if (!data.pendidikan) {
          router.push(`/apply/${token}`);
          return;
        }

        // Check if DISC test already completed
        const existingTest = await getDiscTestResultByCandidate(data.id);
        if (existingTest) {
          setError('ALREADY_COMPLETED');
          return;
        }

        setCandidate(data);

        const initialAnswers = discQuestions.map(q => ({
          questionId: q.id,
          most: null,
          least: null
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

  const handleSelect = (questionId: number, type: 'most' | 'least', wordText: string) => {
    setAnswers(prev => prev.map(ans => {
      if (ans.questionId !== questionId) return ans;

      let newMost = ans.most;
      let newLeast = ans.least;

      if (type === 'most') {
        newMost = wordText;
        if (newLeast === wordText) {
          newLeast = null;
        }
      } else {
        newLeast = wordText;
        if (newMost === wordText) {
          newMost = null;
        }
      }

      return { questionId, most: newMost, least: newLeast };
    }));
  };

  const currentQuestion = discQuestions[currentIdx];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id) || null;
  const isCurrentQuestionComplete = currentAnswer && currentAnswer.most !== null && currentAnswer.least !== null;

  const completedCount = answers.filter(a => a.most !== null && a.least !== null).length;
  const isTestComplete = completedCount === discQuestions.length;

  // Find unanswered questions
  const unansweredQuestions = answers
    .map((a, idx) => ({ ...a, idx }))
    .filter(a => a.most === null || a.least === null);

  const handleNext = () => {
    if (currentIdx < discQuestions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentIdx > 0) {
      setCurrentIdx(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    if (!isTestComplete || !candidate) {
      setSubmitError('Harap selesaikan semua 28 kelompok soal sebelum mengirimkan.');
      return;
    }

    try {
      setSubmitting(true);
      setSubmitError(null);

      const formattedAnswers = answers.map(a => ({
        questionId: a.questionId,
        most: a.most as string,
        least: a.least as string
      }));

      const result = calculateDiscResult(formattedAnswers);

      // Ensure all values are valid numbers
      const discData = {
        candidate_id: candidate.id,
        answers: formattedAnswers,
        skor_d: result.D.m || 0,
        skor_i: result.I.m || 0,
        skor_s: result.S.m || 0,
        skor_c: result.C.m || 0,
        persen_d: isNaN(result.D.percent) ? 0 : result.D.percent,
        persen_i: isNaN(result.I.percent) ? 0 : result.I.percent,
        persen_s: isNaN(result.S.percent) ? 0 : result.S.percent,
        persen_c: isNaN(result.C.percent) ? 0 : result.C.percent,
        tipe_primer: result.primary,
        tipe_sekunder: result.secondary,
        completed_at: new Date().toISOString()
      };

      console.log('Submitting DISC data:', discData);

      await saveDiscTestResult(discData);

      setSubmitted(true);
    } catch (err: unknown) {
      console.error('DISC submit error:', err);
      const errorMsg = err instanceof Error ? err.message : 'Terjadi kesalahan';
      if (errorMsg === 'DISC_TEST_ALREADY_COMPLETED') {
        setSubmitError('Tes DISC sudah pernah diselesaikan. Token hanya bisa digunakan sekali.');
      } else {
        setSubmitError(`Gagal mengirim jawaban tes: ${errorMsg}`);
      }
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(15_60%_97%)]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(350_60%_50%)]" />
        <p className="mt-4 text-slate-600 text-sm font-medium">Menyiapkan Asesmen DISC...</p>
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
          <h2 className="text-xl font-bold text-slate-900 mb-2">Tes DISC Sudah Selesai</h2>
          <p className="text-slate-600 mb-6">
            Token ini sudah digunakan untuk menyelesaikan tes DISC. Setiap token hanya bisa digunakan satu kali.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Jika Anda memerlukan bantuan, silakan hubungi tim HR EasyLegal.
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
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Tes Selesai</h2>
          <p className="text-slate-600 mb-2">
            Terima kasih, <strong>{candidate?.nama}</strong>.
          </p>
          <p className="text-slate-500 text-sm mb-6">
            Jawaban asesmen DISC Anda telah berhasil dikirimkan. Tim HR akan menghubungi Anda untuk tahap selanjutnya.
          </p>
          <div className="border-t border-slate-100 pt-4 text-xs text-slate-400">
            EasyLegal Recruitment System
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[hsl(15_60%_97%)] py-8 px-4 sm:px-6">
      <LoadingOverlay visible={submitting} message="Mengirim jawaban DISC..." />

      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[hsl(350_50%_92%)] text-[hsl(350_60%_40%)] rounded-xl">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-lg font-extrabold text-slate-950">Asesmen Kepribadian DISC</h1>
              <p className="text-xs text-slate-500 font-medium">EasyLegal Recruitment • 28 Soal Pilihan</p>
            </div>
          </div>
          <div className="flex flex-col items-end text-center sm:text-right">
            <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kandidat</span>
            <span className="text-sm font-bold text-slate-700">{candidate?.nama}</span>
          </div>
        </div>

        {/* Petunjuk Pengisian */}
        <div className="bg-amber-50 border border-amber-200 text-amber-900 rounded-2xl p-4 sm:p-5 mb-6 text-xs sm:text-sm">
          <h4 className="font-extrabold flex items-center gap-1.5 mb-1.5 text-amber-950 text-sm">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            PETUNJUK PENGISIAN PENTING:
          </h4>
          <ul className="list-decimal list-inside space-y-1.5 text-amber-800 leading-relaxed font-medium">
            <li>Di setiap kelompok kata, pilih tepat <strong>1 kata yang PALING menggambarkan diri Anda (M - Most)</strong>.</li>
            <li>Di setiap kelompok kata, pilih tepat <strong>1 kata yang PALING TIDAK menggambarkan diri Anda (L - Least)</strong>.</li>
            <li>Kolom <strong>M (Most) di sebelah Kiri (Hijau)</strong> dan kolom <strong>L (Least) di sebelah Kanan (Merah)</strong>.</li>
            <li>Jawaban M dan L tidak boleh berada pada kata yang sama.</li>
          </ul>
        </div>

        {/* Progress Bar */}
        <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-4 mb-6">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs text-slate-500 font-extrabold">Progress Pengerjaan Asesmen</span>
            <span className="text-xs font-extrabold text-[hsl(350_60%_40%)]">
              {completedCount} dari 28 Kelompok Soal Selesai ({Math.round((completedCount / 28) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-[hsl(350_55%_55%)] to-[hsl(350_60%_45%)] h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / 28) * 100}%` }}
            />
          </div>

          {/* Stepper Dots */}
          <div className="mt-4 flex flex-wrap gap-1 bg-[hsl(15_60%_97%)] p-2.5 rounded-xl border border-slate-150 justify-center">
            {answers.map((ans, idx) => {
              const isDone = ans.most !== null && ans.least !== null;
              const isActive = idx === currentIdx;
              return (
                <button
                  key={ans.questionId}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-6 h-6 rounded-md text-[10px] font-bold transition flex items-center justify-center border
                    ${isActive
                      ? 'bg-[hsl(350_25%_14%)] text-white border-[hsl(350_30%_10%)] shadow'
                      : isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-white text-slate-400 border-slate-200 hover:bg-slate-100'
                    }`}
                >
                  {idx + 1}
                </button>
              );
            })}
          </div>
        </div>

        {/* Warning for unanswered questions */}
        {currentIdx === discQuestions.length - 1 && unansweredQuestions.length > 0 && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <h4 className="font-extrabold text-sm">Masih Ada Soal Belum Dijawab</h4>
            </div>
            <p className="text-sm mb-2">
              {unansweredQuestions.length} soal belum lengkap. Klik nomor soal di bawah untuk langsung ke soal tersebut:
            </p>
            <div className="flex flex-wrap gap-2">
              {unansweredQuestions.map(q => (
                <button
                  key={q.questionId}
                  onClick={() => setCurrentIdx(q.idx)}
                  className="w-8 h-8 rounded-lg bg-red-100 text-red-700 font-bold text-xs border border-red-200 hover:bg-red-200 transition"
                >
                  {q.idx + 1}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden mb-6">
            {/* Header Soal */}
            <div className="bg-[hsl(15_60%_97%)] border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 tracking-wider">KELOMPOK KATA SIFAT</span>
              <span className="text-sm font-extrabold bg-[hsl(350_50%_92%)] text-[hsl(350_60%_40%)] px-3 py-1 rounded-full border border-[hsl(350_30%_85%)]">
                Soal {currentIdx + 1} dari 28
              </span>
            </div>

            {/* Antarmuka Pemilihan */}
            <div className="p-6">
              <div className="grid grid-cols-12 gap-2 text-center font-bold text-xs text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-3 mb-4">
                <div className="col-span-3 text-left pl-4 text-emerald-700">M (Most)</div>
                <div className="col-span-6">KATA SIFAT</div>
                <div className="col-span-3 text-right pr-4 text-red-600">L (Least)</div>
              </div>

              <div className="space-y-3">
                {currentQuestion.words.map((word) => {
                  const isMost = currentAnswer?.most === word.text;
                  const isLeast = currentAnswer?.least === word.text;

                  return (
                    <div
                      key={word.text}
                      className={`grid grid-cols-12 items-center border rounded-2xl py-3 px-2 sm:px-4 transition duration-150
                        ${isMost
                          ? 'border-emerald-250 bg-emerald-25/40 shadow-sm'
                          : isLeast
                            ? 'border-red-200 bg-red-25/30 shadow-sm'
                            : 'border-slate-200 hover:border-slate-300 bg-white'
                        }`}
                    >
                      <div className="col-span-3 text-left">
                        <button
                          type="button"
                          onClick={() => handleSelect(currentQuestion.id, 'most', word.text)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold text-xs transition flex items-center justify-center border shadow-sm
                            ${isMost
                              ? 'bg-emerald-600 border-emerald-700 text-white shadow-emerald-100'
                              : 'bg-white border-slate-200 hover:border-emerald-300 text-slate-400 hover:text-emerald-600'
                            }`}
                        >
                          {isMost ? <CheckCircle2 className="w-5 h-5" /> : 'MOST'}
                        </button>
                      </div>

                      <div className="col-span-6 text-center font-extrabold text-slate-800 sm:text-base tracking-wide">
                        {word.text}
                      </div>

                      <div className="col-span-3 text-right flex justify-end">
                        <button
                          type="button"
                          onClick={() => handleSelect(currentQuestion.id, 'least', word.text)}
                          className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl font-bold text-xs transition flex items-center justify-center border shadow-sm
                            ${isLeast
                              ? 'bg-red-550 bg-red-600 border-red-700 text-white shadow-red-100'
                              : 'bg-white border-slate-200 hover:border-red-300 text-slate-400 hover:text-red-500'
                            }`}
                        >
                          {isLeast ? <CheckCircle2 className="w-5 h-5" /> : 'LEAST'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-5 text-center">
                {isCurrentQuestionComplete ? (
                  <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-700 font-extrabold px-4 py-1.5 rounded-full text-xs border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Pilihan Kelompok Ini Lengkap
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 bg-slate-100 text-slate-500 font-bold px-4 py-1.5 rounded-full text-xs border border-slate-200">
                    Pilih 1 Most & 1 Least
                  </span>
                )}
              </div>
            </div>

            {/* Stepper Navigation */}
            <div className="bg-[hsl(15_60%_97%)] border-t border-slate-200 px-6 py-4 flex justify-between items-center">
              <button
                type="button"
                onClick={handlePrev}
                disabled={currentIdx === 0}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-600 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                <ChevronLeft className="w-4 h-4" />
                Sebelumnya
              </button>

              <button
                type="button"
                onClick={handleNext}
                disabled={currentIdx === discQuestions.length - 1}
                className="inline-flex items-center gap-1 bg-white hover:bg-slate-100 text-slate-600 font-extrabold px-4 py-2 rounded-xl text-xs sm:text-sm border border-slate-200 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-sm"
              >
                Selanjutnya
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Submit Error */}
        {submitError && (
          <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <p className="text-sm font-medium">{submitError}</p>
            </div>
          </div>
        )}

        {/* Submit Action Box */}
        <div className="bg-white border border-slate-200 shadow-lg rounded-2xl p-5 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-left">
            <h5 className="font-extrabold text-slate-800 text-sm">Selesaikan Seluruh Soal</h5>
            <p className="text-xs text-slate-400 font-medium">Tombol kirim akan aktif setelah semua 28 kelompok soal selesai.</p>
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
                Kirim Hasil Tes Asesmen
              </>
            )}
          </button>
        </div>

        <div className="text-center mt-6 text-xs text-slate-400">
          EasyLegal &copy; 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}
