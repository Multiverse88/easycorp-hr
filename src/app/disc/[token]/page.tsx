'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, saveDiscTestResult, getDiscTestResultByCandidate, getWptTestResultByCandidate, Candidate } from '@/lib/db';
import { discQuestions } from '@/lib/discData';
import { calculateDiscResult } from '@/lib/discParser';
import { CheckCircle2, AlertTriangle, Loader2, CheckCircle } from 'lucide-react';
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
  const [error, setError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [showInstructions, setShowInstructions] = useState(true);

  // DISC state
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
          // If DISC is done, check WPT
          const existingWpt = await getWptTestResultByCandidate(data.id);
          if (!existingWpt) {
            router.push(`/wpt/${token}`);
            return;
          }
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

  const completedCount = answers.filter(a => a.most !== null && a.least !== null).length;
  const isTestComplete = completedCount === discQuestions.length;

  const unansweredQuestions = answers
    .filter(a => a.most === null || a.least === null);

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

      // Redirect ke halaman WPT setelah DISC selesai
      router.push(`/wpt/${token}`);
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

  return (
    <div className="min-h-screen bg-[hsl(15_60%_97%)] flex flex-col page-enter">
      <LoadingOverlay visible={submitting} message="Mengirim jawaban DISC..." />

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
            DISC Test
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
        <div className="max-w-7xl mx-auto space-y-6">
          
          {/* Page Title & Intro Paragraph - Brand Crimson Branded */}
          <div className="bg-white p-6 rounded-2xl border border-[hsl(15_30%_88%)] shadow-sm space-y-3.5">
            <h1 className="text-3xl font-extrabold text-[#9A0000] tracking-tight leading-none">
              Asesmen Kepribadian DISC
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed font-medium">
              Tes DISC (<em>Dominance, Influence, Steadiness, Conscientiousness</em>) adalah alat asesmen kepribadian profesional yang dirancang khusus untuk menganalisis profil perilaku, gaya komunikasi, dan potensi kecocokan posisi kerja Anda di <strong>EasyLegal</strong>. Silakan pilih jawaban dengan jujur, objektif, dan spontan untuk membantu kami mengenal potensi terbaik Anda.
            </p>
          </div>

          {/* Instructions Box in Brand Crimson & Soft Pinkish-Cream */}
          {showInstructions && (
            <div className="border border-[hsl(15_30%_88%)] rounded-xl overflow-hidden shadow-sm transition-all duration-300 animate-fadeIn">
              {/* Instruksi Header - Brand Crimson */}
              <div className="bg-[#9A0000] text-white px-4 py-2.5 flex items-center justify-between font-bold text-sm tracking-wide">
                <span>INSTRUKSI PENGISIAN ASESMEN</span>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="hover:bg-white/10 active:bg-white/20 rounded-md w-6 h-6 flex items-center justify-center transition font-extrabold text-xs cursor-pointer select-none"
                  title="Tutup Petunjuk"
                >
                  X
                </button>
              </div>
              {/* Instruksi Body - Soft Pinkish-Cream */}
              <div className="bg-[#FAF2F2] p-4 sm:p-5 text-slate-700 text-xs sm:text-[13px] font-semibold space-y-2.5 leading-relaxed">
                <p>Setiap nomor di bawah ini memuat 4 (empat) kalimat. Tugas Anda adalah:</p>
                <ol className="list-decimal list-inside space-y-1.5 pl-1 text-slate-800 font-bold">
                  <li>Beri tanda/cek pada kolom di bawah huruf <span className="text-[#9A0000] font-black">[P]</span> di samping kalimat yang <strong>PALING</strong> menggambarkan diri Anda.</li>
                  <li>Beri tanda/cek pada kolom di bawah huruf <span className="text-[#9A0000] font-black">[K]</span> di samping kalimat yang <strong>PALING TIDAK</strong> menggambarkan diri Anda.</li>
                </ol>
              </div>
            </div>
          )}

          {/* Candidate Profile & Progress Panel */}
          <div className="bg-white border border-[hsl(15_30%_88%)] shadow-sm rounded-2xl p-4 sm:p-5 flex flex-col gap-3.5">
            <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-3">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm font-medium">
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kandidat:</span>
                <span className="font-bold text-slate-800">{candidate?.nama}</span>
                <span className="hidden sm:inline text-slate-350">•</span>
                <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Posisi:</span>
                <span className="font-bold text-slate-800">{candidate?.posisi_dilamar || 'Pelamar'}</span>
              </div>
              <span className="text-xs font-extrabold text-[#9A0000]">
                {completedCount} dari 28 Kelompok Soal Selesai ({Math.round((completedCount / 28) * 100)}%)
              </span>
            </div>
            
            {/* Progress bar brand crimson */}
            <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#9A0000] to-[#E30000] h-2.5 rounded-full transition-all duration-300"
                style={{ width: `${(completedCount / 28) * 100}%` }}
              />
            </div>

            {/* Stepper Dots */}
            <div className="mt-1 flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 justify-center">
              {answers.map((ans, idx) => {
                const isDone = ans.most !== null && ans.least !== null;
                return (
                  <div
                    key={ans.questionId}
                    className={`w-6 h-6 rounded-md text-[10px] font-bold flex items-center justify-center border transition-all duration-150
                      ${isDone
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-extrabold scale-105 shadow-sm'
                        : 'bg-white text-slate-400 border-slate-200'
                      }`}
                  >
                    {idx + 1}
                  </div>
                );
              })}
            </div>
          </div>

          {/* All Questions in Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {discQuestions.map((q) => {
              const answer = answers.find(a => a.questionId === q.id) || { questionId: q.id, most: null, least: null };
              const isEven = q.id % 2 === 0;

              return (
                <div 
                  key={q.id} 
                  className={`border rounded-xl overflow-hidden shadow-sm transition-all duration-300 hover:shadow-md ${
                    isEven 
                      ? 'bg-[#FAF2F2]/50 border-[#9A0000]/15 hover:border-[#9A0000]/30' 
                      : 'bg-white border-slate-200 hover:border-slate-350'
                  }`}
                >
                  {/* Mini Table Header - Brand Crimson */}
                  <div className="bg-[#9A0000] text-white text-[11px] font-extrabold uppercase tracking-wider grid grid-cols-12 py-2 px-3 items-center">
                    <div className="col-span-2 text-center">No</div>
                    <div className="col-span-6 text-left pl-1">Gambaran Diri</div>
                    <div className="col-span-2 text-center">P</div>
                    <div className="col-span-2 text-center">K</div>
                  </div>

                  {/* Words Rows */}
                  <div className="flex flex-col">
                    {q.words.map((word, wordIdx) => {
                      const isMost = answer.most === word.text;
                      const isLeast = answer.least === word.text;

                      return (
                        <div
                          key={word.text}
                          className={`grid grid-cols-12 items-center py-2 px-3 text-[13px] transition-colors duration-150 ${
                            isEven
                              ? 'hover:bg-[#9A0000]/5 border-b border-[#9A0000]/10 last:border-b-0'
                              : 'hover:bg-slate-50 border-b border-slate-100 last:border-b-0'
                          }`}
                        >
                          {/* Number */}
                          <div className="col-span-2 text-center font-extrabold text-slate-800">
                            {wordIdx === 0 ? q.id : ''}
                          </div>

                          {/* Word Text */}
                          <div className="col-span-6 text-left font-semibold text-slate-700 leading-tight">
                            {word.text}
                          </div>

                          {/* P (Most) Radio Button - Emerald Green */}
                          <div className="col-span-2 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleSelect(q.id, 'most', word.text)}
                              className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none ${
                                isMost
                                  ? 'border-emerald-500 bg-white ring-2 ring-emerald-100/50'
                                  : 'border-slate-300 bg-white hover:border-emerald-400'
                              }`}
                              aria-label={`Paling menggambarkan: ${word.text}`}
                            >
                              <span 
                                className={`w-2.5 h-2.5 rounded-full bg-emerald-500 transition-all duration-200 transform ${
                                  isMost ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                                }`} 
                              />
                            </button>
                          </div>

                          {/* K (Least) Radio Button - Brand Crimson */}
                          <div className="col-span-2 flex justify-center">
                            <button
                              type="button"
                              onClick={() => handleSelect(q.id, 'least', word.text)}
                              className={`w-5.5 h-5.5 rounded-full border-2 flex items-center justify-center transition-all duration-200 focus:outline-none ${
                                isLeast
                                  ? 'border-[#9A0000] bg-white ring-2 ring-[#9A0000]/15'
                                  : 'border-slate-300 bg-white hover:border-[#9A0000]'
                              }`}
                              aria-label={`Paling tidak menggambarkan: ${word.text}`}
                            >
                              <span 
                                className={`w-2.5 h-2.5 rounded-full bg-[#9A0000] transition-all duration-200 transform ${
                                  isLeast ? 'scale-100 opacity-100' : 'scale-0 opacity-0'
                                }`} 
                              />
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

          {/* Warning for unanswered questions */}
          {unansweredQuestions.length > 0 && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <h4 className="font-extrabold text-sm">Masih Ada Soal Belum Dijawab</h4>
              </div>
              <p className="text-sm font-medium">
                Ada {unansweredQuestions.length} kelompok soal yang belum lengkap terisi (setiap kelompok harus memiliki 1 jawaban P dan 1 jawaban K). Silakan periksa kembali kelompok soal di atas yang belum lengkap.
              </p>
            </div>
          )}

          {/* Submit Error */}
          {submitError && (
            <div className="bg-red-50 border border-red-200 text-red-800 rounded-2xl p-4 mb-6">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" />
                <p className="text-sm font-bold">{submitError}</p>
              </div>
            </div>
          )}

          {/* Submit Action Box */}
          <div className="bg-white border border-[hsl(15_30%_88%)] shadow-lg rounded-2xl p-5 text-center flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-left">
              <h5 className="font-extrabold text-slate-800 text-sm">Selesaikan Seluruh Soal</h5>
              <p className="text-xs text-slate-400 font-medium font-semibold">Tombol kirim akan aktif setelah semua 28 kelompok soal selesai dijawab.</p>
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
    </div>
  );
}
