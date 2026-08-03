import Link from 'next/link';
import { Brain, FileText, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import {
  getCandidateById,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getInterviewEvaluationByCandidate,
  getPapikostikTestResultByCandidate,
  getPapikostikSessionByCandidate,
  getManpowerRequests,
} from '@/lib/db';
import { getUserRole } from '@/lib/auth';
import { MOCK_DISC_RESULT, MOCK_WPT_RESULT, MOCK_PAPIKOSTIK_RESULTS } from '@/lib/mock-data';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { StatusSelector } from '@/components/status-selector';
import { DownloadCandidatePdf } from '@/components/download-candidate-pdf';
import { ShareInvitation } from '@/components/share-invitation';
import { CandidateTestPoller } from '@/components/candidate-test-poller';

export const dynamic = 'force-dynamic';

export default async function KandidatDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const candidate = await getCandidateById(resolvedParams.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const [discResult, wptResult, koranResult, interviewResult, papikostikResult, papikostikSession, requests, userRole] = await Promise.all([
    getDiscTestResultByCandidate(resolvedParams.id),
    getWptTestResultByCandidate(resolvedParams.id),
    getKoranTestResultByCandidate(resolvedParams.id),
    getInterviewEvaluationByCandidate(resolvedParams.id),
    getPapikostikTestResultByCandidate(resolvedParams.id),
    getPapikostikSessionByCandidate(resolvedParams.id),
    getManpowerRequests(),
    getUserRole(),
  ]);
  const request = requests.find(r => r.id === candidate.manpower_request_id);

  const effectiveDiscResult = discResult || (userRole === 'superadmin' ? MOCK_DISC_RESULT : null);
  const effectiveWptResult = wptResult || (userRole === 'superadmin' ? MOCK_WPT_RESULT : null);

  const hasPapikostik = papikostikResult || (papikostikSession && papikostikSession.status === 'COMPLETED') || userRole === 'superadmin';
  const papikostikData = papikostikResult?.results || papikostikSession?.results || (userRole === 'superadmin' && !papikostikResult && (!papikostikSession || papikostikSession.status !== 'COMPLETED') ? MOCK_PAPIKOSTIK_RESULTS : null);

  return (
    <div>
      <CandidateTestPoller
        candidateId={resolvedParams.id}
        initialHasDisc={!!discResult}
        initialHasWpt={!!wptResult}
        initialHasKoran={!!koranResult}
      />
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/kandidat" className="text-sm text-muted-foreground hover:underline">
            &larr; Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Kandidat</h1>
        </div>
        <div className="flex items-center gap-2">
          <DownloadCandidatePdf
            candidateId={resolvedParams.id}
            candidateName={candidate.nama}
            hasDisc={!!discResult}
            hasWpt={!!wptResult}
            hasKoran={!!koranResult}
            hasInterview={!!interviewResult}
          />
          <StatusSelector candidateId={resolvedParams.id} currentStatus={candidate.status} />
        </div>
      </div>

      <CandidateQuickActions candidateId={resolvedParams.id} />

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
              <div className="text-sm text-muted-foreground mb-1.5">Token Akses Tes</div>
              <div className="flex flex-col gap-2">
                <Link href={`https://disc.easyai.id/disc/${candidate.token}`} target="_blank">
                  <Button variant="outline" className="font-mono font-bold text-blue-700 bg-blue-50 border-blue-200 hover:bg-blue-100 w-fit cursor-pointer flex items-center gap-2">
                    {candidate.token}
                    <span className="text-xs font-normal">→ Buka Web Ujian</span>
                  </Button>
                </Link>
                <div className="mt-1">
                  <ShareInvitation candidate={candidate} />
                </div>
              </div>
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

        {effectiveDiscResult && (
          <Card className={`lg:col-span-2 relative ${!discResult && userRole === 'superadmin' ? 'border-amber-200 bg-amber-50/20' : ''}`}>
            {!discResult && userRole === 'superadmin' && (
              <div className="absolute inset-0 z-10 bg-amber-50/20 backdrop-grayscale-[30%] pointer-events-none rounded-xl" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>
                  Hasil DISC Test
                  {!discResult && userRole === 'superadmin' && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Mock Data</Badge>
                  )}
                </CardTitle>
                <Link href={`/dashboard/kandidat/${resolvedParams.id}/disc`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{effectiveDiscResult.persen_d}%</div>
                  <div className="text-sm text-muted-foreground">D (Dominance)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{effectiveDiscResult.persen_i}%</div>
                  <div className="text-sm text-muted-foreground">I (Influence)</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{effectiveDiscResult.persen_s}%</div>
                  <div className="text-sm text-muted-foreground">S (Steadiness)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{effectiveDiscResult.persen_c}%</div>
                  <div className="text-sm text-muted-foreground">C (Conscientiousness)</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipe Primer: </span>
                  <span className="font-medium">{effectiveDiscResult.tipe_primer}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tipe Sekunder: </span>
                  <span className="font-medium">{effectiveDiscResult.tipe_sekunder}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {hasPapikostik && (
          <Card className={`lg:col-span-2 relative ${userRole === 'superadmin' && !papikostikResult && (!papikostikSession || papikostikSession.status !== 'COMPLETED') ? 'border-amber-200 bg-amber-50/20' : ''}`}>
            {userRole === 'superadmin' && !papikostikResult && (!papikostikSession || papikostikSession.status !== 'COMPLETED') && (
              <div className="absolute inset-0 z-10 bg-amber-50/20 backdrop-grayscale-[30%] pointer-events-none rounded-xl" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-indigo-600" />
                  Hasil Papikostik
                  {userRole === 'superadmin' && !papikostikResult && (!papikostikSession || papikostikSession.status !== 'COMPLETED') && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Mock Data</Badge>
                  )}
                </CardTitle>
                <Link href={`/dashboard/kandidat/${resolvedParams.id}/papikostik`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-sm text-muted-foreground mb-4">
                {papikostikResult 
                  ? <span>Diekstrak dari: <strong className="text-slate-700">{papikostikResult.nama_file}</strong></span>
                  : <span>Selesai via <strong>Digital Assessment</strong></span>}
              </div>
              
              {papikostikData && Array.isArray(papikostikData) && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                  {/* Show top 4 highest scoring traits */}
                  {[...papikostikData]
                    .sort((a, b) => (b.skor || b.score) - (a.skor || a.score))
                    .slice(0, 4)
                    .map((r: any, idx: number) => (
                      <div key={idx} className="bg-indigo-50 border border-indigo-100 rounded-lg p-3 text-center">
                        <div className="text-2xl font-bold text-indigo-700">{r.skor || r.score}</div>
                        <div className="text-xs font-semibold text-slate-700 mt-1 uppercase tracking-wider">{r.kode || r.code}</div>
                        <div className="text-[10px] text-muted-foreground mt-0.5 truncate">{r.aspek || r.name}</div>
                      </div>
                  ))}
                </div>
              )}

              <div className="flex gap-4">
                <Link href={`/dashboard/kandidat/${resolvedParams.id}/papikostik`}>
                  <Button variant="default" size="sm" className="bg-indigo-600 hover:bg-indigo-700">Lihat Semua 20 Aspek &rarr;</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        )}

        {effectiveWptResult && (
          <Card className={`lg:col-span-2 relative ${!wptResult && userRole === 'superadmin' ? 'border-amber-200 bg-amber-50/20' : ''}`}>
            {!wptResult && userRole === 'superadmin' && (
              <div className="absolute inset-0 z-10 bg-amber-50/20 backdrop-grayscale-[30%] pointer-events-none rounded-xl" />
            )}
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  Hasil Tes IQ (WPT)
                  {!wptResult && userRole === 'superadmin' && (
                    <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Mock Data</Badge>
                  )}
                </CardTitle>
                <Link href={`/dashboard/kandidat/${resolvedParams.id}/wpt`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600">{effectiveWptResult.skor}<span className="text-sm text-slate-400">/{effectiveWptResult.total_soal}</span></div>
                  <div className="text-sm text-muted-foreground">Skor</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{Math.round(effectiveWptResult.persen_benar * 100)}%</div>
                  <div className="text-sm text-muted-foreground">Benar</div>
                </div>
                <div className="text-center p-4 bg-slate-50 rounded-lg">
                  <Badge className={
                    effectiveWptResult.kategori === 'Superior' ? 'bg-purple-100 text-purple-700' :
                    effectiveWptResult.kategori === 'Sangat Baik' ? 'bg-green-100 text-green-700' :
                    effectiveWptResult.kategori === 'Baik' ? 'bg-blue-100 text-blue-700' :
                    effectiveWptResult.kategori === 'Cukup' ? 'bg-yellow-100 text-yellow-700' :
                    'bg-red-100 text-red-700'
                  }>
                    {effectiveWptResult.kategori}
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
                <Link href={`/dashboard/kandidat/${resolvedParams.id}/tes-koran`}>
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

        {/* Resume Evaluasi promo card */}
        <div className="mt-12 mb-6">
          <div className="bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50 p-6 rounded-2xl border border-indigo-100 flex items-start gap-4 shadow-sm">
            <div className="bg-white p-3 rounded-xl shadow-sm">
              <FileText className="w-8 h-8 text-indigo-600" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <Sparkles className="w-4 h-4 text-indigo-500" />
                <h3 className="font-semibold text-slate-800">Resume Evaluasi Komprehensif</h3>
              </div>
              <p className="text-sm text-slate-600 mb-4 max-w-2xl leading-relaxed">
                Dapatkan resume evaluasi rekrutmen mendalam yang mengintegrasikan semua data tes dan interview kandidat ini secara otomatis (Algoritma Sistem).
              </p>
              <Link href={`/dashboard/kandidat/${resolvedParams.id}/analisis-ai`}>
                <Button className="bg-indigo-600 hover:bg-indigo-700 text-white flex items-center gap-2">
                  <Sparkles className="w-4 h-4" />
                  Buat Resume Evaluasi
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
