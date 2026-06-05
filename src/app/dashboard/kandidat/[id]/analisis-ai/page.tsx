import Link from 'next/link';
import {
  getCandidateById,
  getAiAnalysisByCandidate,
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
  getInterviewEvaluationByCandidate,
} from '@/lib/db';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { AiAnalysisClient } from '@/components/ai-analysis-client';
import { Brain, Sparkles } from 'lucide-react';

export const dynamic = 'force-dynamic';

export default async function AnalisisAiPage({ params }: { params: Promise<{ id: string }> | { id: string } }) {
  const resolvedParams = await params;
  const candidate = await getCandidateById(resolvedParams.id);

  if (!candidate) {
    return <div className="p-8 text-slate-500">Kandidat tidak ditemukan.</div>;
  }

  const [existingAnalysis, discResult, wptResult, koranResult, interviewResult] = await Promise.all([
    getAiAnalysisByCandidate(resolvedParams.id),
    getDiscTestResultByCandidate(resolvedParams.id),
    getWptTestResultByCandidate(resolvedParams.id),
    getKoranTestResultByCandidate(resolvedParams.id),
    getInterviewEvaluationByCandidate(resolvedParams.id),
  ]);

  let hasNewerData = false;
  if (existingAnalysis) {
    const analysisTime = new Date(existingAnalysis.created_at || '').getTime();

    const discTime = discResult?.completed_at ? new Date(discResult.completed_at).getTime() : 0;
    const wptTime = wptResult?.completed_at ? new Date(wptResult.completed_at).getTime() : 0;
    const koranTime = koranResult?.created_at ? new Date(koranResult.created_at).getTime() : 0;
    
    let interviewTime = 0;
    if (interviewResult?.id && interviewResult.id.startsWith('ie-')) {
      const ts = Number(interviewResult.id.substring(3));
      if (!isNaN(ts)) {
        interviewTime = ts;
      }
    }

    const maxTestTime = Math.max(discTime, wptTime, koranTime, interviewTime);
    if (maxTestTime > analysisTime + 5000) { // 5-second buffer
      hasNewerData = true;
    }
  }

  return (
    <div>
      {/* Back nav */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link
            href={`/dashboard/kandidat/${resolvedParams.id}`}
            className="text-sm text-muted-foreground hover:underline"
          >
            ← Kembali ke Detail Kandidat
          </Link>
          <div className="flex items-center gap-2 mt-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#8B2252] to-[#c0507a] flex items-center justify-center shadow-sm">
              <Brain className="w-4 h-4 text-white" />
            </div>
            <h1 className="text-2xl font-bold text-slate-800">Analisis AI</h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold rounded-full bg-purple-100 text-purple-700 border border-purple-250">
              <Sparkles className="w-3 h-3" />
              Claude Opus
            </span>
          </div>
          <p className="text-sm text-slate-500 mt-1">
            Laporan psikologi rekrutmen komprehensif untuk{' '}
            <span className="font-medium text-slate-700">{candidate.nama}</span>
          </p>
        </div>
      </div>

      <CandidateQuickActions candidateId={resolvedParams.id} />

      <div className="mt-6">
        <AiAnalysisClient
          candidateId={resolvedParams.id}
          candidateName={candidate.nama}
          initialAnalysis={existingAnalysis?.analysis}
          initialGeneratedAt={existingAnalysis?.created_at}
          hasNewerData={hasNewerData}
          hasDisc={!!discResult}
          hasWpt={!!wptResult}
          hasKoran={!!koranResult}
          hasInterview={!!interviewResult}
        />
      </div>
    </div>
  );
}
