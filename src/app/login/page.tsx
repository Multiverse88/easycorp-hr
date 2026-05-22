'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email atau password salah');
      setLoading(false);
      return;
    }

    // Redirect to dashboard subdomain after login
    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen bg-[hsl(15_60%_97%)] flex items-center justify-center p-4 relative overflow-hidden">
      <LoadingOverlay visible={loading} message="Memproses login..." />

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[hsl(350_50%_88%)] opacity-40 -translate-x-1/3 -translate-y-1/3" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[hsl(350_40%_85%)] opacity-30 translate-x-1/4 translate-y-1/4" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-[hsl(25_60%_90%)] opacity-25" />

      <Card className="w-full max-w-md relative z-10 shadow-xl shadow-[hsl(350_30%_70%_/_0.15)] border-[hsl(15_30%_88%)] bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-4">
            <div className="bg-gradient-to-br from-[hsl(350_60%_55%)] to-[hsl(350_70%_45%)] rounded-2xl p-4 shadow-lg shadow-[hsl(350_40%_40%_/_0.25)]">
              <span className="text-white font-extrabold text-2xl tracking-tight">EL</span>
            </div>
          </div>
          <h1 className="text-2xl font-bold text-[hsl(350_30%_15%)]">EasyLegal</h1>
          <p className="text-sm text-[hsl(350_15%_48%)] font-medium">Sistem Rekrutmen Internal</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-[hsl(0_80%_95%)] text-[hsl(0_60%_40%)] text-sm p-3 rounded-xl border border-[hsl(0_60%_88%)]">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-[hsl(350_20%_35%)] font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@easylegal.id"
                className="mt-1.5 bg-[hsl(15_30%_96%)] border-[hsl(15_30%_88%)] focus:border-[hsl(350_50%_60%)] focus:ring-[hsl(350_50%_60%)] rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-[hsl(350_20%_35%)] font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="mt-1.5 bg-[hsl(15_30%_96%)] border-[hsl(15_30%_88%)] focus:border-[hsl(350_50%_60%)] focus:ring-[hsl(350_50%_60%)] rounded-xl"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[hsl(350_60%_55%)] to-[hsl(350_65%_48%)] hover:from-[hsl(350_60%_50%)] hover:to-[hsl(350_65%_43%)] text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-[hsl(350_40%_40%_/_0.3)] transition-all duration-200"
            >
              Masuk
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Footer */}
      <div className="absolute bottom-4 text-center text-xs text-[hsl(350_15%_55%)]">
        EasyLegal &copy; 2026
      </div>
    </div>
  );
}
