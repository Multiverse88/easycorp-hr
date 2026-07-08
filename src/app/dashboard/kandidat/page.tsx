import { getCandidatesWithAnalysis } from '@/lib/db';
import { RefreshOnMount } from '@/components/refresh-on-mount';
import { KandidatListClient } from './client';

export const dynamic = 'force-dynamic';

export default async function KandidatListPage() {
  const candidates = await getCandidatesWithAnalysis();

  return (
    <div>
      <RefreshOnMount />
      <h1 className="text-2xl font-bold mb-6">Kandidat</h1>
      <KandidatListClient initialCandidates={candidates} />
    </div>
  );
}
