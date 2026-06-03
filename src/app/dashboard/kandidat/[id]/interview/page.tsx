import { getCandidateById, getInterviewEvaluationByCandidate } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { InterviewTabs } from '@/components/interview-tabs';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { FileDown } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function InterviewPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const evaluation = await getInterviewEvaluationByCandidate(params.id);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${params.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Evaluasi Interview</h1>

      <CandidateQuickActions candidateId={params.id} />

      <div className="mt-6">
        {evaluation ? (
          <InterviewEvaluationResult evaluation={evaluation} candidateName={candidate.nama} position={candidate.posisi_dilamar} candidateId={params.id} />
        ) : (
          <InterviewTabs
            candidateId={params.id}
            candidateName={candidate.nama}
            position={candidate.posisi_dilamar}
          />
        )}
      </div>
    </div>
  );
}

function InterviewEvaluationResult({
  evaluation,
  candidateName,
  position,
  candidateId,
}: {
  evaluation: {
    tanggal: string;
    tahap: string;
    interviewer: string;
    metode: string;
    ekspektasi_gaji: number;
    ketersediaan_bergabung: string;
    penilaian: { aspek: string; skor: number; catatan: string }[];
    total_skor: number;
    kelebihan: string;
    area_digali: string;
    catatan: string;
    rekomendasi: string;
  };
  candidateName: string;
  position: string;
  candidateId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Evaluasi Interview</CardTitle>
            <div className="text-sm text-muted-foreground mt-1">
              Kandidat: {candidateName} · Posisi: {position}
            </div>
          </div>
          <Link href={`/api/export/interview?candidateId=${candidateId}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <FileDown className="w-4 h-4" />
              Download Form
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Info Umum */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Tanggal</div>
            <div className="font-medium">{evaluation.tanggal}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Tahap</div>
            <Badge>{evaluation.tahap}</Badge>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Pewawancara</div>
            <div className="font-medium">{evaluation.interviewer}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Metode</div>
            <Badge variant="outline">{evaluation.metode}</Badge>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Ekspektasi Gaji</div>
            <div className="font-medium">Rp {evaluation.ekspektasi_gaji?.toLocaleString('id-ID') || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground">Ketersediaan Bergabung</div>
            <div className="font-medium">{evaluation.ketersediaan_bergabung || '-'}</div>
          </div>
        </div>

        {/* Tabel Penilaian */}
        <div>
          <div className="text-sm font-medium text-muted-foreground mb-2">Penilaian</div>
          <div className="border rounded-lg overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="text-left py-2 px-3 font-medium">Aspek</th>
                  <th className="text-center py-2 px-3 font-medium">Skor</th>
                  <th className="text-left py-2 px-3 font-medium">Catatan</th>
                </tr>
              </thead>
              <tbody>
                {evaluation.penilaian.map((p, i) => (
                  <tr key={i} className="border-t">
                    <td className="py-2 px-3 font-medium">{p.aspek}</td>
                    <td className="text-center py-2 px-3">
                      <Badge className={
                        p.skor >= 4 ? 'bg-green-100 text-green-800' :
                          p.skor >= 3 ? 'bg-blue-100 text-blue-800' :
                            p.skor >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                      }>
                        {p.skor}/5
                      </Badge>
                    </td>
                    <td className="py-2 px-3">{p.catatan || '-'}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t">
                  <td className="py-2 px-3 font-bold">Total Skor</td>
                  <td className="py-2 px-3 text-center font-bold text-lg">{evaluation.total_skor}</td>
                  <td className="py-2 px-3 text-sm text-muted-foreground">Maksimal: {evaluation.penilaian.length * 5}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        {/* Kelebihan & Area Digali */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="text-sm text-muted-foreground mb-1">Kelebihan</div>
            <div className="bg-green-50 p-3 rounded-lg text-sm">{evaluation.kelebihan || '-'}</div>
          </div>
          <div>
            <div className="text-sm text-muted-foreground mb-1">Area yang Perlu Digali</div>
            <div className="bg-yellow-50 p-3 rounded-lg text-sm">{evaluation.area_digali || '-'}</div>
          </div>
        </div>

        {/* Catatan */}
        {evaluation.catatan && (
          <div>
            <div className="text-sm text-muted-foreground mb-1">Catatan Pewawancara</div>
            <div className="bg-slate-50 p-3 rounded-lg text-sm">{evaluation.catatan}</div>
          </div>
        )}

        {/* Rekomendasi */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <div className="text-sm text-muted-foreground mb-1">Rekomendasi</div>
          <div className="text-xl font-bold text-blue-900">{evaluation.rekomendasi}</div>
        </div>
      </CardContent>
    </Card>
  );
}
