import Link from 'next/link';
import { getCandidateById, getDiscTestResultByCandidate, getManpowerRequests } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { StatusSelector } from '@/components/status-selector';

export const dynamic = 'force-dynamic';

export default async function KandidatDetailPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const discResult = await getDiscTestResultByCandidate(params.id);
  const requests = await getManpowerRequests();
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
        <StatusSelector candidateId={params.id} currentStatus={candidate.status} />
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

      </div>
    </div>
  );
}
