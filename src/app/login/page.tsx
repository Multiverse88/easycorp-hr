'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { LoadingOverlay } from '@/components/loading-overlay';
import gsap from 'gsap';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const cardRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const footerRef = useRef<HTMLDivElement>(null);
  const bgCircle1Ref = useRef<HTMLDivElement>(null);
  const bgCircle2Ref = useRef<HTMLDivElement>(null);
  const bgCircle3Ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 1. Floating/Drifting Animation for Background Circles
    const drift = (el: HTMLDivElement | null, rx: number, ry: number, duration: number) => {
      if (!el) return;
      gsap.to(el, {
        x: `random(-${rx}, ${rx})`,
        y: `random(-${ry}, ${ry})`,
        rotation: 'random(-180, 180)',
        scale: 'random(0.8, 1.2)',
        duration,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });
    };

    drift(bgCircle1Ref.current, 80, 80, 15);
    drift(bgCircle2Ref.current, 100, 100, 20);
    drift(bgCircle3Ref.current, 60, 60, 12);

    // 2. Entrance Animation for Login Box and Content
    const tl = gsap.timeline();
    
    // Animate Card
    tl.fromTo(
      cardRef.current,
      { y: 80, opacity: 0, scale: 0.96 },
      { y: 0, opacity: 1, scale: 1, duration: 1.2, ease: 'power4.out' }
    );

    // Stagger inner elements
    const elementsToAnimate = [
      logoRef.current,
      titleRef.current,
      subtitleRef.current,
      formRef.current ? Array.from(formRef.current.children) : [],
    ].flat();

    tl.fromTo(
      elementsToAnimate,
      { y: 24, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, stagger: 0.08, ease: 'power3.out' },
      '-=0.8' // start slightly before card animation completes
    );

    // Animate Footer
    tl.fromTo(
      footerRef.current,
      { opacity: 0, y: 10 },
      { opacity: 0.5, y: 0, duration: 1, ease: 'power2.out' },
      '-=0.4'
    );

    return () => {
      // Kill all animations on unmount
      gsap.killTweensOf([
        bgCircle1Ref.current,
        bgCircle2Ref.current,
        bgCircle3Ref.current,
        cardRef.current,
        footerRef.current,
        elementsToAnimate,
      ]);
    };
  }, []);

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setError('Email atau password salah');
      setLoading(false);
      
      // Animate card shake on error
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { x: -10 },
          { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', clearProps: 'x' }
        );
      }
      return;
    }

    // Set session date cookie (WIB = UTC+7)
    const now = new Date();
    const wibOffset = 7 * 60; // +7 jam dalam menit
    const wibDate = new Date(now.getTime() + (wibOffset - now.getTimezoneOffset()) * 60000);
    const dateStr = wibDate.toISOString().split('T')[0]; // YYYY-MM-DD
    document.cookie = `session_date=${dateStr}; path=/; max-age=${60 * 60 * 24}; SameSite=Lax`;

    // Redirect to dashboard after login
    window.location.href = '/dashboard';
  }

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen bg-[#F1F5F9] flex items-center justify-center p-4 relative overflow-hidden font-sans select-none"
    >
      <LoadingOverlay visible={loading} message="Memproses login..." />

      {/* Decorative Premium Bright Mesh Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(139,34,82,0.1)_0%,transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_80%_80%,rgba(56,189,248,0.15)_0%,transparent_50%)]" />

      {/* Floating Animated Circles */}
      <div 
        ref={bgCircle1Ref}
        className="absolute top-10 left-10 w-96 h-96 rounded-full bg-sky-400/20 filter blur-3xl pointer-events-none" 
      />
      <div 
        ref={bgCircle2Ref}
        className="absolute bottom-10 right-10 w-96 h-96 rounded-full bg-[#8B2252]/8 filter blur-3xl pointer-events-none" 
      />
      <div 
        ref={bgCircle3Ref}
        className="absolute top-1/2 left-1/3 w-72 h-72 rounded-full bg-indigo-300/15 filter blur-2xl pointer-events-none" 
      />

      {/* Login Box */}
      <div ref={cardRef} className="w-full max-w-md relative z-10 opacity-0">
        <Card className="border border-white/60 bg-white/35 backdrop-blur-xl shadow-2xl shadow-slate-200/85 rounded-3xl overflow-hidden">
          <CardHeader className="text-center pb-2 pt-8">
            <div ref={logoRef} className="flex items-center justify-center gap-3 mb-4">
              <div className="bg-white/80 rounded-3xl p-3 shadow-md flex items-center justify-center w-24 h-24 border border-white/90 hover:border-slate-350 transition-colors duration-300">
                <img 
                  src="/logo-ec.png" 
                  alt="EasyCorp Logo" 
                  className="w-auto h-16 object-contain"
                />
              </div>
            </div>
            <h1 ref={titleRef} className="text-3xl font-black text-slate-900 tracking-tight">
              EasyCorp
            </h1>
            <p ref={subtitleRef} className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mt-1.5">
              Sistem Rekrutmen Internal
            </p>
          </CardHeader>
          <CardContent className="p-8 pt-4">
            <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-red-50 text-red-650 text-xs font-semibold p-3.5 rounded-xl border border-red-100 text-center animate-in fade-in zoom-in-95 duration-200">
                  {error}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="email" className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-1">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@easycorp.id"
                  className="h-12 bg-white/60 border-slate-200 focus:border-[#8B2252] focus:ring-[#8B2252] focus:ring-1 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white/80 transition-all duration-300"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-slate-700 text-xs font-bold uppercase tracking-wider pl-1">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Masukkan password"
                  className="h-12 bg-white/60 border-slate-200 focus:border-[#8B2252] focus:ring-[#8B2252] focus:ring-1 rounded-xl text-slate-800 font-medium placeholder:text-slate-400 focus:bg-white/80 transition-all duration-300"
                  required
                />
              </div>
              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 bg-gradient-to-r from-[#8B2252] to-[#A82B61] hover:from-[#731C43] hover:to-[#912453] text-white text-sm font-bold uppercase tracking-widest rounded-xl shadow-lg shadow-[#8B2252]/20 active:scale-[0.98] transition-all duration-300"
              >
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* Footer */}
      <div 
        ref={footerRef} 
        className="absolute bottom-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest opacity-0"
      >
        EasyCorp &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}
