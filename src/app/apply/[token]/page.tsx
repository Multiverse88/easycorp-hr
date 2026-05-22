'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { getCandidateByToken, saveCandidateBio, Candidate } from '@/lib/db';
import { FileText, Award, Briefcase, GraduationCap, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function ApplyPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form states
  const [pendidikan, setPendidikan] = useState('');
  const [pengalaman, setPengalaman] = useState('');
  const [keahlian, setKeahlian] = useState('');

  useEffect(() => {
    async function loadCandidate() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) {
          setError('Tautan tidak valid atau telah kedaluwarsa. Silakan hubungi HR EasyLegal.');
          return;
        }

        // Cek jika sudah pernah mengisi bio dan sudah di tahap DISC / selanjutnya
        if (data.status !== 'screening') {
          // Arahkan langsung ke DISC test
          window.location.href = `/disc/${token}`;
          return;
        }

        setCandidate(data);
        setPendidikan(data.pendidikan || '');
        setPengalaman(data.pengalaman || '');
        setKeahlian(data.keahlian || '');
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendidikan || !pengalaman || !keahlian) {
      alert('Mohon lengkapi semua kolom biodata.');
      return;
    }

    try {
      setSaving(true);
      await saveCandidateBio(token, { pendidikan, pengalaman, keahlian });
      // Sukses, arahkan ke DISC Test
      window.location.href = `/disc/${token}`;
    } catch (err) {
      console.error(err);
      alert('Gagal menyimpan biodata. Silakan coba lagi.');
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-[hsl(15_60%_97%)]">
        <Loader2 className="w-10 h-10 animate-spin text-[hsl(350_60%_50%)]" />
        <p className="mt-4 text-slate-600 text-sm font-medium">Memuat formulir kandidat...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-[hsl(15_60%_97%)] px-4">
        <div className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded-2xl p-8 text-center">
          <div className="inline-flex p-3 rounded-full bg-red-50 text-red-600 mb-4">
            <AlertCircle className="w-8 h-8" />
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
    <div className="min-h-screen bg-[hsl(15_60%_97%)] py-10 px-4 sm:px-6">
      <LoadingOverlay visible={saving} message="Menyimpan biodata..." />

      <div className="max-w-3xl mx-auto">
        {/* Header Portal */}
        <div className="text-center mb-8">
          <div className="inline-block bg-gradient-to-r from-[hsl(350_25%_14%)] to-[hsl(350_30%_18%)] text-white font-bold px-4 py-1.5 rounded-full text-xs uppercase tracking-widest shadow-md mb-3">
            EasyLegal
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Portal Rekrutmen Kandidat
          </h1>
          <p className="text-slate-500 text-sm mt-1">
            Harap isi informasi profil Anda di bawah ini secara lengkap untuk memulai asesmen psikologi.
          </p>
        </div>

        {/* Info Strip */}
        {candidate && (
          <div className="bg-gradient-to-r from-[hsl(350_25%_14%)] to-[hsl(350_30%_18%)] text-white shadow-lg rounded-2xl p-6 mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Nama Kandidat</p>
              <h2 className="text-xl font-bold">{candidate.nama}</h2>
            </div>
            <div>
              <p className="text-blue-200 text-xs font-semibold uppercase tracking-wider">Posisi Yang Dilamar</p>
              <div className="inline-flex items-center bg-gradient-to-r from-[hsl(350_25%_14%)] to-[hsl(350_30%_18%)] text-white font-bold px-3 py-1 rounded-md text-xs mt-1 border border-blue-500">
                {candidate.posisi_dilamar}
              </div>
            </div>
          </div>
        )}

        {/* Form Card */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200 shadow-lg rounded-2xl overflow-hidden">
          <div className="bg-[hsl(15_60%_97%)] border-b border-slate-200 px-6 py-4 flex items-center gap-2.5">
            <FileText className="w-5 h-5 text-blue-800" />
            <h3 className="font-bold text-slate-800">Formulir Riwayat Hidup (Biodata)</h3>
          </div>

          <div className="p-6 space-y-6">
            {/* Pendidikan */}
            <div>
              <label htmlFor="pendidikan" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <GraduationCap className="w-4 h-4 text-blue-850" />
                Riwayat Pendidikan Terakhir
              </label>
              <textarea
                id="pendidikan"
                rows={3}
                required
                value={pendidikan}
                onChange={(e) => setPendidikan(e.target.value)}
                placeholder="Contoh: S1 Ilmu Hukum - Universitas Diponegoro (IPK 3.65, Lulus 2023)"
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent text-sm transition"
              />
              <p className="text-xs text-slate-400 mt-1">Sebutkan jenjang pendidikan, program studi, instansi, dan tahun lulus.</p>
            </div>

            {/* Pengalaman */}
            <div>
              <label htmlFor="pengalaman" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Briefcase className="w-4 h-4 text-blue-850" />
                Riwayat Pengalaman Kerja
              </label>
              <textarea
                id="pengalaman"
                rows={4}
                required
                value={pengalaman}
                onChange={(e) => setPengalaman(e.target.value)}
                placeholder="Contoh: &#10;- Magang Asisten Notaris di Kantor Notaris Budi, SH (6 Bulan) - Menangani draf akta tanah, kontrak, dan verifikasi sertifikat. &#10;- Legal Intern di PT Legal Maju - Drafting MoU dan operasional NIB."
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent text-sm transition"
              />
              <p className="text-xs text-slate-400 mt-1">Sebutkan perusahaan/instansi, posisi, durasi, dan ringkasan singkat tugas Anda.</p>
            </div>

            {/* Keahlian */}
            <div>
              <label htmlFor="keahlian" className="flex items-center gap-2 text-sm font-bold text-slate-700 mb-2">
                <Award className="w-4 h-4 text-blue-850" />
                Keahlian & Kompetensi Utama
              </label>
              <textarea
                id="keahlian"
                rows={3}
                required
                value={keahlian}
                onChange={(e) => setKeahlian(e.target.value)}
                placeholder="Contoh: Drafting Kontrak Hukum, Perizinan Berusaha OSS RBA, Manajemen Dokumen, Ketelitian Tinggi, Kerja Sama Tim, Komunikasi Persuasif."
                className="w-full border border-slate-300 rounded-xl px-4 py-3 text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-800 focus:border-transparent text-sm transition"
              />
              <p className="text-xs text-slate-400 mt-1">Sebutkan hard skill teknis maupun soft skill utama yang Anda kuasai.</p>
            </div>
          </div>

          {/* Submit Action */}
          <div className="bg-[hsl(15_60%_97%)] border-t border-slate-200 px-6 py-4 flex justify-between items-center">
            <span className="text-xs text-slate-500 font-medium">Langkah 1 dari 2</span>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-[hsl(350_25%_14%)] to-[hsl(350_30%_18%)] hover:opacity-90 text-white font-bold px-5 py-2.5 rounded-xl text-sm shadow-md hover:shadow-lg transition disabled:opacity-50"
            >
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Menyimpan...
                </>
              ) : (
                <>
                  Simpan & Lanjut ke DISC Test
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </form>

        <div className="text-center mt-6 text-xs text-slate-400">
          EasyLegal &copy; 2026. All rights reserved.
        </div>
      </div>
    </div>
  );
}
