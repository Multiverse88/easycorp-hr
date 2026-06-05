import { getCandidateById, getWptTestResultByCandidate } from '@/lib/db';
import { WptHrView } from '@/components/wpt-hr-view';
import { Card, CardContent } from '@/components/ui/card';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import Link from 'next/link';
import { Brain } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function WptHrPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const candidate = await getCandidateById(resolvedParams.id);
  if (!candidate) {
    return <div>Kandidat tidak ditemukan</div>;
  }

  const wptResult = await getWptTestResultByCandidate(resolvedParams.id);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${resolvedParams.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Tes IQ (WPT)</h1>

      <CandidateQuickActions candidateId={resolvedParams.id} />

      <div className="mt-6">
        {wptResult ? (
          <WptHrView
            result={wptResult}
            candidateName={candidate.nama}
            posisiDilamar={candidate.posisi_dilamar}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Brain className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">Belum Ada Hasil WPT</h3>
              <p className="text-sm text-muted-foreground">Kandidat belum mengerjakan tes IQ (WPT).</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
