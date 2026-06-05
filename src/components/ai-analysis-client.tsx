'use client';

import { useState, useEffect } from 'react';
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
import { Card, CardContent } from '@/components/ui/card';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

// ─── Types ────────────────────────────────────────────────────────────────────

interface AnalysisResult {
  fit_scores?: {
    disc_fit: number;
    wpt_fit: number;
    tes_koran_fit: number;
    kesesuaian_overall: number;
  };
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
  usage?: {
    input_tokens: number;
    output_tokens: number;
    total_tokens: number;
  };
}

interface Props {
  candidateId: string;
  candidateName: string;
  initialAnalysis?: AnalysisResult;
  initialGeneratedAt?: string;
  hasNewerData?: boolean;
  hasDisc: boolean;
  hasWpt: boolean;
  hasKoran: boolean;
  hasInterview: boolean;
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

export function AiAnalysisClient({
  candidateId,
  candidateName,
  initialAnalysis,
  initialGeneratedAt,
  hasNewerData,
  hasDisc,
  hasWpt,
  hasKoran,
  hasInterview
}: Props) {
  const isPending = initialAnalysis && (initialAnalysis as any).status === 'in_progress';
  const isErrStatus = initialAnalysis && (initialAnalysis as any).status === 'error';

  const [state, setState] = useState<'idle' | 'loading' | 'done' | 'error'>(
    isPending ? 'loading' : (isErrStatus ? 'error' : (initialAnalysis ? 'done' : 'idle'))
  );
  const [result, setResult] = useState<AnalysisResponse | null>(
    (initialAnalysis && !isPending && !isErrStatus) ? {
      success: true,
      candidateId,
      candidateName,
      generatedAt: initialGeneratedAt || new Date().toISOString(),
      analysis: initialAnalysis,
      usage: (initialAnalysis as any).usage,
    } : null
  );
  const [error, setError] = useState(isErrStatus ? ((initialAnalysis as any).error || 'Analisis gagal.') : '');
  const [downloading, setDownloading] = useState(false);
  const [showWarning, setShowWarning] = useState(!!hasNewerData);
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [missingTests, setMissingTests] = useState<string[]>([]);

  useEffect(() => {
    setShowWarning(!!hasNewerData);
  }, [hasNewerData]);

  useEffect(() => {
    if (isPending) {
      pollStatus();
    }
  }, [isPending]);

  async function pollStatus(retryCount = 0) {
    if (retryCount >= 40) {
      setError('Proses analisis sedang berjalan di server. Silakan muat ulang halaman ini dalam 1-2 menit.');
      setState('error');
      return;
    }

    try {
      const res = await fetch(`/api/analyze-candidate?candidateId=${candidateId}`);
      if (res.ok) {
        const json = await res.json();
        if (json.success && json.exists) {
          if (json.analysis?.status === 'in_progress') {
            // Still in progress, retry
            setTimeout(() => pollStatus(retryCount + 1), 3000);
            return;
          }
          if (json.analysis?.status === 'error') {
            setError(json.analysis.error || 'Terjadi kesalahan saat menganalisis.');
            setState('error');
            return;
          }

          setResult({
            success: true,
            candidateId,
            candidateName,
            generatedAt: json.generatedAt,
            analysis: json.analysis,
            usage: json.analysis?.usage,
          });
          setState('done');
          setShowWarning(false);
          return;
        }
      }
    } catch (e) {
      console.error('Polling error:', e);
    }

    setTimeout(() => pollStatus(retryCount + 1), 3000);
  }

  async function runAnalysis() {
    const missing: string[] = [];
    if (!hasDisc) missing.push('Asesmen Kepribadian (DISC)');
    if (!hasWpt) missing.push('Tes IQ (WPT)');
    if (!hasKoran) missing.push('Tes Koran (Pauli/Kraepelin)');
    if (!hasInterview) missing.push('Evaluasi Interview');

    if (missing.length > 0) {
      setMissingTests(missing);
      setIsConfirmOpen(true);
      return;
    }

    await executeAnalysis();
  }

  async function executeAnalysis() {
    setState('loading');
    setError('');
    setResult(null);

    try {
      const res = await fetch('/api/analyze-candidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId }),
      });

      if (res.status === 400 || res.status === 404) {
        const json = await res.json();
        throw new Error(json.error || 'Request gagal.');
      }

      if (!res.ok) {
        console.log(`Server returned status ${res.status}. Starting status polling fallback...`);
        pollStatus();
        return;
      }

      const json = await res.json();
      if (!json.success) {
        throw new Error(json.error || 'Analisis gagal.');
      }

      if (json.queued) {
        pollStatus();
        return;
      }

      setResult(json as AnalysisResponse);
      setState('done');
      setShowWarning(false);
    } catch (err) {
      console.warn('Analysis error. Fallback to status polling...', err);
      pollStatus();
    }
  }

