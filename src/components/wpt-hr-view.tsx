'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Brain, CheckCircle2, AlertTriangle, TrendingUp } from 'lucide-react';
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

export function WptHrView({ result, candidateName, posisiDilamar }: WptHrViewProps) {
  return (
    <div className="space-y-6">
      {/* Ringkasan Skor */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5" />
            Hasil Tes IQ (WPT) — {candidateName}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-slate-50 rounded-xl p-4 text-center border">
              <p className="text-xs text-slate-500 font-medium mb-1">Skor Total</p>
              <p className="text-3xl font-extrabold text-slate-900">{result.skor}<span className="text-base text-slate-400">/{result.total_soal}</span></p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center border">
              <p className="text-xs text-slate-500 font-medium mb-1">Persentase Benar</p>
              <p className="text-3xl font-extrabold text-slate-900">{Math.round(result.persen_benar * 100)}%</p>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center border">
              <p className="text-xs text-slate-500 font-medium mb-1">Kategori</p>
              <Badge className={`${kategoriColor(result.kategori)} text-sm font-bold mt-1`}>
                {result.kategori}
              </Badge>
            </div>
            <div className="bg-slate-50 rounded-xl p-4 text-center border">
              <p className="text-xs text-slate-500 font-medium mb-1">Waktu Selesai</p>
              <p className="text-sm font-bold text-slate-700">{formatDateTime(result.completed_at)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Profil Kemampuan per Kategori */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Profil Kemampuan per Kategori
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {result.profil_kemampuan.map((profil) => (
              <div key={profil.category}>
                <div className="flex justify-between items-center mb-1">
                  <span className="text-sm font-medium text-slate-700">{profil.category}</span>
                  <span className="text-xs font-bold text-slate-500">
                    {profil.benar}/{profil.total} benar ({Math.round(profil.persen * 100)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-3">
                  <div
                    className={`${profilColor(profil.persen)} h-3 rounded-full transition-all`}
                    style={{ width: `${Math.round(profil.persen * 100)}%` }}
                  />
                </div>
                <span className="text-xs text-slate-400">{profil.keterangan}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Rekomendasi per Posisi */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5" />
            Rekomendasi Posisi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Posisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Skor Min</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Skor Ideal</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Rekomendasi</th>
                </tr>
              </thead>
              <tbody>
                {result.rekomendasi_posisi.map((rec) => (
                  <tr key={rec.posisi} className={`border-b hover:bg-slate-50 ${rec.posisi.toLowerCase().includes(posisiDilamar.toLowerCase()) ? 'bg-blue-50' : ''}`}>
                    <td className="py-3 px-4 font-medium">
                      {rec.posisi}
                      {rec.posisi.toLowerCase().includes(posisiDilamar.toLowerCase()) && (
                        <span className="ml-2 text-xs text-blue-600 font-bold">← Dilamar</span>
                      )}
                    </td>
                    <td className="py-3 px-4">{rec.skorMin}</td>
                    <td className="py-3 px-4">{rec.skorIdeal}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColor(rec.status)}>{rec.status}</Badge>
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">{rec.rekomendasi}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Keputusan Final */}
      <Card className="border-2 border-[hsl(350_50%_80%)] bg-[hsl(350_50%_97%)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-[hsl(350_60%_30%)]">
            <AlertTriangle className="h-5 w-5" />
            Keputusan Rekomendasi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-slate-800 font-medium leading-relaxed">
            {result.rekomendasi_posisi.find(r => r.posisi.toLowerCase().includes(posisiDilamar.toLowerCase()))?.rekomendasi || 'Posisi yang dilamar tidak ditemukan dalam benchmark.'}
          </p>
          <div className="mt-4 p-3 bg-white rounded-lg border text-xs text-slate-500">
            <strong>Catatan:</strong> Keputusan ini berdasarkan standar benchmark WPT EasyLegal. Keputusan akhir tetap berada pada tim HR.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
