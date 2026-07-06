import { getCandidateById, getPapikostikTestResultByCandidate, getPapikostikSessionByCandidate } from '@/lib/db';
import { PapikostikTestClient } from '@/components/papikostik-test-client';
import { getUserRole } from '@/lib/supabase/server';

export const dynamic = 'force-dynamic';

export default async function PapikostikDetailPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const candidate = await getCandidateById(resolvedParams.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const initialResult = await getPapikostikTestResultByCandidate(resolvedParams.id);
  const digitalSession = await getPapikostikSessionByCandidate(resolvedParams.id);
  const userRole = await getUserRole();

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Papikostik - {candidate.nama}</h1>
        <p className="text-muted-foreground">Analisis Kepribadian PAPI Kostick</p>
      </div>

      <PapikostikTestClient 
        candidate={candidate} 
        initialResult={initialResult} 
        digitalSession={digitalSession}
        userRole={userRole}
      />
    </div>
  );
}