  async function handleDownload() {
    if (!result) return;
    setDownloading(true);
    try {
      const res = await fetch('/api/export/analysis-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          candidateId,
          analysis: result.analysis,
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => null);
        throw new Error(err?.error || 'Gagal mengunduh laporan PDF.');
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan-Psikologi-${candidateName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat mengunduh PDF');
    } finally {
      setDownloading(false);
    }
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
          Sistem akan menganalisis seluruh data kandidat — DISC, WPT, Tes Koran, dan Interview — menggunakan{' '}
          <span className="font-semibold text-[#8B2252]">Claude Sonnet 4.6 (Anthropic)</span> untuk menghasilkan laporan psikologi rekrutmen komprehensif.
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
          Claude Sonnet 4.6 sedang membaca dan mengintegrasikan semua data tes dan interview kandidat.
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
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant="outline" className="text-[10px] text-slate-500 border-slate-300 bg-slate-50">
            Powered by Claude Sonnet 4.6 (Anthropic)
          </Badge>
          {result.usage && (
            <Badge variant="outline" className="text-[10px] text-emerald-600 border-emerald-250 bg-emerald-50 font-semibold">
              Token: {result.usage.input_tokens.toLocaleString()} In / {result.usage.output_tokens.toLocaleString()} Out (Total: {result.usage.total_tokens.toLocaleString()})
            </Badge>
          )}
          <span className="text-[11px] text-slate-400" suppressHydrationWarning>
            {new Date(result.generatedAt).toLocaleString('id-ID')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {result.usage && (() => {
            const costUsd = (result.usage.input_tokens / 1000000) * 3 + (result.usage.output_tokens / 1000000) * 15;
            const costIdr = Math.round(costUsd * 16000);
            return (
              <div 
                className="flex items-center gap-1.5 px-2.5 h-8 bg-slate-50 rounded-md border border-slate-200 hidden sm:flex" 
                title={`~$${costUsd.toFixed(4)} USD`}
              >
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Biaya AI:</span>
                <span className="text-xs font-bold text-slate-700">Rp {costIdr.toLocaleString('id-ID')}</span>
              </div>
            );
          })()}
          <Button onClick={handleDownload} disabled={downloading} size="sm" variant="outline" className="flex items-center gap-1.5 h-8 text-xs">
            <Download className="w-3.5 h-3.5" />
            {downloading ? 'Mengunduh...' : 'Unduh Laporan PDF'}
          </Button>
          <Button onClick={runAnalysis} disabled={downloading} size="sm" variant="ghost" className="flex items-center gap-1.5 h-8 text-xs text-slate-500">
            <RefreshCw className="w-3.5 h-3.5" />
            Analisis Ulang
          </Button>
        </div>
      </div>

      {showWarning && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 shadow-sm text-left">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="font-bold text-amber-800 text-sm">Data Tes Baru Terdeteksi</h4>
            <p className="text-xs text-amber-700 mt-1 leading-relaxed">
              Kandidat telah menyelesaikan atau memperbarui data tes (WPT/DISC/Koran/Interview) setelah laporan analisis AI ini dibuat. 
              Disarankan untuk melakukan <strong>Analisis Ulang</strong> untuk memperbarui laporan psikologi.
            </p>
          </div>
          <Button 
            onClick={runAnalysis} 
            size="sm" 
            className="bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 self-center cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Analisis Ulang
          </Button>
        </div>
      )}

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

          {/* Fit Scores Metric Boxes */}
          {a.fit_scores && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-6 py-4 bg-slate-50 dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800">
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">DISC Fit</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-250">{a.fit_scores.disc_fit}%</p>
              </div>
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">IQ / WPT Fit</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-250">{a.fit_scores.wpt_fit}%</p>
              </div>
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Tes Koran Fit</p>
                <p className="text-2xl font-extrabold text-slate-800 dark:text-slate-250">{a.fit_scores.tes_koran_fit}%</p>
              </div>
              <div className="bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-xl p-3 text-center shadow-sm">
                <p className="text-[10px] text-slate-500 dark:text-slate-400 font-bold uppercase tracking-wider mb-1">Kesesuaian</p>
                <p className="text-2xl font-extrabold text-[#8B2252] dark:text-rose-400">{a.fit_scores.kesesuaian_overall}%</p>
              </div>
            </div>
          )}

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
        Laporan dihasilkan oleh EasyLegal AI System menggunakan Claude Sonnet 4.6 (Anthropic).
        Analisis ini bersifat pendukung keputusan, bukan pengganti penilaian profesional HR.
      </p>

      {/* Drawer Dialog untuk Konfirmasi Data Belum Lengkap */}
      <Drawer open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-10 h-10 rounded-full bg-amber-50 flex items-center justify-center border border-amber-200">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <DrawerTitle className="text-slate-900 font-bold text-base">Asesmen Belum Lengkap</DrawerTitle>
                <DrawerDescription className="text-xs text-slate-500">
                  Kandidat {candidateName} belum menyelesaikan beberapa tahap tes berikut.
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className="px-5 py-3 bg-slate-50 border-y border-slate-100">
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">Data yang belum terisi:</p>
            <ul className="space-y-1.5">
              {missingTests.map((t, idx) => (
                <li key={idx} className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <DrawerFooter className="flex flex-col gap-2 p-5">
            <Button
              onClick={async () => {
                setIsConfirmOpen(false);
                await executeAnalysis();
              }}
              className="w-full bg-[#8B2252] hover:bg-[#8B2252]/90 text-white font-semibold cursor-pointer py-5 h-11"
            >
              Lanjutkan Analisis Terbatas
            </Button>
            <DrawerClose asChild>
              <Button variant="outline" className="w-full font-semibold cursor-pointer h-11">
                Batal & Lengkapi Data
              </Button>
            </DrawerClose>
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
