'use client';

import { useState } from 'react';
import {
  Brain,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  ChevronDown,
  ChevronUp,
  Download,
  RefreshCw,
  User,
  Zap,
  Shield,
  MessageSquare,
  TrendingUp,
  AlertCircle,
  Star,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  ringkasan_eksekutif: string;
  profil_kepribadian: {
    narasi: string;
    kekuatan: string[];
    area_pengembangan: string[];
  };
  kemampuan_intelektual: {
    narasi: string;
    kesesuaian_posisi: string;
  };
  daya_tahan_kerja: {
    narasi: string;
    kesimpulan: string;
  };
  kompetensi_interview: {
    narasi: string;
    highlight: string[];
  };
  analisis_integrasi: string;
  potensi_risiko: string[];
  rekomendasi_onboarding: string;
  kesimpulan_akhir: {
    rekomendasi: string;
    catatan: string;
    skor_keseluruhan: number;
  };
}

interface AnalysisResponse {
  success: boolean;
  candidateId: string;
  candidateName: string;
  generatedAt: string;
  analysis: AnalysisResult;
}

interface Props {
  candidateId: string;
  candidateName: string;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getRekomendasiConfig(r: string) {
  switch (r) {
    case 'Sangat Direkomendasikan':
      return { color: 'bg-emerald-500', text: 'text-white', ring: 'ring-emerald-200', icon: CheckCircle2, badge: 'bg-emerald-100 text-emerald-800' };
    case 'Direkomendasikan':
      return { color: 'bg-blue-500', text: 'text-white', ring: 'ring-blue-200', icon: CheckCircle2, badge: 'bg-blue-100 text-blue-800' };
    case 'Dipertimbangkan':
      return { color: 'bg-amber-500', text: 'text-white', ring: 'ring-amber-200', icon: AlertTriangle, badge: 'bg-amber-100 text-amber-800' };
    default:
      return { color: 'bg-red-500', text: 'text-white', ring: 'ring-red-200', icon: XCircle, badge: 'bg-red-100 text-red-800' };
  }
}

function ScoreRing({ score }: { score: number }) {
  const r = 52;
  const circ = 2 * Math.PI * r;
  const offset = circ - (score / 100) * circ;
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#3b82f6' : score >= 40 ? '#f59e0b' : '#ef4444';

  return (
    <div className="relative inline-flex items-center justify-center w-32 h-32">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={r} fill="none" stroke="#e2e8f0" strokeWidth="10" />
        <circle
          cx="60" cy="60" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={circ}
          strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1.2s ease' }}
        />
      </svg>
      <div className="absolute text-center">
        <div className="text-2xl font-bold text-slate-800">{score}</div>
        <div className="text-[10px] text-slate-500 font-medium">/100</div>
      </div>
    </div>
  );
}

function Section({ title, icon: Icon, children, defaultOpen = true }: {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <Card className="border border-slate-200 shadow-sm overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50/70 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#8B2252]/10 flex items-center justify-center">
            <Icon className="w-4 h-4 text-[#8B2252]" />
          </div>
          <span className="font-semibold text-slate-800">{title}</span>
        </div>
        {open ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
      </button>
      {open && <CardContent className="pt-0 pb-5 px-5">{children}</CardContent>}
    </Card>
  );
}

function ListBadges({ items, variant = 'default' }: { items: string[]; variant?: 'default' | 'warning' }) {
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      {items.map((item, i) => (
        <span
          key={i}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium border ${variant === 'warning'
            ? 'bg-amber-50 text-amber-800 border-amber-200'
            : 'bg-emerald-50 text-emerald-800 border-emerald-200'
            }`}
        >
          {variant === 'warning'
            ? <AlertCircle className="w-3 h-3" />
            : <CheckCircle2 className="w-3 h-3" />
          }
          {item}
        </span>
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export function AiAnalysisClient({ candidateId, candidateName }: Props) {
  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [result, setResult] = useState<AnalysisResponse | null>(null);
  const [error, setError] = useState('');

  async function runAnalysis() {
    setState('loading');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Analisis gagal.');
      }
      setResult(json as AnalysisResponse);
      setState('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan.');
      setState('error');
    }
  }

  function handleDownload() {
    if (!result) return;
    const a = result.analysis;
    const lines = [
      `LAPORAN ANALISIS PSIKOLOGI REKRUTMEN`,
      `EasyLegal Recruitment System`,
      `Tanggal Dibuat: ${new Date(result.generatedAt).toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
      `Nama Kandidat : ${result.candidateName}`,
      ``,
      `══════════════════════════════════════════`,
      `RINGKASAN EKSEKUTIF`,
      `══════════════════════════════════════════`,
      a.ringkasan_eksekutif,
      ``,
      `══════════════════════════════════════════`,
      `A. PROFIL KEPRIBADIAN (DISC)`,
      `══════════════════════════════════════════`,
      a.profil_kepribadian.narasi,
      ``,
      `Kekuatan:`,
      ...a.profil_kepribadian.kekuatan.map(k => `  • ${k}`),
      ``,
      `Area Pengembangan:`,
      ...a.profil_kepribadian.area_pengembangan.map(k => `  • ${k}`),
      ``,
      `══════════════════════════════════════════`,
      `B. KEMAMPUAN INTELEKTUAL (WPT)`,
      `══════════════════════════════════════════`,
      a.kemampuan_intelektual.narasi,
      ``,
      `Kesesuaian Posisi: ${a.kemampuan_intelektual.kesesuaian_posisi}`,
      ``,
      `══════════════════════════════════════════`,
      `C. DAYA TAHAN KERJA (TES KORAN)`,
      `══════════════════════════════════════════`,
      a.daya_tahan_kerja.narasi,
      `Kesimpulan: ${a.daya_tahan_kerja.kesimpulan}`,
      ``,
      `══════════════════════════════════════════`,
      `D. KOMPETENSI INTERVIEW`,
      `══════════════════════════════════════════`,
      a.kompetensi_interview.narasi,
      ``,
      `Highlight Kompetensi:`,
      ...a.kompetensi_interview.highlight.map(h => `  • ${h}`),
      ``,
      `══════════════════════════════════════════`,
      `E. ANALISIS INTEGRASI`,
      `══════════════════════════════════════════`,
      a.analisis_integrasi,
      ``,
      `══════════════════════════════════════════`,
      `F. POTENSI RISIKO`,
      `══════════════════════════════════════════`,
      ...a.potensi_risiko.map(r => `  • ${r}`),
      ``,
      `══════════════════════════════════════════`,
      `G. REKOMENDASI ONBOARDING`,
      `══════════════════════════════════════════`,
      a.rekomendasi_onboarding,
      ``,
      `══════════════════════════════════════════`,
      `KESIMPULAN & REKOMENDASI AKHIR`,
      `══════════════════════════════════════════`,
      `Rekomendasi    : ${a.kesimpulan_akhir.rekomendasi}`,
      `Skor Keseluruhan: ${a.kesimpulan_akhir.skor_keseluruhan}/100`,
      `Catatan        : ${a.kesimpulan_akhir.catatan}`,
      ``,
      `──────────────────────────────────────────`,
      `Dokumen ini dihasilkan secara otomatis oleh EasyLegal AI Recruitment System`,
      `menggunakan model Claude Sonnet (Anthropic) via OpenRouter.`,
    ];

    const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Analisis-AI-${candidateName.replace(/\s+/g, '-')}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  // ── IDLE ──────────────────────────────────────────────────────────────────

  if (state === 'idle') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="relative mb-6">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-[#8B2252] to-[#c0507a] flex items-center justify-center shadow-lg shadow-[#8B2252]/20">
            <Brain className="w-12 h-12 text-white" />
          </div>
          <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow">
            <Sparkles className="w-4 h-4 text-white" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-slate-800 mb-3">Analisis AI Kandidat</h2>
        <p className="text-slate-500 max-w-md mb-2">
          Sistem akan menganalisis seluruh data kandidat — DISC, WPT, Tes Koran, Tes Seleksi, dan Interview — menggunakan{' '}
          <span className="font-semibold text-[#8B2252]">Claude Sonnet (Anthropic)</span> untuk menghasilkan laporan psikologi rekrutmen komprehensif.
        </p>
        <p className="text-xs text-slate-400 mb-8">Proses analisis memerlukan sekitar 10–30 detik.</p>
        <Button
          onClick={runAnalysis}
          className="h-12 px-8 bg-gradient-to-r from-[#8B2252] to-[#c0507a] hover:opacity-90 text-white font-semibold rounded-xl shadow-md shadow-[#8B2252]/20 flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          Jalankan Analisis AI
        </Button>
      </div>
    );
  }

  // ── LOADING ───────────────────────────────────────────────────────────────

  if (state === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-20 px-4 text-center">
        <div className="relative mb-6">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B2252] to-[#c0507a] flex items-center justify-center shadow-lg animate-pulse">
            <Brain className="w-10 h-10 text-white" />
          </div>
          <div className="absolute inset-0 rounded-2xl border-4 border-[#8B2252]/30 animate-ping" />
        </div>
        <h3 className="text-lg font-semibold text-slate-700 mb-2">Menganalisis Data Kandidat…</h3>
        <p className="text-sm text-slate-400 max-w-xs">
          Claude Sonnet sedang membaca dan mengintegrasikan semua data tes dan interview kandidat.
        </p>
        <div className="flex gap-1.5 mt-6">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-[#8B2252] animate-bounce"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    );
  }

  // ── ERROR ─────────────────────────────────────────────────────────────────

  if (state === 'error') {
    return (
      <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-200 flex items-center justify-center mb-4">
          <XCircle className="w-8 h-8 text-red-500" />
        </div>
        <h3 className="text-lg font-semibold text-slate-800 mb-2">Analisis Gagal</h3>
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-xl px-4 py-3 max-w-sm mb-6">{error}</p>
        <Button onClick={runAnalysis} variant="outline" className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4" />
          Coba Lagi
        </Button>
      </div>
    );
  }

  // ── DONE ─────────────────────────────────────────────────────────────────

  if (!result) return null;
  const a = result.analysis;
  const cfg = getRekomendasiConfig(a.kesimpulan_akhir.rekomendasi);
  const RekIcon = cfg.icon;

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300 bg-slate-50">
            Powered by Claude Sonnet
          </Badge>
          <span className="text-[11px] text-slate-400">
            {new Date(result.generatedAt).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleDownload} size="sm" variant="outline" className="flex items-center gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" />
            Unduh Laporan
          </Button>
          <Button onClick={runAnalysis} size="sm" variant="ghost" className="flex items-center gap-1.5 h-8 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            Analisis Ulang
          </Button>
        </div>
      </div>

      {/* Hero card — score + verdict */}
      <Card className={`border-2 ${cfg.ring} ring-4 shadow-md overflow-hidden`}>
        <CardContent className="p-0">
          <div className={`${cfg.color} px-6 py-5`}>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white/70 text-xs font-medium mb-1">Hasil Analisis AI untuk</p>
                <h2 className="text-xl font-bold text-white">{result.candidateName}</h2>
                <div className="flex items-center gap-2 mt-3">
                  <RekIcon className="w-5 h-5 text-white/90" />
                  <span className="text-white font-semibold text-base">{a.kesimpulan_akhir.rekomendasi}</span>
                </div>
                <p className="text-white/80 text-sm mt-1 max-w-md">{a.kesimpulan_akhir.catatan}</p>
              </div>
              <div className="bg-white/15 rounded-2xl p-4 backdrop-blur-sm">
                <ScoreRing score={a.kesimpulan_akhir.skor_keseluruhan} />
                <p className="text-center text-white/80 text-[11px] font-medium mt-2">Skor Keseluruhan</p>
              </div>
            </div>
          </div>

          {/* Executive summary */}
          <div className="px-6 py-4 bg-white border-t border-slate-100">
            <div className="flex items-start gap-3">
              <div className="w-7 h-7 rounded-lg bg-[#8B2252]/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                <Star className="w-3.5 h-3.5 text-[#8B2252]" />
              </div>
              <div>
                <p className="text-xs font-semibold text-[#8B2252] mb-1 uppercase tracking-wide">Ringkasan Eksekutif</p>
                <p className="text-sm text-slate-700 leading-relaxed">{a.ringkasan_eksekutif}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Personality profile */}
      <Section title="A. Profil Kepribadian (DISC)" icon={User}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.profil_kepribadian.narasi}</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <p className="text-xs font-semibold text-emerald-700 uppercase tracking-wide mb-2">Kekuatan</p>
            <ListBadges items={a.profil_kepribadian.kekuatan} variant="default" />
          </div>
          <div>
            <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-2">Area Pengembangan</p>
            <ListBadges items={a.profil_kepribadian.area_pengembangan} variant="warning" />
          </div>
        </div>
      </Section>

      {/* Intellectual capacity */}
      <Section title="B. Kemampuan Intelektual (WPT)" icon={Brain}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.kemampuan_intelektual.narasi}</p>
        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-xl">
          <p className="text-xs font-semibold text-blue-700 mb-1">Kesesuaian dengan Posisi</p>
          <p className="text-sm text-blue-800">{a.kemampuan_intelektual.kesesuaian_posisi}</p>
        </div>
      </Section>

      {/* Work endurance */}
      <Section title="C. Daya Tahan Kerja (Tes Koran)" icon={Zap}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.daya_tahan_kerja.narasi}</p>
        <div className="mt-4 flex items-center gap-3">
          <span className="text-xs text-slate-500 font-medium">Kesimpulan Tes Koran:</span>
          <Badge className={
            a.daya_tahan_kerja.kesimpulan === 'Lulus' ? 'bg-green-100 text-green-800 border border-green-200' :
              a.daya_tahan_kerja.kesimpulan === 'Dipertimbangkan' ? 'bg-yellow-100 text-yellow-800 border border-yellow-200' :
                'bg-red-100 text-red-800 border border-red-200'
          }>
            {a.daya_tahan_kerja.kesimpulan}
          </Badge>
        </div>
      </Section>

      {/* Interview competence */}
      <Section title="D. Kompetensi Interview" icon={MessageSquare}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.kompetensi_interview.narasi}</p>
        {a.kompetensi_interview.highlight.length > 0 && (
          <div className="mt-4">
            <p className="text-xs font-semibold text-slate-600 uppercase tracking-wide mb-2">Kompetensi Menonjol</p>
            <ListBadges items={a.kompetensi_interview.highlight} variant="default" />
          </div>
        )}
      </Section>

      {/* Integration */}
      <Section title="E. Analisis Integrasi" icon={TrendingUp}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.analisis_integrasi}</p>
      </Section>

      {/* Risk */}
      <Section title="F. Potensi Risiko & Concern" icon={Shield} defaultOpen={false}>
        {a.potensi_risiko.length === 0 ? (
          <p className="text-sm text-slate-400 italic">Tidak ada risiko signifikan teridentifikasi.</p>
        ) : (
          <ul className="space-y-2 mt-1">
            {a.potensi_risiko.map((r, i) => (
              <li key={i} className="flex items-start gap-2 text-sm text-slate-700">
                <AlertCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                {r}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Onboarding */}
      <Section title="G. Rekomendasi Onboarding" icon={Sparkles} defaultOpen={false}>
        <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">{a.rekomendasi_onboarding}</p>
      </Section>

      {/* Footer note */}
      <p className="text-center text-[11px] text-slate-400 pb-4">
        Laporan dihasilkan oleh EasyLegal AI System menggunakan Claude Sonnet (Anthropic) via OpenRouter.
        Analisis ini bersifat pendukung keputusan, bukan pengganti penilaian profesional HR.
      </p>
    </div>
  );
}
