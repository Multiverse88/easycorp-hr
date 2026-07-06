'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, getKoranTestResultByCandidate, Candidate } from '@/lib/db';
import { UploadCloud, CheckCircle2, ShieldCheck, FileImage, ArrowRight, Camera, SunMedium, ImageIcon, AlertCircle } from 'lucide-react';

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
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Ini adalah tahap terakhir evaluasi. Unggah <strong className="text-[#9A0000]">screenshot hasil Tes Koran</strong> dari aplikasi yang Anda gunakan di Play Store.
          </p>

          <div className="space-y-4 mb-10">
            {[
              {
                icon: <Camera className="w-5 h-5" />,
                title: 'Kerjakan Tes di Aplikasi Play Store',
                desc: 'Buka aplikasi Tes Koran di Play Store, kerjakan tesnya hingga selesai, lalu ambil screenshot layar hasil tes.',
              },
              {
                icon: <SunMedium className="w-5 h-5" />,
                title: 'Screenshot Jelas & Tidak Terpotong',
                desc: 'Pastikan screenshot menampilkan seluruh layar hasil tes. Jangan crop atau edit gambarnya sebelum diunggah.',
              },
              {
                icon: <ImageIcon className="w-5 h-5" />,
                title: 'Format: JPG, PNG, atau WEBP',
                desc: 'Screenshot dari smartphone biasanya tersimpan otomatis sebagai JPG atau PNG. Langsung unggah dari galeri.',
              },
              {
                icon: <AlertCircle className="w-5 h-5" />,
                title: 'Pastikan Semua Angka & Skor Terlihat',
                desc: 'Sistem AI akan menganalisis hasil secara otomatis. Screenshot yang buram atau terpotong dapat mempengaruhi akurasi analisis.',
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

          <p className="text-center text-xs text-[#9A0000] mt-4">
            Kandidat: {candidate?.nama}
          </p>
        </div>
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
          <h2 className="text-3xl font-light text-slate-900 mb-4 tracking-tight">Semua Selesai</h2>
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Terima kasih, <strong className="text-slate-700">{candidate?.nama}</strong>. Tes Koran berhasil diunggah dan seluruh tahap evaluasi telah selesai.
          </p>
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
