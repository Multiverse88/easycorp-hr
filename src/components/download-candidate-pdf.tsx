'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download, Sparkles, Loader2, AlertTriangle, XCircle } from 'lucide-react';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';

interface DownloadCandidatePdfProps {
  candidateId: string;
  candidateName?: string;
  hasDisc?: boolean;
  hasWpt?: boolean;
  hasKoran?: boolean;
  hasInterview?: boolean;
}

type Phase = 'idle' | 'checking' | 'analyzing' | 'downloading';

const PHASE_MESSAGES: Record<Phase, string> = {
  idle: 'Download Data Kandidat',
  checking: 'Memeriksa analisis AI...',
  analyzing: 'Menjalankan analisis AI...',
  downloading: 'Membuat PDF...',
};

export function DownloadCandidatePdf({
  candidateId,
  candidateName = 'Kandidat',
  hasDisc = false,
  hasWpt = false,
  hasKoran = false,
  hasInterview = false,
}: DownloadCandidatePdfProps) {
  const [phase, setPhase] = useState<Phase>('idle');
  const [isConfirmOpen, setIsConfirmOpen] = useState(false);
  const [missingTests, setMissingTests] = useState<string[]>([]);

  const completedCount = [hasDisc, hasWpt, hasKoran, hasInterview].filter(Boolean).length;
  const isLoading = phase !== 'idle';

  // ── Polling helper ────────────────────────────────────────────────────────
  async function pollUntilDone(retryCount = 0): Promise<any | null> {
    if (retryCount >= 60) return null;
    try {
      const res = await fetch(`/api/analyze-candidate?candidateId=${candidateId}`);
      if (!res.ok) return null;
      const json = await res.json();
      if (json.success && json.exists) {
        const status = json.analysis?.status;
        if (status === 'in_progress') {
          await new Promise(r => setTimeout(r, 3000));
          return pollUntilDone(retryCount + 1);
        }
        if (status === 'error') return null;
        return json.analysis;
      }
    } catch (_) { /* ignore */ }
    await new Promise(r => setTimeout(r, 3000));
    return pollUntilDone(retryCount + 1);
  }

  // ── Core download flow ────────────────────────────────────────────────────
  async function executeDownload() {
    setIsConfirmOpen(false);
    setPhase('checking');

    try {
      // 1. Check if analysis already exists
      let analysis: any = null;
      const checkRes = await fetch(`/api/analyze-candidate?candidateId=${candidateId}`);
      if (checkRes.ok) {
        const checkJson = await checkRes.json();
        if (checkJson.success && checkJson.exists) {
          const status = checkJson.analysis?.status;
          if (status === 'in_progress') {
            setPhase('analyzing');
            analysis = await pollUntilDone();
          } else if (status !== 'error' && checkJson.analysis) {
            analysis = checkJson.analysis;
          }
        }
      }

      // 2. No valid analysis → run AI analysis now
      if (!analysis) {
        setPhase('analyzing');
        const postRes = await fetch('/api/analyze-candidate', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ candidateId }),
        });

        if (postRes.ok) {
          const postJson = await postRes.json();
          if (postJson.success && !postJson.queued) {
            analysis = postJson.analysis;
          } else {
            analysis = await pollUntilDone();
          }
        } else if (postRes.status === 504 || postRes.status === 503) {
          analysis = await pollUntilDone();
        } else {
          const errJson = await postRes.json().catch(() => null);
          throw new Error(errJson?.error || 'Gagal menjalankan analisis AI.');
        }
      }

      if (!analysis) {
        throw new Error('Analisis AI gagal atau timeout. Silakan coba lagi.');
      }

      // 3. Download the AI analysis PDF
      setPhase('downloading');
      const pdfRes = await fetch('/api/export/analysis-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId, analysis }),
      });

      if (!pdfRes.ok) {
        const errJson = await pdfRes.json().catch(() => null);
        throw new Error(errJson?.error || 'Gagal mengunduh laporan PDF.');
      }

      const blob = await pdfRes.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `Laporan-Psikologi-${candidateName.replace(/\s+/g, '-')}.pdf`;
      document.body.appendChild(link);
      link.click();
      window.URL.revokeObjectURL(url);
      link.remove();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Terjadi kesalahan saat download.';
      alert(msg);
    } finally {
      setPhase('idle');
    }
  }

  // ── Entry: check assessment completeness first ────────────────────────────
  function handleDownloadClick() {
    const missing: string[] = [];
    if (!hasDisc) missing.push('Asesmen Kepribadian (DISC)');
    if (!hasWpt) missing.push('Tes IQ (WPT)');
    if (!hasKoran) missing.push('Tes Koran (Pauli/Kraepelin)');
    if (!hasInterview) missing.push('Evaluasi Interview');

    // Hard block (0-2 done) or soft warning (3 done)
    if (missing.length > 0) {
      setMissingTests(missing);
      setIsConfirmOpen(true);
      return;
    }

    // All 4 complete — proceed directly
    executeDownload();
  }

  const isBlocked = completedCount <= 2;

  return (
    <>
      {/* ── Button ── */}
      <Button
        variant="outline"
        size="sm"
        onClick={handleDownloadClick}
        disabled={isLoading}
      >
        {isLoading ? (
          <>
            {phase === 'analyzing' ? (
              <Sparkles className="w-4 h-4 mr-2 animate-pulse text-[#8B2252]" />
            ) : (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            )}
            {PHASE_MESSAGES[phase]}
          </>
        ) : (
          <>
            <Download className="w-4 h-4 mr-2" />
            Download Data Kandidat
          </>
        )}
      </Button>

      {/* ── Drawer: asesmen tidak lengkap ── */}
      <Drawer open={isConfirmOpen} onOpenChange={setIsConfirmOpen}>
        <DrawerContent className="max-w-md mx-auto">
          <DrawerHeader className="text-left">
            <div className="flex items-center gap-2.5 mb-2">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center border ${
                isBlocked
                  ? 'bg-rose-50 border-rose-200'
                  : 'bg-amber-50 border-amber-200'
              }`}>
                {isBlocked
                  ? <XCircle className="w-5 h-5 text-rose-500" />
                  : <AlertTriangle className="w-5 h-5 text-amber-600" />}
              </div>
              <div>
                <DrawerTitle className="text-slate-900 font-bold text-base">
                  {isBlocked ? 'Data Tidak Mencukupi' : 'Asesmen Belum Lengkap'}
                </DrawerTitle>
                <DrawerDescription className="text-xs text-slate-500">
                  {isBlocked
                    ? `Hanya ${completedCount} dari 4 asesmen selesai — terlalu sedikit untuk analisis yang akurat.`
                    : `Kandidat ${candidateName} belum menyelesaikan ${missingTests.length} tahap tes berikut.`}
                </DrawerDescription>
              </div>
            </div>
          </DrawerHeader>

          <div className={`px-5 py-3 border-y ${
            isBlocked ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'
          }`}>
            <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wide">
              Data yang belum terisi:
            </p>
            <ul className="space-y-1.5">
              {missingTests.map((t, idx) => (
                <li key={idx} className="text-xs text-slate-700 font-semibold flex items-center gap-2">
                  <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${
                    isBlocked ? 'bg-rose-500' : 'bg-amber-500'
                  }`} />
                  {t}
                </li>
              ))}
            </ul>

            {isBlocked ? (
              <p className="text-xs text-rose-600 mt-3 leading-relaxed">
                Download laporan AI membutuhkan minimal <strong>3 dari 4 asesmen</strong> untuk menghasilkan
                laporan yang bermakna dan akurat. Dengan hanya <strong>{completedCount} asesmen</strong>,
                hasil analisis tidak akan optimal dan berpotensi memberikan penilaian yang{' '}
                <strong>tidak akurat</strong> karena kurangnya data.
              </p>
            ) : (
              <p className="text-xs text-amber-700 mt-3 leading-relaxed">
                Analisis tetap dapat dijalankan namun hasilnya mungkin <strong>kurang komprehensif</strong>.
                Disarankan untuk melengkapi semua asesmen terlebih dahulu.
              </p>
            )}
          </div>

          <DrawerFooter className="flex flex-col gap-2 p-5">
            {isBlocked ? (
              // Hard block — only close button
              <DrawerClose asChild>
                <Button className="w-full bg-slate-700 hover:bg-slate-800 text-white font-semibold cursor-pointer h-11">
                  Mengerti, Lengkapi Data Dulu
                </Button>
              </DrawerClose>
            ) : (
              // Soft warning — can proceed
              <>
                <Button
                  onClick={executeDownload}
                  className="w-full bg-[#8B2252] hover:bg-[#8B2252]/90 text-white font-semibold cursor-pointer h-11"
                >
                  Lanjutkan &amp; Download (Data Terbatas)
                </Button>
                <DrawerClose asChild>
                  <Button variant="outline" className="w-full font-semibold cursor-pointer h-11">
                    Batal &amp; Lengkapi Data
                  </Button>
                </DrawerClose>
              </>
            )}
          </DrawerFooter>
        </DrawerContent>
      </Drawer>
    </>
  );
}
