'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { usePathname } from 'next/navigation';
import { MessageSquare, Award, Brain, FileText, Sparkles, Wand2, Loader2 } from 'lucide-react';

interface CandidateQuickActionsProps {
  candidateId: string;
}

export function CandidateQuickActions({ candidateId }: CandidateQuickActionsProps) {
  const pathname = usePathname();
  const [isGenerating, setIsGenerating] = useState(false);

  const actions = [
    { href: `/dashboard/kandidat/${candidateId}/interview`, label: 'Interview', icon: MessageSquare, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/disc`, label: 'DISC Test', icon: Award, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/papikostik`, label: 'Papikostik', icon: Award, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/wpt`, label: 'Tes IQ (WPT)', icon: Brain, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/tes-koran`, label: 'Tes Koran', icon: FileText, ai: false },
    { href: `/dashboard/kandidat/${candidateId}/analisis-ai`, label: 'Analisis AI', icon: Sparkles, ai: true },
  ];

  const handleAutoFill = async () => {
    if (!confirm('Tindakan ini akan menghapus data tes sebelumnya untuk kandidat ini dan menggantinya dengan data acak. Lanjutkan?')) {
      return;
    }
    
    setIsGenerating(true);
    
    try {
      const res = await fetch('/api/dev/auto-fill-tests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ candidateId })
      });
      
      const data = await res.json();
      if (data.success) {
        alert('Data tes berhasil di-generate!');
        window.location.reload();
      } else {
        alert(data.error || 'Gagal mengisi data tes');
        setIsGenerating(false);
      }
    } catch (error) {
      console.error(error);
      alert('Terjadi kesalahan jaringan.');
      setIsGenerating(false);
    }
  };

  return (
    <div className="border border-slate-200 rounded-xl p-3 bg-white flex flex-wrap items-center gap-2">
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
      
      <div className="flex-1 min-w-[20px]" /> {/* Spacer */}
      
      <Button 
        size="sm" 
        variant="outline" 
        className="flex items-center gap-2 bg-slate-900 text-white hover:bg-slate-800 hover:text-white"
        onClick={handleAutoFill}
        disabled={isGenerating}
      >
        {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
        {isGenerating ? 'Menyusun...' : 'Auto-Fill Tests (Dev)'}
      </Button>
    </div>
  );
}
