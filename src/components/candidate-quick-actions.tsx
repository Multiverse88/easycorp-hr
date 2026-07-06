'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { MessageSquare, Award, Brain, FileText, Sparkles } from 'lucide-react';

interface CandidateQuickActionsProps {
  candidateId: string;
}

export function CandidateQuickActions({ candidateId }: CandidateQuickActionsProps) {
  const pathname = usePathname();

  const actions = [
    { href: `/dashboard/kandidat/${candidateId}/interview`, label: 'Interview', icon: MessageSquare, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/disc`, label: 'DISC Test', icon: Award, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/papikostik`, label: 'Papikostik', icon: Award, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/wpt`, label: 'Tes IQ (WPT)', icon: Brain, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/tes-koran`, label: 'Tes Koran', icon: FileText, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/analisis-ai`, label: 'Analisis AI', icon: Sparkles, ai: true },
  ];

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-wrap gap-2">
      {actions.map((action) => {
        const isActive = pathname === action.href;
        const isAi = action.ai;
        return (
          <Link key={action.href} href={action.href}>
            <Button
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              className={
                isAi
                  ? isActive
                    ? 'flex items-center gap-2 bg-gradient-to-r from-[#8B2252] to-[#c0507a] text-white border-0 shadow-sm'
                    : 'flex items-center gap-2 border-[#8B2252]/40 text-[#8B2252] hover:bg-[#8B2252]/5'
                  : 'flex items-center gap-2'
              }
            >
              <action.icon className="w-4 h-4" />
              {action.label}
            </Button>
          </Link>
        );
      })}
    </div>
  );
}
