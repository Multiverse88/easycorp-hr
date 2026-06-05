import { getCandidateById, getDiscTestResultByCandidate } from '@/lib/db';
import { DiscHrView } from '@/components/disc-hr-view';
import { Card, CardContent } from '@/components/ui/card';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import Link from 'next/link';
import { Award } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function DiscHrPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const candidate = await getCandidateById(resolvedParams.id);
  if (!candidate) {
    return <div>Kandidat tidak ditemukan</div>;
  }

  const discResult = await getDiscTestResultByCandidate(resolvedParams.id);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${resolvedParams.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">DISC Test</h1>

      <CandidateQuickActions candidateId={resolvedParams.id} />

      <div className="mt-6">
        {discResult ? (
          <DiscHrView
            candidateName={candidate.nama}
            position={candidate.posisi_dilamar}
            discResult={discResult}
          />
        ) : (
          <Card>
            <CardContent className="p-8 text-center">
              <Award className="w-12 h-12 text-slate-300 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-slate-700 mb-1">Belum Ada Hasil DISC</h3>
              <p className="text-sm text-muted-foreground">Kandidat belum mengerjakan DISC test.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
