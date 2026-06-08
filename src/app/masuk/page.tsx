'use client';

import { useState } from 'react';
import { getCandidateByToken } from '@/lib/db';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function MasukPage() {
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const candidate = await getCandidateByToken(token.trim());

      if (!candidate) {
        setError('Token tidak valid. Silakan hubungi HR.');
        setLoading(false);
        return;
      }

      window.location.href = `/disc/${candidate.token}`;
    } catch {
      setError('Terjadi kesalahan. Silakan coba lagi.');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[hsl(15_60%_97%)] relative overflow-hidden">
      <LoadingOverlay visible={loading} message="Memeriksa token..." />

      {/* Background decorations */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-[hsl(350_50%_88%)] opacity-40 translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-[hsl(350_40%_85%)] opacity-30 -translate-x-1/4 translate-y-1/4" />

      {/* Header */}
      <header className="relative z-10 bg-gradient-to-r from-[hsl(350_25%_14%)] to-[hsl(350_30%_18%)] text-white p-5">
        <div className="max-w-md mx-auto flex items-center gap-3">
          <div className="bg-gradient-to-br from-[hsl(350_60%_60%)] to-[hsl(350_65%_50%)] rounded-xl p-2.5 shadow-lg">
            <span className="text-white font-extrabold text-sm">EC</span>
          </div>
          <div>
            <div className="font-bold tracking-tight">Easy Corp</div>
            <div className="text-xs text-[hsl(15_30%_65%)]">Recruitment System</div>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="relative z-10 max-w-md mx-auto p-4 mt-8">
        <Card className="shadow-xl shadow-[hsl(350_30%_70%_/_0.15)] border-[hsl(15_30%_88%)] bg-white/90 backdrop-blur-sm">
          <CardHeader className="text-center pb-2">
            <div className="flex items-center justify-center gap-3 mb-3">
              <div className="bg-gradient-to-br from-[hsl(350_50%_90%)] to-[hsl(350_50%_85%)] rounded-2xl p-4">
                <span className="text-[hsl(350_60%_50%)] text-2xl">&#x2728;</span>
              </div>
            </div>
            <h1 className="text-xl font-bold text-[hsl(350_30%_15%)]">Masuk dengan Token</h1>
            <p className="text-sm text-[hsl(350_15%_48%)] mt-1">
              Masukkan token yang diberikan oleh HR
            </p>
          </CardHeader>
          <CardContent className="pt-2">
            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="bg-[hsl(0_80%_95%)] text-[hsl(0_60%_40%)] text-sm p-3 rounded-xl border border-[hsl(0_60%_88%)]">
                  {error}
                </div>
              )}
              <div>
                <Label htmlFor="token" className="text-[hsl(350_20%_35%)] font-medium">Token</Label>
                <Input
                  id="token"
                  value={token}
                  onChange={(e) => setToken(e.target.value)}
                  placeholder="Masukkan token Anda"
                  className="mt-1.5 bg-[hsl(15_30%_96%)] border-[hsl(15_30%_88%)] focus:border-[hsl(350_50%_60%)] focus:ring-[hsl(350_50%_60%)] rounded-xl text-center text-lg tracking-wider font-mono"
                  required
                />
              </div>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-[hsl(350_60%_55%)] to-[hsl(350_65%_48%)] hover:from-[hsl(350_60%_50%)] hover:to-[hsl(350_65%_43%)] text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-[hsl(350_40%_40%_/_0.3)] transition-all duration-200"
                disabled={loading}
              >
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center mt-6 text-xs text-[hsl(350_15%_55%)]">
          EasyCorp &copy; 2026
        </div>
      </div>
    </div>
  );
}
