'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
  getCandidateByToken,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getPapikostikSessionByToken,
  getKoranTestResultByCandidate,
  Candidate,
} from '@/lib/db';
import {
  ArrowRight,
  BrainCircuit,
  Timer,
  ListChecks,
  Newspaper,
  CheckCircle2,
  Sparkles,
  RefreshCcw,
} from 'lucide-react';

type TestStatus = 'done' | 'in_progress' | 'not_started';

interface TestOption {
  key: 'disc' | 'wpt' | 'papikostik' | 'koran';
  href: string;
  title: string;
  duration: string;
  description: string;
  icon: React.ReactNode;
  status: TestStatus;
}

function statusBadge(status: TestStatus) {
  if (status === 'done') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-emerald-600">
        <CheckCircle2 className="w-3.5 h-3.5" /> Selesai
      </span>
    );
  }
  if (status === 'in_progress') {
    return (
      <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-[#9A0000]">
        <RefreshCcw className="w-3.5 h-3.5" /> Sedang Dikerjakan
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-slate-400">
      Belum Dikerjakan
    </span>
  );
}

export default function MulaiTesPage() {
  const router = useRouter();
  const params = useParams();
  const token = params.token as string;

  const [candidate, setCandidate] = useState<Candidate | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTutorial, setShowTutorial] = useState(true);
  const [tests, setTests] = useState<TestOption[] | null>(null);

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        const data = await getCandidateByToken(token);
        if (!data) { setError('Tautan tidak valid atau telah kedaluwarsa.'); return; }
        if (!data.pendidikan) { router.push(`/apply/${token}`); return; }
        setCandidate(data);

        const [discResult, wptResult, papikostikSession, koranResult] = await Promise.all([
          getDiscTestResultByCandidate(data.id),
          getWptTestResultByCandidate(data.id),
          getPapikostikSessionByToken(token),
          getKoranTestResultByCandidate(data.id),
        ]);

        const discStatus: TestStatus = discResult
          ? 'done'
          : (data.disc_draft_answers && data.disc_draft_answers.length > 0) ? 'in_progress' : 'not_started';

        const wptStatus: TestStatus = wptResult
          ? 'done'
          : (data.wpt_draft_answers && data.wpt_draft_answers.length > 0) ? 'in_progress' : 'not_started';

        const papikostikDone = papikostikSession?.status === 'COMPLETED';
        const papikostikStatus: TestStatus = papikostikDone
          ? 'done'
          : (papikostikSession && Object.keys(papikostikSession.answers || {}).length > 0) ? 'in_progress' : 'not_started';

        const koranStatus: TestStatus = koranResult ? 'done' : 'not_started';

        const nextTests: TestOption[] = [
          {
            key: 'disc',
            href: `/disc/${token}`,
            title: 'Uji Kepribadian DISC',
            duration: '±10-15 menit • tanpa batas waktu',
            description: 'Pilih kata yang paling dan paling tidak menggambarkan diri Anda dari 28 kelompok kata, untuk mengukur gaya perilaku dan kepribadian kerja.',
            icon: <Sparkles className="w-5 h-5" />,
            status: discStatus,
          },
          {
            key: 'wpt',
            href: `/wpt/${token}`,
            title: 'Tes Kemampuan Kognitif (WPT)',
            duration: '20 menit • dibatasi waktu',
            description: '50 soal numerik, verbal, logika, dan penalaran analitis untuk mengukur kemampuan problem solving Anda.',
            icon: <BrainCircuit className="w-5 h-5" />,
            status: wptStatus,
          },
          {
            key: 'papikostik',
            href: `/papikostik/${token}`,
            title: 'Inventori Kepribadian Kerja (PAPI Kostick)',
            duration: '9 halaman • tanpa batas waktu',
            description: '90 pasang pernyataan preferensi kerja, dikerjakan bertahap. Setiap halaman otomatis tersimpan.',
            icon: <ListChecks className="w-5 h-5" />,
            status: papikostikStatus,
          },
          {
            key: 'koran',
            href: `/koran/${token}`,
            title: 'Tes Koran',
            duration: 'via aplikasi eksternal • dapat ditunda',
            description: 'Kerjakan tes konsentrasi di aplikasi Play Store, lalu unggah screenshot hasilnya. Bisa dilewati dan dikerjakan nanti.',
            icon: <Newspaper className="w-5 h-5" />,
            status: koranStatus,
          },
        ];

        setTests(nextTests);

        const anyStartedOrDone = nextTests.some(t => t.status !== 'not_started');
        if (anyStartedOrDone) setShowTutorial(false);
      } catch (err) {
        console.error(err);
        setError('Terjadi kesalahan saat memuat data.');
      } finally {
        setLoading(false);
      }
    }
    if (token) load();
  }, [token, router]);

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
          <h2 className="text-2xl font-light text-slate-900 mb-3">Akses Tidak Valid</h2>
          <p className="text-slate-400 text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  const allDone = tests?.every(t => t.status === 'done') ?? false;

  if (allDone) {
    return (
      <div className="min-h-[100dvh] bg-[#f9f9f7] flex items-center justify-center px-6" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-emerald-100/50 rounded-full blur-[160px]" />
        </div>
        <div className="relative z-10 w-full max-w-sm text-center">
          <div className="w-20 h-20 rounded-3xl bg-emerald-50 border border-emerald-200 flex items-center justify-center mx-auto mb-8">
            <CheckCircle2 className="w-9 h-9 text-emerald-600" />
          </div>
          <h2 className="text-3xl font-light text-slate-900 mb-4 tracking-tight">Semua Tahap Selesai</h2>
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Terima kasih, <strong className="text-slate-700">{candidate?.nama}</strong>. Seluruh tahap asesmen telah Anda selesaikan. Tim HR akan menghubungi Anda untuk informasi selanjutnya.
          </p>
          <div className="text-[10px] font-medium text-[#9A0000] uppercase tracking-[0.3em] border-t border-slate-100 pt-6">
            EasyCorp HR System
          </div>
        </div>
      </div>
    );
  }

  // --- TUTORIAL SCREEN (first visit only) ---
  if (showTutorial) {
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
              <p className="text-slate-900 text-sm font-semibold">Cara Mengerjakan</p>
            </div>
          </div>

          <h1 className="text-4xl font-light text-slate-900 tracking-tight mb-3">Selamat Datang, {candidate?.nama}</h1>
          <p className="text-slate-900 text-sm leading-relaxed mb-10">
            Anda akan mengerjakan <strong className="text-[#9A0000]">4 tahap asesmen</strong>. Berikut hal-hal penting sebelum memulai.
          </p>

          <div className="space-y-4 mb-10">
            {[
              {
                title: 'Bebas Pilih Urutan',
                desc: 'Anda dapat memilih tahap mana yang ingin dikerjakan lebih dulu, sesuai kenyamanan Anda.',
              },
              {
                title: 'Progress Tersimpan Otomatis',
                desc: 'Jawaban yang sudah diisi tersimpan otomatis. Anda bisa menutup halaman dan melanjutkan lain waktu tanpa mengulang dari awal.',
              },
              {
                title: 'Tidak Harus Selesai Sekaligus',
                desc: 'Kerjakan hari ini sebagian, lanjutkan besok atau kapan pun — selama seluruh tahap akhirnya terselesaikan.',
              },
              {
                title: 'Tes Koran Bisa Ditunda',
                desc: 'Khusus Tes Koran, Anda dapat melewatinya untuk sementara dan mengerjakannya belakangan.',
              },
            ].map((step, i) => (
              <div key={i} className="flex gap-4 p-5 bg-white rounded-2xl border border-slate-200 shadow-sm">
                <div className="w-8 h-8 rounded-xl bg-red-50 border border-[#9A0000]/15 flex items-center justify-center shrink-0 text-[#9A0000] text-xs font-bold mt-0.5">
                  {i + 1}
                </div>
                <div>
                  <p className="text-slate-900 font-semibold text-sm mb-0.5">{step.title}</p>
                  <p className="text-slate-900 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <button
            onClick={() => setShowTutorial(false)}
            className="w-full flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-[#9A0000] text-white text-sm font-semibold hover:bg-red-800 transition-all duration-200 active:scale-[0.98] shadow-lg shadow-[#9A0000]/20"
          >
            Lanjut, Pilih Tahap Pertama
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // --- MODAL: PILIH TES ---
  return (
    <div className="min-h-[100dvh] bg-[#f9f9f7] flex items-center justify-center px-4 py-10" style={{ fontFamily: "'Geist', system-ui, sans-serif" }}>
      <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-40" />

      <div className="relative z-50 w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden">
        <div className="px-8 pt-8 pb-6 border-b border-slate-100">
          <p className="text-[#9A0000] text-xs font-semibold uppercase tracking-widest mb-2">Pilih Tahap Asesmen</p>
          <h2 className="text-2xl font-light text-slate-900 tracking-tight">Mau mengerjakan yang mana dulu, {candidate?.nama}?</h2>
          <p className="text-slate-900 text-sm mt-2 leading-relaxed">
            Pilih salah satu untuk memulai. Tahap lain dapat dikerjakan kapan saja setelahnya.
          </p>
        </div>

        <div className="p-6 space-y-3 max-h-[60vh] overflow-y-auto">
          {tests?.map((t) => {
            const isDone = t.status === 'done';
            return (
              <button
                key={t.key}
                onClick={() => router.push(t.href)}
                disabled={isDone}
                className={`w-full flex items-start gap-4 p-5 rounded-2xl border text-left transition-all duration-200 ${
                  isDone
                    ? 'border-emerald-200 bg-emerald-50/40 cursor-default'
                    : 'border-slate-200 hover:border-[#9A0000]/30 hover:bg-red-50/40 active:scale-[0.99]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                  isDone ? 'bg-emerald-100 text-emerald-600' : 'bg-red-50 text-[#9A0000] border border-[#9A0000]/15'
                }`}>
                  {isDone ? <CheckCircle2 className="w-5 h-5" /> : t.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3 mb-1">
                    <p className="text-slate-900 font-semibold text-sm">{t.title}</p>
                    {statusBadge(t.status)}
                  </div>
                  <p className="text-slate-900 text-xs leading-relaxed mb-1.5">{t.description}</p>
                  <p className="text-[10px] text-[#9A0000] font-medium uppercase tracking-wider flex items-center gap-1">
                    <Timer className="w-3 h-3" /> {t.duration}
                  </p>
                </div>
                {!isDone && <ArrowRight className="w-4 h-4 text-slate-300 shrink-0 mt-2" />}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
