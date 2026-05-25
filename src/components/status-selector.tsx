'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { statusColor, statusLabel } from '@/lib/utils';
import { LoadingOverlay } from '@/components/loading-overlay';

const STATUSES = ['interview_user', 'offering', 'reject'] as const;

interface StatusSelectorProps {
  candidateId: string;
  currentStatus: string;
}

export function StatusSelector({ candidateId, currentStatus }: StatusSelectorProps) {
  const [status, setStatus] = useState(currentStatus);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  async function handleChange(newStatus: string) {
    if (newStatus === status) return;
    setLoading(true);
    setError('');

    const startTime = Date.now();
    try {
      const res = await fetch('/api/candidate/status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: candidateId, status: newStatus }),
      });

      // Tunggu minimal 800ms agar loading tidak "kedip"
      const elapsed = Date.now() - startTime;
      if (elapsed < 800) {
        await new Promise(resolve => setTimeout(resolve, 800 - elapsed));
      }

      if (!res.ok) {
        const errData = await res.json().catch(() => null);
        setError(errData?.error || `Error ${res.status}`);
        return;
      }

      const data = await res.json();
      if (!data || data.error) {
        setError(data?.error || 'Gagal menyimpan');
        return;
      }

      setStatus(newStatus);
      // Refresh cache agar halaman list juga ter-update
      router.refresh();
    } catch (err) {
      console.error('Gagal mengubah status:', err);
      setError('Terjadi kesalahan koneksi');
    }
    setLoading(false);
  }

  return (
    <div className="flex items-center gap-3">
      <LoadingOverlay visible={loading} message="Menyimpan status..." />
      <label className="text-sm text-muted-foreground">Status:</label>
      <select
        value={status}
        onChange={(e) => handleChange(e.target.value)}
        className="flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm font-medium cursor-pointer"
      >
        {STATUSES.map((s) => (
          <option key={s} value={s}>
            {statusLabel(s)}
          </option>
        ))}
      </select>
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusColor(status)}`}>
        {statusLabel(status)}
      </span>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
