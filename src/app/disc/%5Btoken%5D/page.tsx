'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, saveDiscTestResult, Candidate } from '@/lib/db';
import { discQuestions } from '@/lib/discData';
import { calculateDiscResult } from '@/lib/discParser';
import { Award, ChevronLeft, ChevronRight, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

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

        // Cek jika candidate belum mengisi bio
        if (data.status === 'screening') {
          // Arahkan ke apply page dulu
          router.push(`/apply/${token}`);
          return;
        }

        setCandidate(data);

        // Inisialisasi answers
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
        // Jika kata yang sama sebelumnya dipilih sebagai least, hapus least-nya
        if (newLeast === wordText) {
          newLeast = null;
        }
      } else {
        newLeast = wordText;
        // Jika kata yang sama sebelumnya dipilih sebagai most, hapus most-nya
        if (newMost === wordText) {
          newMost = null;
        }
      }

      return {
        questionId,
        most: newMost,
        least: newLeast
      };
    }));
  };

  const currentQuestion = discQuestions[currentIdx];
  const currentAnswer = answers.find(a => a.questionId === currentQuestion?.id) || null;

  const isCurrentQuestionComplete = currentAnswer && currentAnswer.most !== null && currentAnswer.least !== null;

  // Hitung jumlah soal yang sudah selesai dikerjakan (memiliki M dan L)
  const completedCount = answers.filter(a => a.most !== null && a.least !== null).length;
  const isTestComplete = completedCount === discQuestions.length;

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
      alert('Harap selesaikan semua 28 kelompok soal sebelum mengirimkan.');
      return;
    }

    try {
      setSubmitting(true);
      // Validasi struktur jawaban
      const formattedAnswers = answers.map(a => ({
        questionId: a.questionId,
        most: a.most as string,
        least: a.least as string
      }));

      // Kalkulasi hasil DISC di server/API helper
      const result = calculateDiscResult(formattedAnswers);

      // Simpan ke database
      await saveDiscTestResult({
        candidate_id: candidate.id,
        answers: formattedAnswers,
        skor_d: result.D.m,
        skor_i: result.I.m,
        skor_s: result.S.m,
        skor_c: result.C.m,
        persen_d: result.D.percent,
        persen_i: result.I.percent,
        persen_s: result.S.percent,
        persen_c: result.C.percent,
        tipe_primer: result.primary,
        tipe_sekunder: result.secondary,
        completed_at: new Date().toISOString()
      });

      // Lanjut ke halaman konfirmasi
      router.push(`/confirm/${token}`);
    } catch (err) {
      console.error(err);
      alert('Gagal mengirim jawaban tes. Mohon coba lagi.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50">
        <Loader2 className="w-10 h-10 animate-spin text-blue-850" />
        <p className="mt-4 text-slate-600 text-sm font-medium">Menyiapkan Asesmen DISC...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
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
    <div className="min-h-screen bg-slate-50 py-8 px-4 sm:px-6">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="bg-white border border-slate-200 shadow-md rounded-2xl p-4 sm:p-6 mb-6 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-800 rounded-xl">
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
            <span className="text-xs font-extrabold text-blue-800">
              {completedCount} dari 28 Kelompok Soal Selesai ({Math.round((completedCount / 28) * 100)}%)
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-blue-700 to-blue-900 h-2.5 rounded-full transition-all duration-300"
              style={{ width: `${(completedCount / 28) * 100}%` }}
            />
          </div>

          {/* Stepper Dots (mini grids) */}
          <div className="mt-4 flex flex-wrap gap-1 bg-slate-50 p-2.5 rounded-xl border border-slate-150 justify-center">
            {answers.map((ans, idx) => {
              const isDone = ans.most !== null && ans.least !== null;
              const isActive = idx === currentIdx;
              return (
                <button
                  key={ans.questionId}
                  onClick={() => setCurrentIdx(idx)}
                  className={`w-6 h-6 rounded-md text-[10px] font-bold transition flex items-center justify-center border
                    ${isActive
                      ? 'bg-blue-800 text-white border-blue-900 shadow'
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

        {/* Question Card */}
        {currentQuestion && (
          <div className="bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden mb-6">
            {/* Header Soal */}
            <div className="bg-slate-50 border-b border-slate-200 px-6 py-4 flex justify-between items-center">
              <span className="text-xs font-bold text-slate-500 tracking-wider">KELOMPOK KATA SIFAT</span>
              <span className="text-sm font-extrabold bg-blue-50 text-blue-800 px-3 py-1 rounded-full border border-blue-150">
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
                      {/* Left: Most Checkbox */}
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

                      {/* Middle: Word Label */}
                      <div className="col-span-6 text-center font-extrabold text-slate-800 sm:text-base tracking-wide">
                        {word.text}
                      </div>

                      {/* Right: Least Checkbox */}
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

              {/* Status Peringatan Soal Aktif */}
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
            <div className="bg-slate-50 border-t border-slate-200 px-6 py-4 flex justify-between items-center">
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
          EasyLegal © 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}
