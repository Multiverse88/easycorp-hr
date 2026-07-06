import { getCandidateById, getDiscTestResultByCandidate } from '@/lib/db';
import { getUserRole } from '@/lib/supabase/server';
import { MOCK_DISC_RESULT } from '@/lib/mock-data';
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
  const userRole = await getUserRole();
  const effectiveResult = discResult || (userRole === 'superadmin' ? MOCK_DISC_RESULT : null);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${resolvedParams.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">DISC Test</h1>

      <CandidateQuickActions candidateId={resolvedParams.id} />

      <div className="mt-6 relative">
        {!discResult && userRole === 'superadmin' && (
          <div className="absolute inset-0 z-10 bg-amber-50/20 backdrop-grayscale-[30%] pointer-events-none rounded-xl" />
        )}
        {effectiveResult ? (
          <div>
            {!discResult && userRole === 'superadmin' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md text-sm font-semibold inline-block">
                Developer Preview (Mock Data)
              </div>
            )}
            <DiscHrView
              candidateName={candidate.nama}
              position={candidate.posisi_dilamar}
              discResult={effectiveResult}
            />
          </div>
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
