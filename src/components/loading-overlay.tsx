'use client';

import { Loader2 } from 'lucide-react';

interface LoadingOverlayProps {
  message?: string;
  visible: boolean;
}

export function LoadingOverlay({ message = 'Menyimpan data...', visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-2xl p-8 flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-200">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-4 border-pink-100" />
          <Loader2 className="w-16 h-16 text-pink-500 animate-spin absolute inset-0" />
        </div>
        <div className="text-center">
          <p className="font-semibold text-lg text-gray-800">{message}</p>
          <p className="text-sm text-muted-foreground mt-1">Mohon tunggu sebentar...</p>
        </div>
        <div className="flex gap-1 mt-2">
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-2 h-2 rounded-full bg-pink-400 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
}
