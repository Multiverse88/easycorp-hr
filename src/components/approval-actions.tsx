'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { LoadingOverlay } from '@/components/loading-overlay';

interface ApprovalActionsProps {
  id: string;
  status: string;
}

export function ApprovalActions({ id, status }: ApprovalActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Menyimpan...');

  async function handleApprove(role: 'hrga' | 'management') {
    setLoading(true);
    setLoadingMessage(role === 'hrga' ? 'Memproses verifikasi HRGA...' : 'Memproses approval management...');
    try {
      const res = await fetch('/api/manpower/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'approve', role }),
      });
      if (res.ok) {
        router.push('/dashboard/manpower');
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal approve');
        setLoading(false);
      }
    } catch {
      alert('Terjadi kesalahan');
      setLoading(false);
    }
  }

  async function handleReject() {
    setLoading(true);
    setLoadingMessage('Memproses penolakan...');
    try {
      const res = await fetch('/api/manpower/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, action: 'reject' }),
      });
      if (res.ok) {
        router.push('/dashboard/manpower');
      } else {
        const data = await res.json();
        alert(data.error || 'Gagal reject');
        setLoading(false);
      }
    } catch {
      alert('Terjadi kesalahan');
      setLoading(false);
    }
  }

  if (status === 'submitted') {
    return (
      <>
        <LoadingOverlay visible={loading} message={loadingMessage} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Approval HRGA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => handleApprove('hrga')} disabled={loading}>
                Verifikasi (HRGA)
              </Button>
              <Button onClick={handleReject} variant="destructive" disabled={loading}>
                Tolak
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  if (status === 'verified') {
    return (
      <>
        <LoadingOverlay visible={loading} message={loadingMessage} />
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Approval Management</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Button onClick={() => handleApprove('management')} disabled={loading}>
                Setujui (Management)
              </Button>
              <Button onClick={handleReject} variant="destructive" disabled={loading}>
                Tolak
              </Button>
            </div>
          </CardContent>
        </Card>
      </>
    );
  }

  return null;
}
