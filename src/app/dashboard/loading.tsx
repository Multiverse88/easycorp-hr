import { Loader2 } from 'lucide-react';

export default function DashboardLoading() {
  return (
    <div className="w-full h-[80vh] flex flex-col items-center justify-center animate-in fade-in duration-700">
      <div className="relative flex items-center justify-center">
        {/* Outer glowing rings */}
        <div className="absolute inset-0 bg-[#9A0000]/5 rounded-full blur-2xl scale-[3]" />
        
        {/* Animated spinner */}
        <div className="relative bg-white rounded-2xl p-4 shadow-xl shadow-[#9A0000]/5 border border-slate-100 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#9A0000] animate-spin" strokeWidth={2.5} />
        </div>
      </div>
      
      <div className="mt-6 flex flex-col items-center gap-1.5">
        <p className="text-sm font-semibold text-slate-900 tracking-tight">Memuat Data...</p>
        <p className="text-xs text-slate-500 max-w-[200px] text-center leading-relaxed">
          Menyiapkan tampilan dashboard
        </p>
      </div>
    </div>
  );
}
