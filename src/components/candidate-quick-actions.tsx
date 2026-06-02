'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { ClipboardList, MessageSquare, Award, Brain } from 'lucide-react';

interface CandidateQuickActionsProps {
  candidateId: string;
}

export function CandidateQuickActions({ candidateId }: CandidateQuickActionsProps) {
  const pathname = usePathname();

  const actions = [
    { href: `/dashboard/kandidat/${candidateId}/tes-seleksi`, label: 'Tes Seleksi', icon: ClipboardList },
    { href: `/dashboard/kandidat/${candidateId}/interview`, label: 'Interview', icon: MessageSquare },
    { href: `/dashboard/kandidat/${candidateId}/disc`, label: 'DISC Test', icon: Award },
    { href: `/dashboard/kandidat/${candidateId}/wpt`, label: 'Tes IQ (WPT)', icon: Brain },
  ];

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white flex gap-2">
      {actions.map((action) => {
        const isActive = pathname === action.href;
        return (
          <Link key={action.href} href={action.href}>
            <Button
              size="sm"
              variant={isActive ? 'default' : 'outline'}
              className="flex items-center gap-2"
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
