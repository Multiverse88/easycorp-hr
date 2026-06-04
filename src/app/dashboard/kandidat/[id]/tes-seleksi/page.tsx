import {
  getCandidateById,
  getSelectionTestResultByCandidate,
  getWptTestResultByCandidate,
  getDiscTestResultByCandidate,
} from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SelectionTestFormClient } from '@/components/selection-test-form';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { FileDown, Brain } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TesSeleksiPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const [testResult, wptResult, discResult] = await Promise.all([
    getSelectionTestResultByCandidate(params.id),
    getWptTestResultByCandidate(params.id),
    getDiscTestResultByCandidate(params.id),
  ]);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${params.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Tes Seleksi</h1>

      <CandidateQuickActions candidateId={params.id} />

      {/* Online Test Results Summary Alert */}
      {(wptResult || discResult) && (
        <div className="mt-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-sm flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center">
          <div className="flex items-center gap-2.5">
            <Brain className="w-5 h-5 text-blue-600" />
            <div>
              <span className="font-bold text-blue-900 block">Hasil Asesmen Online Tersedia</span>
              <span className="text-xs text-blue-700">
                {wptResult ? `WPT (IQ): ${wptResult.skor}/50 (${wptResult.kategori})` : 'WPT belum selesai'}
                {' · '}
                {discResult ? `DISC: ${discResult.tipe_primer.split('—')[0].trim()}` : 'DISC belum selesai'}
              </span>
            </div>
          </div>
          <div className="flex gap-2">
            {wptResult && (
              <Link href={`/dashboard/kandidat/${params.id}/wpt`}>
                <Button size="xs" variant="outline" className="text-xs bg-white">Detail WPT</Button>
              </Link>
            )}
            {discResult && (
              <Link href={`/dashboard/kandidat/${params.id}/disc`}>
                <Button size="xs" variant="outline" className="text-xs bg-white">Detail DISC</Button>
              </Link>
            )}
          </div>
        </div>
      )}

      <div className="mt-6">
        {testResult ? (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Hasil Tes Seleksi</CardTitle>
                  <div className="text-sm text-muted-foreground mt-1">
                    Tanggal Tes: {testResult.tanggal_tes} · Penyelenggara: {testResult.penyelenggara}
                  </div>
                </div>
                <Link href={`/api/export/selection-test?candidateId=${params.id}`}>
                  <Button variant="outline" className="flex items-center gap-2">
                    <FileDown className="w-4 h-4" />
                    Download Form
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3">Komponen Tes</th>
                      <th className="text-center py-2 px-3">Nilai</th>
                      <th className="text-center py-2 px-3">Batas Lulus</th>
                      <th className="text-left py-2 px-3">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {testResult.komponen.map((k, i) => {
                      let nilai = k.nilai;
                      let catatan = k.catatan;
                      if (k.nama === 'Psikotes/DISC' && (!nilai || nilai === '-')) {
                        const parts = [];
                        if (wptResult) parts.push(`WPT: ${wptResult.skor}/50 (${wptResult.kategori})`);
                        if (discResult) parts.push(`DISC: ${discResult.tipe_primer.split('—')[0].trim()}`);
                        if (parts.length > 0) {
                          nilai = parts.join(' | ');
                          catatan = catatan || 'Diambil otomatis dari hasil tes online';
                        }
                      }
                      return (
                        <tr key={i} className="border-b">
                          <td className="py-2 px-3 font-medium">{k.nama}</td>
                          <td className="text-center py-2 px-3">{nilai || '-'}</td>
                          <td className="text-center py-2 px-3">{k.batas_lulus || '-'}</td>
                          <td className="py-2 px-3">{catatan || '-'}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Kesimpulan: </span>
                  <Badge>{testResult.kesimpulan}</Badge>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Catatan Akhir: </span>
                  <span>{testResult.catatan_akhir || '-'}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <SelectionTestFormClient
            candidateId={params.id}
            candidateName={candidate.nama}
            position={candidate.posisi_dilamar}
            wptResult={wptResult}
            discResult={discResult}
          />
        )}
      </div>
    </div>
  );
}
