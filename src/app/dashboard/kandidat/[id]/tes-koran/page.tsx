import { getCandidateById, getKoranTestResultByCandidate } from '@/lib/db';
import { KoranTestClient } from '@/components/koran-test-client';
import Link from 'next/link';
import { MOCK_KORAN_RESULT } from '@/lib/mock-data';
import { getUserRole } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function TesKoranPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  
  const [candidate, koranResult, userRole] = await Promise.all([
    getCandidateById(resolvedParams.id),
    getKoranTestResultByCandidate(resolvedParams.id),
    getUserRole()
  ]);

  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const isDevOrAdmin = userRole === 'superadmin' || userRole === 'developer';
  const displayResult = koranResult || (isDevOrAdmin ? MOCK_KORAN_RESULT : null);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${resolvedParams.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Tes Koran (Pauli / Kraepelin)</h1>

      <KoranTestClient candidate={candidate} initialResult={displayResult as any} userRole={userRole || 'hr'} />
    </div>
  );
}
