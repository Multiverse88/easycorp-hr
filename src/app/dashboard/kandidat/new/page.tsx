'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createCandidate } from '@/lib/db';
import { Copy, Check, UserPlus } from 'lucide-react';

export default function TambahKandidatPage() {
  const [nama, setNama] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ token: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const candidate = await createCandidate({
        nama,
        email: '',
        telepon: '',
        posisi_dilamar: '',
      });

      const link = `${window.location.origin}/disc/${candidate.token}`;
      setResult({ token: candidate.token, link });
    } catch {
      setError('Gagal membuat kandidat');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!result) return;
    await navigator.clipboard.writeText(result.link);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleReset() {
    setNama('');
    setResult(null);
    setCopied(false);
    setError('');
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Tambah Kandidat</h1>

      <div className="max-w-lg">
        {!result ? (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Generate Token Kandidat
              </CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                {error && (
                  <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">
                    {error}
                  </div>
                )}
                <div>
                  <Label htmlFor="nama">Nama Lengkap</Label>
                  <Input
                    id="nama"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    placeholder="Masukkan nama lengkap kandidat"
                    required
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full">
                  {loading ? 'Membuat...' : 'Generate Token'}
                </Button>
              </form>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <CardTitle className="text-green-600">Token Berhasil Dibuat</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label>Nama Kandidat</Label>
                <p className="font-medium">{nama}</p>
              </div>
              <div>
                <Label>Token</Label>
                <p className="font-mono bg-slate-100 p-2 rounded">{result.token}</p>
              </div>
              <div>
                <Label>Link DISC Test</Label>
                <div className="flex gap-2">
                  <Input value={result.link} readOnly className="font-mono text-sm" />
                  <Button variant="outline" onClick={handleCopy}>
                    {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Kirim link ini ke kandidat untuk mengikuti DISC test
                </p>
              </div>
              <div className="flex gap-2">
                <Button onClick={handleReset} className="flex-1">
                  Tambah Kandidat Lain
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
