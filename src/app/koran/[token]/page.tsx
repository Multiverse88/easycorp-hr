'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, getKoranTestResultByCandidate, skipKoranTest, Candidate } from '@/lib/db';
import { UploadCloud, CheckCircle2, ShieldCheck, FileImage, ArrowRight, SunMedium, ImageIcon, Clock, X, ChevronLeft, ChevronRight } from 'lucide-react';

const PANDUAN_PDF_PAGE_COUNT = 4;

function KoranTestContent() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [uploaded, setUploaded] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [showInstructions, setShowInstructions] = useState(true);
  const [showPdfModal, setShowPdfModal] = useState(true);
  const [pdfPage, setPdfPage] = useState(1);
  const [skipped, setSkipped] = useState(false);
  const [skipping, setSkipping] = useState(false);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) { setError('Invalid or expired link.'); return; }
        setCandidate(data);
        const existingResult = await getKoranTestResultByCandidate(data.id);
        if (existingResult) setUploaded(true);
      } catch (err) {
        console.error(err);
        setError('Failed to load candidate data.');
      } finally {
        setLoading(false);
      }
    }
    if (token) loadData();
  }, [token]);

  const processFile = (selected: File) => {
    if (!selected.type.startsWith('image/')) { setUploadError('Unggah file gambar (JPG, PNG).'); return; }
    setFile(selected);
    setPreview(URL.createObjectURL(selected));
    setUploadError(null);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) processFile(e.target.files[0]);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setDragActive(false);
    if (e.dataTransfer.files?.[0]) processFile(e.dataTransfer.files[0]);
  };

  const handleSubmit = async () => {
    if (!file || !candidate) return;
    try {
      setUploading(true);
      setUploadError(null);
      const formData = new FormData();
      formData.append('candidateId', candidate.id);
      formData.append('namaFile', file.name);
      formData.append('file', file);
      const res = await fetch('/api/upload-koran', { method: 'POST', body: formData });
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Gagal mengunggah berkas.');
      }
      setUploaded(true);
    } catch (err: any) {
      setUploadError(err.message || 'Terjadi kesalahan.');
    } finally {
      setUploading(false);
    }
  };

  const handleSkip = async () => {
    if (!candidate) return;
    setSkipping(true);
    try {
      await skipKoranTest(candidate.id, candidate.nama);
    } finally {
      setSkipping(false);
      setSkipped(true);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-[#9A0000] rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-[100dvh] bg-white flex items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h2 className="text-2xl font-light text-slate-900 mb-3">Akses Tidak Valid</h2>
          <p className="text-slate-900 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  // --- SKIPPED SCREEN ---
  if (skipped) {
    return (
      <div className="min-h-[100dvh] bg-[#f9f9f7] flex items-center justify-center px-6" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#9A0000]/5 rounded-full blur-[160px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-red-50 border border-[#9A0000]/20 flex items-center justify-center mx-auto mb-8">
            <Clock className="w-9 h-9 text-[#9A0000]" />
          </div>
          <h2 className="text-3xl font-light text-slate-900 mb-4 tracking-tight">Dilewati untuk Sekarang</h2>
          <p className="text-slate-900 text-sm leading-relaxed mb-6">
            Tidak masalah, <strong className="text-slate-700">{candidate?.nama}</strong>. Tes Koran dapat Anda kerjakan kapan saja nanti melalui tautan yang sama.
          </p>
          <button
            onClick={() => setSkipped(false)}
            className="text-sm font-semibold text-[#9A0000] hover:text-red-800 transition-colors"
          >
            Kembali &amp; kerjakan sekarang
          </button>
          <div className="text-[10px] font-medium text-[#9A0000] uppercase tracking-[0.3em] border-t border-slate-100 pt-6 mt-10">
            EasyCorp HR System
          </div>
        </div>
      </div>
    );
  }

  // --- INSTRUCTION SCREEN ---
  if (showInstructions && !uploaded) {
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
              <p className="text-slate-900 text-sm font-semibold">Tes Koran — Tahap Akhir</p>
            </div>
          </div>

          <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-3">Panduan Unggah</h1>
          <p className="text-slate-900 text-sm leading-relaxed mb-6">
            Ini adalah tahap terakhir evaluasi. Kerjakan <strong className="text-[#9A0000]">Tes Koran (Pauli/Kraepelin)</strong>, lalu unggah screenshot hasilnya.
          </p>

          <div className="space-y-4 mb-10">
            <button
              type="button"
              onClick={() => { setPdfPage(1); setShowPdfModal(true); }}
              className="pulse-border w-full flex items-center gap-4 p-5 bg-white rounded-2xl border-2 border-[#9A0000]/25 shadow-sm text-left transition-colors"
            >
              <div className="w-10 h-10 rounded-xl bg-red-50 border border-[#9A0000]/15 flex items-center justify-center shrink-0 text-[#9A0000]">
                <FileImage className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-slate-900 font-semibold text-sm mb-0.5">Panduan Mengerjakan Tes Koran</p>
                <p className="text-slate-900 text-sm leading-relaxed">Kerjakan Tes Koran (Pauli/Kraepelin), lalu unggah screenshot hasilnya. Ketuk untuk melihat panduan lengkap.</p>
              </div>
              <ChevronRight className="w-5 h-5 text-slate-300 shrink-0" />
            </button>
            {[
              {
                icon: <SunMedium className="w-5 h-5" />,
                title: 'Screenshot Menampilkan Data Lengkap',
                desc: 'Pastikan screenshot memuat tanggal & jam pengerjaan, grafik jawaban benar/salah, total benar & salah, waktu 30 menit, serta nilai kecepatan, akurasi, keajegan, dan ketahanan.',
              },
              {
                icon: <ImageIcon className="w-5 h-5" />,
                title: 'Jangan Dipotong atau Diedit',
                desc: 'Unggah screenshot asli tanpa crop atau edit. Pastikan gambar jelas dan seluruh angka terbaca. Format: JPG, PNG, atau WEBP.',
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
            onClick={() => setShowInstructions(false)}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#9A0000] text-white text-sm font-semibold hover:bg-red-800 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#9A0000]/20"
          >
            Siap, Lanjut Unggah Screenshot
            <ArrowRight className="w-5 h-5" />
          </button>

          <button
            onClick={handleSkip}
            disabled={skipping}
            className="w-full mt-3 flex items-center justify-center gap-2 px-8 py-3.5 rounded-2xl border border-slate-200 text-slate-900 text-sm font-medium hover:bg-slate-50 hover:border-slate-300 transition-all duration-200 disabled:opacity-50"
          >
            {skipping ? 'Menyimpan...' : 'Lewati untuk sekarang, kerjakan nanti'}
          </button>

          <p className="text-center text-xs text-[#9A0000] mt-4">
            Kandidat: {candidate?.nama}
          </p>

          <button
            onClick={() => router.push(`/mulai/${token}`)}
            className="w-full text-center text-xs text-slate-400 hover:text-slate-600 mt-6 transition-colors"
          >
            ← Kembali ke pilihan tahap
          </button>
        </div>

        {showPdfModal && (
          <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
            onClick={() => setShowPdfModal(false)}
          >
            <div
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[85dvh] flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-3.5 border-b border-slate-200 shrink-0">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-lg bg-red-50 border border-[#9A0000]/15 flex items-center justify-center shrink-0 text-[#9A0000]">
                    <FileImage className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-900 font-semibold text-sm truncate">Panduan Lengkap Tes Koran</p>
                    <p className="text-slate-400 text-xs">Halaman {pdfPage} dari {PANDUAN_PDF_PAGE_COUNT}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 shrink-0">
                  <a
                    href="/documents/panduan-tes-koran.pdf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[#9A0000] text-xs font-semibold hover:underline"
                  >
                    Buka Penuh
                  </a>
                  <button
                    type="button"
                    onClick={() => setShowPdfModal(false)}
                    className="text-slate-400 hover:text-slate-600"
                    aria-label="Tutup"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative flex-1 bg-slate-100 overflow-hidden flex items-center justify-center">
                <img
                  src={`/documents/panduan-tes-koran/page-${pdfPage}.png`}
                  alt={`Panduan Tes Koran halaman ${pdfPage}`}
                  className="max-w-full max-h-full object-contain"
                />
                {pdfPage > 1 && (
                  <button
                    type="button"
                    onClick={() => setPdfPage((p) => p - 1)}
                    className="absolute left-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-700 hover:bg-white"
                    aria-label="Halaman sebelumnya"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                )}
                {pdfPage < PANDUAN_PDF_PAGE_COUNT && (
                  <button
                    type="button"
                    onClick={() => setPdfPage((p) => p + 1)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white/90 shadow-md flex items-center justify-center text-slate-700 hover:bg-white"
                    aria-label="Halaman berikutnya"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                )}
              </div>

              <div className="flex items-center justify-center gap-1.5 py-3 border-t border-slate-200 shrink-0">
                {Array.from({ length: PANDUAN_PDF_PAGE_COUNT }).map((_, i) => (
                  <button
                    key={i}
                    type="button"
                    onClick={() => setPdfPage(i + 1)}
                    className={`w-2 h-2 rounded-full transition-colors ${pdfPage === i + 1 ? 'bg-[#9A0000]' : 'bg-slate-300'}`}
                    aria-label={`Halaman ${i + 1}`}
                  />
                ))}
              </div>
              </div>
          </div>
        )}
      </div>
    );
  }

  if (uploaded) {
    return (
      <div className="min-h-[100dvh] bg-[#f9f9f7] flex items-center justify-center px-6" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        {/* Subtle ambient */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[160px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-light text-slate-900 mb-4 tracking-tight">Tes Koran Terkirim</h2>
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Terima kasih, <strong className="text-slate-700">{candidate?.nama}</strong>. Screenshot Tes Koran berhasil diunggah dan akan dianalisis oleh sistem.
          </p>
          <button
            onClick={() => router.push(`/mulai/${token}`)}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#9A0000] text-white text-sm font-semibold hover:bg-red-800 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#9A0000]/20 mb-6"
          >
            Lihat Status Tahap Lainnya
            <ArrowRight className="w-5 h-5" />
          </button>
          <div className="text-[10px] font-medium text-[#9A0000] uppercase tracking-[0.3em] border-t border-slate-100 pt-6">
            EasyCorp HR System
          </div>
        </div>
      </div>
    );
  }

  return (
    <main
      className="overflow-x-hidden w-full max-w-full min-h-[100dvh] bg-[#f9f9f7]"
      style={{ fontFamily: "'Geist', system-ui, sans-serif" }}
    >
      {/* Subtle ambient */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[400px] bg-[#9A0000]/3 rounded-full blur-[140px]" />
      </div>

      {/* Floating Nav Pill */}
      <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 px-4 w-full max-w-2xl">
        <nav className="bg-white/90 backdrop-blur-xl border border-slate-200/80 rounded-2xl px-5 py-3 flex items-center justify-between shadow-lg shadow-slate-200/60">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 flex items-center justify-center shrink-0">
              <img src="/logo-ec-icon.png" alt="EC Logo" className="w-full h-full object-contain" />
            </div>
            <span className="text-[#9A0000] font-medium text-sm hidden sm:block">Tes Koran</span>
          </div>
          <span className="text-slate-900 font-semibold text-xs truncate max-w-[150px]">{candidate?.nama}</span>
        </nav>
      </div>

      <div className="relative z-10 pt-28 pb-24 px-4 sm:px-6 max-w-2xl mx-auto">

        {/* Hero */}
        <div className="mb-16">
          <p className="text-[#9A0000] text-xs font-medium tracking-[0.25em] uppercase mb-5">Tahap Akhir</p>
          <h1
            style={{ fontSize: 'clamp(2.2rem, 3.5vw, 4rem)', lineHeight: 1.08, letterSpacing: '-0.03em' }}
            className="text-slate-900 font-light max-w-5xl mb-6"
          >
            Unggah Screenshot{' '}
            <span className="text-[#9A0000]">Hasil Tes</span>
          </h1>
          <p className="text-slate-900 text-sm leading-relaxed max-w-md">
            Unggah screenshot hasil Tes Koran dari <strong className="text-[#9A0000]">aplikasi di Play Store</strong>. Pastikan seluruh layar hasil terlihat jelas dan tidak terpotong.
          </p>
        </div>

        {/* Upload Card */}
        <div className="rounded-3xl border border-slate-200 bg-white overflow-hidden shadow-sm">

          {/* Drop Zone */}
          <div
            onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
            onDragLeave={() => setDragActive(false)}
            onDrop={handleDrop}
            className={`relative m-5 rounded-2xl border-2 border-dashed transition-all duration-300 ${
              dragActive
                ? 'border-[#9A0000]/40 bg-red-50/60'
                : file
                ? 'border-slate-300 bg-slate-50'
                : 'border-slate-200 hover:border-[#9A0000]/30 hover:bg-red-50/20'
            }`}
          >
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
              disabled={uploading}
            />

            {preview ? (
              <div className="flex flex-col items-center gap-4 p-8">
                <div className="w-full max-w-sm rounded-2xl overflow-hidden border border-slate-200 shadow-sm">
                  <img
                    src={preview}
                    alt="Preview tes"
                    className="w-full h-auto object-cover"
                  />
                </div>
                <div className="flex items-center gap-2 text-sm text-slate-900">
                  <FileImage className="w-4 h-4 text-[#9A0000]" />
                  <span className="text-xs font-mono truncate max-w-[200px]">{file?.name}</span>
                </div>
                <p className="text-xs text-[#9A0000]">Klik atau seret untuk ganti gambar</p>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-5 p-14 pointer-events-none">
                <div className="w-14 h-14 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center">
                  <UploadCloud className="w-6 h-6 text-[#9A0000]" />
                </div>
                <div className="text-center">
                  <h3 className="text-slate-900 font-semibold text-base mb-1.5">Seret atau Unggah Screenshot</h3>
                  <p className="text-slate-900 text-sm">atau klik untuk memilih dari galeri</p>
                  <p className="text-[#9A0000] text-xs mt-2 font-mono">JPG, PNG, WEBP</p>
                </div>
              </div>
            )}
          </div>

          {/* Error */}
          {uploadError && (
            <div className="mx-5 mb-4 p-4 rounded-xl border border-red-200 bg-red-50">
              <p className="text-red-600 text-sm">{uploadError}</p>
            </div>
          )}

          {/* Footer */}
          <div className="px-7 py-6 border-t border-slate-100 bg-slate-50/50 flex flex-col sm:flex-row items-center justify-between gap-5">
            <div className="flex items-center gap-2 text-xs text-slate-900">
              <ShieldCheck className="w-3.5 h-3.5 text-[#9A0000]" />
              <span>Screenshot dianalisis oleh AI — aman dan terenkripsi</span>
            </div>
            <button
              onClick={handleSubmit}
              disabled={!file || uploading}
              className={`flex items-center gap-3 px-7 py-3.5 rounded-2xl text-sm font-medium transition-all duration-200 active:scale-[0.97] w-full sm:w-auto justify-center ${
                file && !uploading
                  ? 'bg-[#9A0000] text-white hover:bg-red-800 shadow-lg shadow-[#9A0000]/20'
                  : 'bg-slate-100 text-slate-900 opacity-50 border border-slate-200 cursor-not-allowed'
              }`}
            >
              {uploading ? (
                <>
                  <div className="w-4 h-4 border-2 border-[#9A0000]/30 border-t-[#9A0000] rounded-full animate-spin" />
                  <span>Menganalisis...</span>
                </>
              ) : (
                <>
                  <ArrowRight className="w-4 h-4" />
                  <span>Kirim Lembar Tes</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Bottom hint */}
        <div className="mt-8 text-center">
          <p className="text-[#9A0000] text-xs leading-relaxed max-w-sm mx-auto">
            Ambil screenshot saat layar menampilkan hasil akhir Tes Koran di aplikasi. Sistem AI akan menganalisis secara otomatis.
          </p>
        </div>
      </div>
    </main>
  );
}

export default function KoranTestPage() {
  return (
    <Suspense fallback={
      <div className="min-h-[100dvh] bg-white flex items-center justify-center">
        <div className="w-7 h-7 border-2 border-slate-200 border-t-[#9A0000] rounded-full animate-spin" />
      </div>
    }>
      <KoranTestContent />
    </Suspense>
  );
}
