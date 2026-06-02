'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Download } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

interface DownloadCandidatePdfProps {
  candidateId: string;
}

export function DownloadCandidatePdf({ candidateId }: DownloadCandidatePdfProps) {
  const [loading, setLoading] = useState(false);

  async function handleDownload() {
    setLoading(true);
    try {
      const res = await fetch(`/api/export/candidate-pdf?candidateId=${candidateId}`);
      if (!res.ok) {
        const err = await res.json().catch(() => null);
        alert(err?.error || 'Gagal download PDF');
        return;
      }
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      // Parse filename from Content-Disposition header
      const disposition = res.headers.get('Content-Disposition') || '';
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/);
      const filename = filenameMatch ? filenameMatch[1] : 'Data-Kandidat.pdf';
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (err) {
      console.error('Download error:', err);
      alert('Terjadi kesalahan saat download');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <LoadingOverlay visible={loading} message="Generating PDF..." />
      <Button variant="outline" size="sm" onClick={handleDownload} disabled={loading}>
        <Download className="w-4 h-4 mr-2" />
        Download Data Kandidat
      </Button>
    </>
  );
}
