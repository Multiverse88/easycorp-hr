'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, AlertTriangle, TrendingUp, Clock } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import type { WptTestResult } from '@/lib/db';

interface WptHrViewProps {
  result: WptTestResult;
  candidateName: string;
  posisiDilamar: string;
}

function kategoriColor(kategori: string): string {
  const colors: Record<string, string> = {
    'Superior': 'bg-purple-100 text-purple-700',
    'Sangat Baik': 'bg-green-100 text-green-700',
    'Baik': 'bg-blue-100 text-blue-700',
    'Cukup': 'bg-yellow-100 text-yellow-700',
    'Perlu Perhatian': 'bg-orange-100 text-orange-700',
    'Tidak Memenuhi Syarat': 'bg-red-100 text-red-700',
  };
  return colors[kategori] || 'bg-gray-100 text-gray-700';
}

function statusColor(status: string): string {
  const colors: Record<string, string> = {
    'Sangat Sesuai': 'bg-green-100 text-green-700',
    'Sesuai': 'bg-blue-100 text-blue-700',
    'Perlu Review': 'bg-yellow-100 text-yellow-700',
    'Tidak Sesuai': 'bg-red-100 text-red-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

function profilColor(persen: number): string {
  if (persen >= 0.8) return 'bg-green-500';
  if (persen >= 0.6) return 'bg-blue-500';
  if (persen >= 0.4) return 'bg-yellow-500';
  return 'bg-red-500';
}

function getPercentColorHex(percent: number): string {
  if (percent < 0.4) return '#E24B4A'; // Coral Red
  if (percent < 0.7) return '#BA7517'; // Amber
  return '#16A34A'; // Green
}

// ─── WPT → IQ Conversion Table (Official Scoring) ───────────────────────────
const WPT_IQ_TABLE: Record<number, number> = {
  10: 80, 11: 81, 12: 83, 13: 86, 14: 88,
  15: 90, 16: 93, 17: 95, 18: 97, 19: 98,
  20: 100, 21: 102, 22: 104, 23: 106, 24: 108,
  25: 111, 26: 113, 27: 114, 28: 116, 29: 119,
  30: 121, 31: 123, 32: 125, 33: 127, 34: 130,
  35: 132, 36: 136, 37: 139, 38: 142, 39: 145, 40: 150,
};

function getIqFromWpt(rawScore: number): number | null {
  if (rawScore in WPT_IQ_TABLE) return WPT_IQ_TABLE[rawScore];
  // extrapolate if outside range
  if (rawScore < 10) return 80;
  if (rawScore > 40) return 150;
  return null;
}

interface IqRemark {
  label: string;
  nilai: number;
  color: string;
  bg: string;
  ring: string;
  hexColor: string;
}

function getIqRemark(rawScore: number): IqRemark {
  if (rawScore < 10) return { label: 'Sangat Rendah', nilai: 1, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200', hexColor: '#E24B4A' };
  if (rawScore <= 15) return { label: 'Dibawah Rata-rata / Hampir Cukup', nilai: 2, color: 'text-rose-600', bg: 'bg-rose-50', ring: 'ring-rose-200', hexColor: '#E24B4A' };
  if (rawScore <= 20) return { label: 'Rata-rata / Cukup', nilai: 3, color: 'text-amber-600', bg: 'bg-amber-50', ring: 'ring-amber-200', hexColor: '#BA7517' };
  if (rawScore <= 24) return { label: 'Rata-rata Atas / Baik', nilai: 4, color: 'text-emerald-600', bg: 'bg-emerald-50', ring: 'ring-emerald-200', hexColor: '#16A34A' };
  return { label: 'Diatas Rata-rata / Sangat Baik', nilai: 5, color: 'text-indigo-600', bg: 'bg-indigo-50', ring: 'ring-indigo-200', hexColor: '#6366F1' };
}

export function WptHrView({ result, candidateName, posisiDilamar }: WptHrViewProps) {
  const iqScore = getIqFromWpt(result.skor);
  const remark = getIqRemark(result.skor);

  // Determine suitability status and badge style
  const matchRec = result.rekomendasi_posisi.find(
    (r) => r.posisi.toLowerCase().includes(posisiDilamar.toLowerCase())
  );
  const suitabilityStatus = matchRec ? matchRec.status : result.kategori;

  let badgeText = suitabilityStatus;
  let badgeClass = "bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700";

  if (
    suitabilityStatus === 'Sangat Sesuai' ||
    suitabilityStatus === 'Sesuai' ||
    suitabilityStatus === 'Superior' ||
    suitabilityStatus === 'Sangat Baik' ||
    suitabilityStatus === 'Baik'
  ) {
    badgeText =
      suitabilityStatus === 'Sangat Sesuai' || suitabilityStatus === 'Sesuai'
        ? 'Memenuhi syarat'
        : suitabilityStatus;
    badgeClass =
      'bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/20 dark:text-emerald-400 dark:border-emerald-900/30';
  } else if (
    suitabilityStatus === 'Perlu Review' ||
    suitabilityStatus === 'Cukup' ||
    suitabilityStatus === 'Perlu Perhatian'
  ) {
    badgeText = suitabilityStatus === 'Perlu Review' ? 'Perlu review' : suitabilityStatus;
    badgeClass =
      'bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-950/20 dark:text-amber-400 dark:border-amber-900/30';
  } else if (
    suitabilityStatus === 'Tidak Sesuai' ||
    suitabilityStatus === 'Tidak Memenuhi Syarat'
  ) {
    badgeText = 'Tidak memenuhi syarat';
    badgeClass =
      'bg-rose-50 text-rose-700 border border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/30';
  }

  return (
    <div className="space-y-6">
      {/* Main WPT Results Card (Redesigned) */}
      <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
        {/* Top Bar */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2">
            <Brain className="h-[18px] w-[18px] text-slate-500 dark:text-slate-400" />
            <h2 className="text-[15px] font-semibold text-slate-900 dark:text-slate-50">
              Tes IQ (WPT) — {candidateName}
            </h2>
          </div>
          <div className={`text-xs font-semibold px-3 py-1 rounded-full border ${badgeClass}`}>
            {badgeText}
          </div>
        </div>

        {/* Score Hero */}
        <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] bg-slate-50 dark:bg-slate-900/50 rounded-xl overflow-hidden mb-5 border border-slate-100 dark:border-slate-800">
          {/* Cell 1: IQ */}
          <div className="py-6 px-5 flex flex-col items-center justify-center text-center gap-1">
            <div
              className="text-[52px] font-semibold leading-none tracking-[-2px]"
              style={{ color: remark.hexColor }}
            >
              {iqScore}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Skor IQ</div>
            <div className="flex gap-1.5 mt-1.5">
              {[1, 2, 3, 4, 5].map((n) => (
                <div
                  key={n}
                  className="w-2.5 h-2.5 rounded-full"
                  style={{
                    backgroundColor: n <= remark.nilai ? remark.hexColor : '#E2E8F0',
                  }}
                />
              ))}
            </div>
            <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Nilai {remark.nilai} dari 5
            </div>
          </div>

          <div className="w-px bg-slate-200 dark:bg-slate-800 my-5 self-stretch" />

          {/* Cell 2: Skor Total */}
          <div className="py-6 px-5 flex flex-col items-center justify-center text-center gap-1">
            <div className="text-[28px] font-semibold text-slate-950 dark:text-slate-50 leading-none">
              {result.skor}
              <sup className="text-xs text-slate-500 font-normal">/{result.total_soal}</sup>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Skor total</div>
            <div className="mt-2.5 w-full h-1 bg-slate-200 dark:bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(result.skor / result.total_soal) * 100}%`,
                  backgroundColor: remark.hexColor,
                }}
              />
            </div>
          </div>

          <div className="w-px bg-slate-200 dark:bg-slate-800 my-5 self-stretch" />

          {/* Cell 3: Persentase Benar */}
          <div className="py-6 px-5 flex flex-col items-center justify-center text-center gap-1">
            <div className="text-[28px] font-semibold text-slate-950 dark:text-slate-50 leading-none">
              {Math.round(result.persen_benar * 100)}
              <sup className="text-xs font-semibold" style={{ color: remark.hexColor }}>
                %
              </sup>
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">Persentase benar</div>
            <div className="mt-2.5 relative w-[64px] h-[32px] flex items-end justify-center">
              <svg width="64" height="32" viewBox="0 0 64 32">
                <path
                  d="M4 32 A28 28 0 0 1 60 32"
                  fill="none"
                  stroke="#E2E8F0"
                  strokeWidth="5"
                  strokeLinecap="round"
                  className="stroke-slate-200 dark:stroke-slate-800"
                />
                <path
                  d="M4 32 A28 28 0 0 1 60 32"
                  fill="none"
                  stroke={remark.hexColor}
                  strokeWidth="5"
                  strokeLinecap="round"
                  strokeDasharray="88"
                  strokeDashoffset={88 - result.persen_benar * 88}
                />
              </svg>
            </div>
          </div>
        </div>

        {/* Skills Profil Kemampuan */}
        <div className="mb-5 border border-slate-200 dark:border-slate-800 rounded-xl p-5 bg-white dark:bg-slate-950">
          <div className="text-[13px] font-semibold text-slate-800 dark:text-slate-200 mb-3">
            Profil kemampuan per kategori
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {result.profil_kemampuan.map((profil) => (
              <div
                key={profil.category}
                className="bg-slate-50 dark:bg-slate-900/50 border border-slate-100 dark:border-slate-800/80 rounded-lg p-4 flex flex-col gap-2.5"
              >
                <div className="text-[13px] font-semibold text-slate-850 dark:text-slate-200">
                  {profil.category}
                </div>
                <div>
                  <div className="text-xl font-bold text-slate-900 dark:text-slate-50 leading-none">
                    {Math.round(profil.persen * 100)}%
                  </div>
                  <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                    {profil.benar} / {profil.total} benar
                  </div>
                </div>
                <svg className="w-full" height="5" viewBox="0 0 100 5">
                  <rect
                    x="0"
                    y="0"
                    width="100"
                    height="5"
                    rx="3"
                    fill="#E2E8F0"
                    className="fill-slate-200 dark:fill-slate-800"
                  />
                  <rect
                    x="0"
                    y="0"
                    width={Math.round(profil.persen * 100)}
                    height="5"
                    rx="3"
                    fill={getPercentColorHex(profil.persen)}
                  />
                </svg>
                {profil.keterangan && (
                  <div className="text-[10px] text-slate-400 dark:text-slate-500 -mt-1 leading-normal">
                    {profil.keterangan}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Footer Row inside skills card */}
          <div className="flex items-center justify-between mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-[11px] text-slate-500 dark:text-slate-400">
            <div className="flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" />
              Selesai {formatDateTime(result.completed_at)}
            </div>
            <div>
              Raw score:{' '}
              <span className="font-semibold text-slate-800 dark:text-slate-200">{result.skor}</span>
            </div>
          </div>
        </div>

        {/* Tabel Konversi WPT → IQ */}
        <div className="mb-2 pt-1">
          <details className="group">
            <summary className="cursor-pointer text-[11px] font-medium text-slate-450 hover:text-slate-600 dark:hover:text-slate-300 flex items-center gap-1.5 select-none transition-colors">
              <span className="transition-transform group-open:rotate-90 text-[9px]">▶</span>
              Lihat Tabel Konversi WPT → IQ Lengkap
            </summary>
            <div className="mt-3 overflow-x-auto rounded-lg border border-slate-100 dark:border-slate-800 max-h-60 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead>
                  <tr className="bg-slate-50 dark:bg-slate-900 text-slate-500 sticky top-0 border-b border-slate-100 dark:border-slate-800">
                    <th className="py-2 px-3 text-left font-semibold">Raw Score</th>
                    <th className="py-2 px-3 text-left font-semibold">IQ</th>
                    <th className="py-2 px-3 text-left font-semibold">Remark</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.entries(WPT_IQ_TABLE).map(([raw, iq]) => {
                    const r = Number(raw);
                    const rm = getIqRemark(r);
                    const isActive = r === result.skor;
                    return (
                      <tr
                        key={raw}
                        className={`border-t border-slate-100 dark:border-slate-800/50 ${
                          isActive
                            ? `${rm.bg} font-semibold dark:bg-slate-800`
                            : 'hover:bg-slate-50/50 dark:hover:bg-slate-900/30'
                        }`}
                      >
                        <td className={`py-1.5 px-3 ${isActive ? rm.color : 'text-slate-600 dark:text-slate-350'}`}>
                          {r}
                          {isActive && ' ◀ Skor Kandidat'}
                        </td>
                        <td className={`py-1.5 px-3 font-semibold ${isActive ? rm.color : 'text-slate-800 dark:text-slate-200'}`}>
                          {iq}
                        </td>
                        <td className={`py-1.5 px-3 ${isActive ? rm.color : 'text-slate-400 dark:text-slate-500'}`}>
                          {r === 10
                            ? 'Dibawah Rata-rata / Hampir Cukup / Nilai 2'
                            : r === 16
                            ? 'Rata-rata / Cukup / Nilai 3'
                            : r === 21
                            ? 'Rata-rata Atas / Baik / Nilai 4'
                            : r === 25
                            ? 'Diatas Rata-rata / Sangat Baik / Nilai 5'
                            : ''}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </details>
        </div>
      </div>

      {/* Rekomendasi per Posisi */}
      <div className="bg-white dark:bg-slate-950 rounded-xl p-5 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center gap-2 mb-4">
          <CheckCircle2 className="h-5 w-5 text-slate-550 dark:text-slate-400" />
          <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-50">Rekomendasi Posisi</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 dark:border-slate-800">
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Posisi</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Skor Min</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Skor Ideal</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Status</th>
                <th className="text-left py-3 px-4 font-medium text-slate-500 dark:text-slate-400">Rekomendasi</th>
              </tr>
            </thead>
            <tbody>
              {result.rekomendasi_posisi.map((rec) => (
                <tr
                  key={rec.posisi}
                  className={`border-b border-slate-100 dark:border-slate-800 hover:bg-slate-50/50 dark:hover:bg-slate-900/30 ${
                    rec.posisi.toLowerCase().includes(posisiDilamar.toLowerCase())
                      ? 'bg-blue-50/30 dark:bg-blue-950/10'
                      : ''
                  }`}
                >
                  <td className="py-3 px-4 font-medium text-slate-850 dark:text-slate-200">
                    {rec.posisi}
                    {rec.posisi.toLowerCase().includes(posisiDilamar.toLowerCase()) && (
                      <span className="ml-2 text-xs text-blue-600 dark:text-blue-450 font-bold">
                        ← Dilamar
                      </span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{rec.skorMin}</td>
                  <td className="py-3 px-4 text-slate-700 dark:text-slate-300">{rec.skorIdeal}</td>
                  <td className="py-3 px-4">
                    <Badge className={statusColor(rec.status)}>{rec.status}</Badge>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-600 dark:text-slate-400">
                    {rec.rekomendasi}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Keputusan Final */}
      <div className="border-2 border-[hsl(350_50%_80%)] bg-[hsl(350_50%_97%)] dark:border-rose-900/40 dark:bg-rose-950/10 rounded-xl p-5">
        <div className="flex items-center gap-2 text-[hsl(350_60%_30%)] dark:text-rose-400 mb-4">
          <AlertTriangle className="h-5 w-5" />
          <h3 className="text-sm font-semibold">Keputusan Rekomendasi</h3>
        </div>
        <p className="text-sm text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
          {result.rekomendasi_posisi.find((r) =>
            r.posisi.toLowerCase().includes(posisiDilamar.toLowerCase())
          )?.rekomendasi || 'Posisi yang dilamar tidak ditemukan dalam benchmark.'}
        </p>
        <div className="mt-4 p-3 bg-white dark:bg-slate-900 rounded-lg border border-slate-100 dark:border-slate-850 text-xs text-slate-500 dark:text-slate-450">
          <strong>Catatan:</strong> Keputusan ini berdasarkan standar benchmark WPT EasyLegal.
          Keputusan akhir tetap berada pada tim HR.
        </div>
      </div>
    </div>
  );
}
