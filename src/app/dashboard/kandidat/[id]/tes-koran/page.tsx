import { getCandidateById, getKoranTestResultByCandidate } from '@/lib/db';
import { KoranTestClient } from '@/components/koran-test-client';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function TesKoranPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div className="p-8">Kandidat tidak ditemukan</div>;
  }

  const koranResult = await getKoranTestResultByCandidate(params.id);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${params.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Tes Koran (Pauli / Kraepelin)</h1>

      <KoranTestClient candidate={candidate} initialResult={koranResult} />
    </div>
  );
}
