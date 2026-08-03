'use client';

import { useState, useEffect, useRef } from 'react';
import { LoadingOverlay } from '@/components/loading-overlay';
import { Eye, EyeOff } from 'lucide-react';
import gsap from 'gsap';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

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

    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!res.ok) {
      setError('Email atau password salah');
      setLoading(false);
      
      if (cardRef.current) {
        gsap.fromTo(
          cardRef.current,
          { x: -10 },
          { x: 0, duration: 0.5, ease: 'elastic.out(1, 0.3)', clearProps: 'x' }
        );
      }
      return;
    }

    window.location.href = '/dashboard';
  }

  return (
    <div 
      ref={containerRef} 
      className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden font-sans select-none"
      style={{ background: 'linear-gradient(135deg, #ffffff 0%, #fff8f8 45%, #fff5f5 75%, #fffcfc 100%)' }}
    >
      <LoadingOverlay visible={loading} message="Memproses login..." />

      {/* Subtle mesh overlay */}


      {/* Orb 1 — subtle crimson hint, top-left corner */}
      <div 
        ref={bgCircle1Ref}
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '-20px', left: '-30px',
          width: '240px', height: '240px',
          background: 'radial-gradient(circle, rgba(139,0,0,0.07) 0%, transparent 70%)',
          filter: 'blur(36px)',
        }}
      />
      {/* Orb 2 — subtle red hint, bottom-right corner */}
      <div 
        ref={bgCircle2Ref}
        className="absolute pointer-events-none rounded-full"
        style={{
          bottom: '-20px', right: '-30px',
          width: '260px', height: '260px',
          background: 'radial-gradient(circle, rgba(139,0,0,0.06) 0%, transparent 70%)',
          filter: 'blur(38px)',
        }}
      />
      {/* Orb 3 — very faint, upper-right */}
      <div 
        ref={bgCircle3Ref}
        className="absolute pointer-events-none rounded-full"
        style={{
          top: '20%', right: '8%',
          width: '180px', height: '180px',
          background: 'radial-gradient(circle, rgba(180,30,30,0.05) 0%, transparent 68%)',
          filter: 'blur(30px)',
        }}
      />

      {/* Login Card */}
      <div ref={cardRef} className="w-full max-w-md relative z-10 opacity-0">
        <div
          className="rounded-3xl overflow-hidden"
          style={{
            background: 'rgba(255, 255, 255, 0.52)',
            backdropFilter: 'blur(30px) saturate(180%)',
            WebkitBackdropFilter: 'blur(30px) saturate(180%)',
            border: '1.5px solid rgba(255, 255, 255, 0.88)',
            boxShadow: [
              '0 8px 40px rgba(139,0,0,0.09)',
              '0 2px 12px rgba(139,0,0,0.05)',
              'inset 0 1px 0 rgba(255,255,255,0.95)',
              'inset 0 -1px 0 rgba(139,0,0,0.04)',
            ].join(', '),
          }}
        >
          {/* Top accent stripe */}
          <div style={{
            height: '4px',
            background: 'linear-gradient(90deg, #6B0000 0%, #B22222 40%, #DC3030 60%, #B22222 80%, #6B0000 100%)',
          }} />

          {/* Header */}
          <div className="text-center pb-2 pt-8 px-8">
            <div ref={logoRef} className="flex items-center justify-center mb-5">
              <div
                className="flex items-center justify-center w-24 h-24"
                style={{
                  background: 'rgba(255,255,255,0.78)',
                  backdropFilter: 'blur(12px)',
                  borderRadius: '22px',
                  border: '1.5px solid rgba(139,0,0,0.10)',
                  boxShadow: '0 4px 20px rgba(139,0,0,0.10), inset 0 1px 0 rgba(255,255,255,0.98)',
                }}
              >
                <img 
                  src="/logo-ec.png" 
                  alt="EasyCorp Logo" 
                  className="w-auto h-16 object-contain"
                />
              </div>
            </div>
            <h1 ref={titleRef} className="text-3xl font-black tracking-tight" style={{ color: '#111111' }}>
              EasyCorp
            </h1>
            <p ref={subtitleRef} className="text-[10px] font-bold uppercase tracking-widest mt-1.5" style={{ color: '#8B0000' }}>
              Sistem Rekrutmen Internal
            </p>
          </div>

          {/* Form */}
          <div className="px-8 pb-8 pt-4">
            <form ref={formRef} onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div
                  className="text-xs font-semibold p-3.5 rounded-xl text-center animate-in fade-in zoom-in-95 duration-200"
                  style={{
                    background: 'rgba(139,0,0,0.06)',
                    border: '1px solid rgba(139,0,0,0.15)',
                    color: '#8B0000',
                  }}
                >
                  {error}
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="email" className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#3a0a0a' }}>
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@easycorp.id"
                  required
                  className="w-full h-12 px-4 rounded-xl text-sm font-medium outline-none transition-all duration-300"
                  style={{
                    background: 'rgba(255,255,255,0.62)',
                    border: '1.5px solid rgba(180,180,180,0.55)',
                    color: '#111111',
                    backdropFilter: 'blur(8px)',
                  }}
                  onFocus={e => {
                    e.currentTarget.style.border = '1.5px solid rgba(139,0,0,0.45)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.88)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,0,0,0.07)';
                  }}
                  onBlur={e => {
                    e.currentTarget.style.border = '1.5px solid rgba(180,180,180,0.55)';
                    e.currentTarget.style.background = 'rgba(255,255,255,0.62)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="password" className="block text-xs font-bold uppercase tracking-wider pl-1" style={{ color: '#3a0a0a' }}>
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Masukkan password"
                    required
                    className="w-full h-12 px-4 pr-11 rounded-xl text-sm font-medium outline-none transition-all duration-300"
                    style={{
                      background: 'rgba(255,255,255,0.62)',
                      border: '1.5px solid rgba(180,180,180,0.55)',
                      color: '#111111',
                      backdropFilter: 'blur(8px)',
                    }}
                    onFocus={e => {
                      e.currentTarget.style.border = '1.5px solid rgba(139,0,0,0.45)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.88)';
                      e.currentTarget.style.boxShadow = '0 0 0 3px rgba(139,0,0,0.07)';
                    }}
                    onBlur={e => {
                      e.currentTarget.style.border = '1.5px solid rgba(180,180,180,0.55)';
                      e.currentTarget.style.background = 'rgba(255,255,255,0.62)';
                      e.currentTarget.style.boxShadow = 'none';
                    }}
                  />
                  <button
                    type="button"
                    tabIndex={-1}
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5 rounded-md transition-colors duration-200"
                    style={{ color: '#8B0000' }}
                    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(139,0,0,0.08)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    {showPassword ? <EyeOff className="h-4.5 w-4.5" /> : <Eye className="h-4.5 w-4.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 mt-2 text-white text-sm font-bold uppercase tracking-widest rounded-xl transition-all duration-300 active:scale-[0.98] cursor-pointer"
                style={{
                  background: 'linear-gradient(135deg, #8B0000 0%, #C41E1E 55%, #8B0000 100%)',
                  boxShadow: '0 4px 22px rgba(139,0,0,0.32), 0 2px 6px rgba(139,0,0,0.16)',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #6B0000 0%, #A01010 55%, #6B0000 100%)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 6px 28px rgba(139,0,0,0.42), 0 2px 8px rgba(139,0,0,0.22)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'linear-gradient(135deg, #8B0000 0%, #C41E1E 55%, #8B0000 100%)';
                  (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 4px 22px rgba(139,0,0,0.32), 0 2px 6px rgba(139,0,0,0.16)';
                  (e.currentTarget as HTMLButtonElement).style.transform = 'translateY(0)';
                }}
              >
                Masuk
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div 
        ref={footerRef} 
        className="absolute bottom-4 text-center text-[10px] font-bold uppercase tracking-widest"
        style={{ color: '#8B0000', opacity: 0 }}
      >
        EasyCorp &copy; 2026. All rights reserved.
      </div>
    </div>
  );
}
