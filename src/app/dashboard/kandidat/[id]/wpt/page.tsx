import { getCandidateById, getWptTestResultByCandidate } from '@/lib/db';
import { getUserRole } from '@/lib/supabase/server';
import { MOCK_WPT_RESULT } from '@/lib/mock-data';
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
  const userRole = await getUserRole();
  const effectiveResult = wptResult || (userRole === 'superadmin' ? MOCK_WPT_RESULT : null);

  return (
    <div>
      <Link href={`/dashboard/kandidat/${resolvedParams.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-4">Tes IQ (WPT)</h1>

      <CandidateQuickActions candidateId={resolvedParams.id} />

      <div className="mt-6 relative">
        {!wptResult && userRole === 'superadmin' && (
          <div className="absolute inset-0 z-10 bg-amber-50/20 backdrop-grayscale-[30%] pointer-events-none rounded-xl" />
        )}
        {effectiveResult ? (
          <div>
            {!wptResult && userRole === 'superadmin' && (
              <div className="mb-4 bg-amber-50 border border-amber-200 text-amber-700 px-4 py-2 rounded-md text-sm font-semibold inline-block">
                Developer Preview (Mock Data)
              </div>
            )}
            <WptHrView
              result={effectiveResult}
              candidateName={candidate.nama}
              posisiDilamar={candidate.posisi_dilamar}
            />
          </div>
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
