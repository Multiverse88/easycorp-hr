import Link from 'next/link';
import { Brain, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getManpowerRequests,
} from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { StatusSelector } from '@/components/status-selector';
import { DownloadCandidatePdf } from '@/components/download-candidate-pdf';
import { ShareInvitation } from '@/components/share-invitation';

export const dynamic = 'force-dynamic';

export default async function KandidatDetailPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const [discResult, wptResult, koranResult, requests] = await Promise.all([
    getDiscTestResultByCandidate(params.id),
    getWptTestResultByCandidate(params.id),
    getKoranTestResultByCandidate(params.id),
    getManpowerRequests(),
  ]);
  const request = requests.find(r => r.id === candidate.manpower_request_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/kandidat" className="text-sm text-muted-foreground hover:underline">
            &larr; Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Kandidat</h1>
        </div>
        <div className="flex items-center gap-2">
          <DownloadCandidatePdf candidateId={params.id} />
          <StatusSelector candidateId={params.id} currentStatus={candidate.status} />
        </div>
      </div>

      <CandidateQuickActions candidateId={params.id} />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Nama Lengkap</div>
              <div className="font-medium">{candidate.nama}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{candidate.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Telepon</div>
              <div className="font-medium">{candidate.telepon}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Posisi Dilamar</div>
              <div className="font-medium">{candidate.posisi_dilamar}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Token</div>
              <div className="flex items-center gap-2">
                <code className="bg-slate-100 px-3 py-1.5 rounded-lg text-sm font-mono font-bold">{candidate.token}</code>
              </div>
              <div className="text-xs text-muted-foreground mt-1">
                Link untuk kandidat: /masuk atau /disc/{candidate.token}
              </div>
              <ShareInvitation candidate={candidate} />
            </div>
            {request && (
              <div>
                <div className="text-sm text-muted-foreground">Request Terkait</div>
                <Link href={`/dashboard/manpower/${request.id}`} className="text-blue-600 hover:underline">
                  {request.no_request} - {request.posisi}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biodata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Pendidikan</div>
              <div className="font-medium">{candidate.pendidikan || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pengalaman</div>
              <div className="font-medium">{candidate.pengalaman || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Keahlian</div>
              <div className="font-medium">{candidate.keahlian || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {discResult && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hasil DISC Test</CardTitle>
                <Link href={`/dashboard/kandidat/${params.id}/disc`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{discResult.persen_d}%</div>
                  <div className="text-sm text-muted-foreground">D (Dominance)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{discResult.persen_i}%</div>
                  <div className="text-sm text-muted-foreground">I (Influence)</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{discResult.persen_s}%</div>
                  <div className="text-sm text-muted-foreground">S (Steadiness)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{discResult.persen_c}%</div>
                  <div className="text-sm text-muted-foreground">C (Conscientiousness)</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipe Primer: </span>
                  <span className="font-medium">{discResult.tipe_primer}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tipe Sekunder: </span>
                  <span className="font-medium">{discResult.tipe_sekunder}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {wptResult && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Hasil Tes IQ (WPT)
                </CardTitle>
                <Link href={`/dashboard/kandidat/${params.id}/wpt`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{wptResult.skor}<span className="text-sm text-slate-400">/{wptResult.total_soal}</span></div>
                  <div className="text-sm text-muted-foreground">Skor</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(wptResult.persen_benar * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Benar</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Badge className={
                    wptResult.kategori === 'Superior' ? 'bg-purple-100 text-purple-700' :
                    wptResult.kategori === 'Sangat Baik' ? 'bg-green-100 text-green-700' :
                    wptResult.kategori === 'Baik' ? 'bg-blue-100 text-blue-700' :
                    wptResult.kategori === 'Cukup' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {wptResult.kategori}
                  </Badge>
                  <div className="text-sm text-muted-foreground mt-1">Kategori</div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {koranResult && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-emerald-600" />
                  Hasil Tes Koran (Pauli/Kraepelin)
                </CardTitle>
                <Link href={`/dashboard/kandidat/${params.id}/tes-koran`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-emerald-50/60 rounded-xl border border-emerald-100">
                  <div className="text-base font-bold text-emerald-800 line-clamp-1">{koranResult.nama_file}</div>
                  <div className="text-[10px] text-emerald-600 font-medium mt-0.5">Nama Asesmen</div>
                </div>
                <div className="text-center p-3 bg-blue-50/60 rounded-xl border border-blue-100">
                  <div className="text-base font-bold text-blue-800">{koranResult.analysis_result.rekomendasi}</div>
                  <div className="text-[10px] text-blue-600 font-medium mt-0.5">Rekomendasi AI</div>
                </div>
                <div className="text-center p-3 bg-slate-50 rounded-xl border">
                  <Badge className={
                    koranResult.analysis_result.rekomendasi === 'Lulus' ? 'bg-green-100 text-green-700' :
                    koranResult.analysis_result.rekomendasi === 'Dipertimbangkan' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {koranResult.analysis_result.rekomendasi}
                  </Badge>
                  <div className="text-[10px] text-slate-500 font-medium mt-1">Kesimpulan</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">
                {koranResult.analysis_result.reasoning}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Analisis AI promo card */}
        <Card className="lg:col-span-2 border-2 border-[#8B2252]/20 bg-gradient-to-r from-[#8B2252]/5 to-purple-50/50 shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B2252] to-[#c0507a] flex items-center justify-center shadow-md flex-shrink-0">
                  <Sparkles className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-slate-800">Analisis AI Komprehensif</h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#8B2252] text-white font-medium">Claude Sonnet</span>
                  </div>
                  <p className="text-sm text-slate-600">
                    Dapatkan laporan psikologi rekrutmen mendalam yang mengintegrasikan semua data tes dan interview kandidat ini secara otomatis.
                  </p>
                </div>
              </div>
              <Link href={`/dashboard/kandidat/${params.id}/analisis-ai`} className="ml-4 flex-shrink-0">
                <Button className="bg-gradient-to-r from-[#8B2252] to-[#c0507a] text-white hover:opacity-90 flex items-center gap-2 shadow-sm">
                  <Sparkles className="w-4 h-4" />
                  Jalankan Analisis
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
