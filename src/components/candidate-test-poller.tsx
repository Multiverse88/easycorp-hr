'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  candidateId: string;
  initialHasDisc: boolean;
  initialHasWpt: boolean;
  initialHasKoran: boolean;
}

export function CandidateTestPoller({ candidateId, initialHasDisc, initialHasWpt, initialHasKoran }: Props) {
  const router = useRouter();
  
  // Keep track of the current values using refs so we don't restart the interval on prop updates
  const stateRef = useRef({
    hasDisc: initialHasDisc,
    hasWpt: initialHasWpt,
    hasKoran: initialHasKoran,
  });

  // Update refs when props change (in case of server-side revalidation)
  useEffect(() => {
    stateRef.current = {
      hasDisc: initialHasDisc,
      hasWpt: initialHasWpt,
      hasKoran: initialHasKoran,
    };
  }, [initialHasDisc, initialHasWpt, initialHasKoran]);

  useEffect(() => {
    // If all tests are already completed, no need to poll
    if (stateRef.current.hasDisc && stateRef.current.hasWpt && stateRef.current.hasKoran) {
      return;
    }

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/candidate/test-status?candidateId=${candidateId}`);
        if (res.ok) {
          const json = await res.json();
          if (json.success) {
            const discCompletedNow = json.hasDisc && !stateRef.current.hasDisc;
            const wptCompletedNow = json.hasWpt && !stateRef.current.hasWpt;
            const koranCompletedNow = json.hasKoran && !stateRef.current.hasKoran;

            if (discCompletedNow || wptCompletedNow || koranCompletedNow) {
              console.log('Detected test completion! Refreshing candidate details...');
              // Update local ref immediately to prevent multiple refreshes
              stateRef.current = {
                hasDisc: json.hasDisc,
                hasWpt: json.hasWpt,
                hasKoran: json.hasKoran,
              };
              router.refresh();
            }
          }
        }
      } catch (err) {
        console.error('Error polling test status:', err);
      }
    }, 5000);

    return () => clearInterval(interval);
  }, [candidateId, router]);

  return null; // This is a headless background polling component
}
