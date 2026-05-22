'use client';

import { InterviewTabs } from '@/components/interview-tabs';

interface CandidateAssessmentTabsProps {
  candidateId: string;
  candidateName: string;
  position: string;
}

export function CandidateAssessmentTabs({
  candidateId,
  candidateName,
  position,
}: CandidateAssessmentTabsProps) {
  return (
    <InterviewTabs
      candidateId={candidateId}
      candidateName={candidateName}
      position={position}
    />
  );
}
