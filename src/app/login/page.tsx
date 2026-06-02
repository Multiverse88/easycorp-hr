'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/loading-overlay';

export default function LoginPage() {
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

    // Set session date cookie (WIB = UTC+7)
    const now = new Date();
    const wibOffset = 7 * 60; // +7 jam dalam menit
    const wibDate = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
    const dateStr = wibDate.toISOString().split('T')[0]; // YYYY-MM-DD
    document.cookie = `session_date=${dateStr}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

    // Redirect to dashboard subdomain after login
    window.location.href = '/dashboard';
  }

  return (
    <div className="min-h-screen bg-[#FAF2F2] flex items-center justify-center p-4 relative overflow-hidden">
      <LoadingOverlay visible={loading} message="Memproses login..." />

      {/* Background decorations */}
      <div className="absolute top-0 left-0 w-96 h-96 rounded-full bg-[#9A0000]/10 opacity-40 -translate-x-1/3 -translate-y-1/3 filter blur-2xl" />
      <div className="absolute bottom-0 right-0 w-80 h-80 rounded-full bg-[#9A0000]/15 opacity-30 translate-x-1/4 translate-y-1/4 filter blur-xl" />
      <div className="absolute top-1/2 left-1/4 w-48 h-48 rounded-full bg-[#9A0000]/5 opacity-25 filter blur-lg" />

      <Card className="w-full max-w-md relative z-10 shadow-xl shadow-[#9A0000]/5 border-[#9A0000]/10 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center pb-2">
          <div className="flex items-center justify-center gap-3 mb-3">
            <div className="bg-white rounded-2xl p-2.5 shadow-md shadow-slate-200/50 flex items-center justify-center w-20 h-20 border border-slate-100">
              <img 
                src="/logo-easylegal.png" 
                alt="EasyLegal Logo" 
                className="w-auto h-14 object-contain"
              />
            </div>
          </div>
          <h1 className="text-2xl font-extrabold text-[#9A0000] tracking-tight">EasyLegal</h1>
          <p className="text-sm text-slate-500 font-semibold tracking-wide">Sistem Rekrutmen Internal</p>
        </CardHeader>
        <CardContent className="pt-4">
          <form onSubmit={handleLogin} className="space-y-4">
            {error && (
              <div className="bg-red-50 text-red-600 text-sm p-3 rounded-xl border border-red-150">
                {error}
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-slate-700 font-medium">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@easylegal.id"
                className="mt-1.5 bg-slate-50 border-slate-200 focus:border-[#9A0000] focus:ring-[#9A0000] focus:ring-1 rounded-xl"
                required
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-700 font-medium">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Masukkan password"
                className="mt-1.5 bg-slate-50 border-slate-200 focus:border-[#9A0000] focus:ring-[#9A0000] focus:ring-1 rounded-xl"
                required
              />
            </div>
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-[#9A0000] to-[#C80000] hover:from-[#800000] hover:to-[#A60000] text-white font-semibold py-2.5 rounded-xl shadow-lg shadow-[#9A0000]/25 transition-all duration-200"
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
