import Link from 'next/link';
import { getCandidateById } from '@/lib/db';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { AiAnalysisClient } from '@/components/ai-analysis-client';
import { Brain, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalisisAiPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);

  if (!candidate) {
    return <div className="p-8 text-slate-500">Kandidat tidak ditemukan.</div>;
  }

  return (
    <div>
      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/dashboard/kandidat/${params.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Kembali ke Detail Kandidat
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B2252] to-[#c0507a] flex items-center justify-center shadow-sm">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Analisis AI</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              <Sparkles className="w-3 h-3" />
              Claude Sonnet
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Laporan psikologi rekrutmen komprehensif untuk{' '}
            <span className="font-medium text-slate-700">{candidate.nama}</span>
          </p>
        </div>
      </div>

      <CandidateQuickActions candidateId={params.id} />

      <div className="mt-6">
        <AiAnalysisClient
          candidateId={params.id}
          candidateName={candidate.nama}
        />
      </div>
    </div>
  );
}
