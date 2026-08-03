'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { createCandidate, resendInvitationEmail } from '@/lib/db';
import {
  AlertCircle,
  ArrowLeft,
  Briefcase,
  Check,
  ChevronRight,
  ClipboardCheck,
  Copy,
  ExternalLink,
  Hash,
  Loader2,
  Mail,
  MessageCircle,
  Phone,
  RotateCcw,
  ShieldCheck,
  User,
  UserPlus,
} from 'lucide-react';
import Link from 'next/link';

export default function TambahKandidatPage() {
  const [nama, setNama] = useState('');
  const [posisiDilamar, setPosisiDilamar] = useState('');
  const [email, setEmail] = useState('');
  const [telepon, setTelepon] = useState('');
  
  const [sendEmail, setSendEmail] = useState(true);
  const [emailStatus, setEmailStatus] = useState<{ sent: boolean; error?: string } | null>(null);
  const [sendingEmailShare, setSendingEmailShare] = useState(false);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ id: string; token: string; link: string } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState('');

  const [jobOptions, setJobOptions] = useState<string[]>([]);
  const [loadingJobs, setLoadingJobs] = useState(false);
  const [hasFetchedJobs, setHasFetchedJobs] = useState(false);

  async function handleOpenChange(open: boolean) {
    if (open && !hasFetchedJobs) {
      setLoadingJobs(true);
      try {
        const res = await fetch(`/api/jobs?t=${Date.now()}`);
        const data: unknown = await res.json();
        if (Array.isArray(data)) {
          const titles = data
            .filter((item: { isActive?: boolean }) => item.isActive !== false)
            .map((item: { title?: unknown }) => item.title)
            .filter((title): title is string => typeof title === 'string' && title.trim().length > 0);
          setJobOptions(titles);
        }
      } catch (error) {
        console.error("Failed to fetch jobs:", error);
      } finally {
        setLoadingJobs(false);
        setHasFetchedJobs(true);
      }
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setEmailStatus(null);
    setLoading(true);

    try {
      const candidate = await createCandidate(
        {
          nama,
          email: email.trim(),
          telepon: telepon.trim(),
          posisi_dilamar: posisiDilamar.trim(),
        },
        {
          sendEmail: sendEmail && !!email.trim(),
          origin: window.location.origin,
        }
      );

      const link = `${window.location.origin}/disc/${candidate.token}`;
      setResult({ id: candidate.id, token: candidate.token, link });
      
      if (sendEmail && email.trim()) {
        setEmailStatus({
          sent: !!candidate.emailSent,
          error: candidate.emailError,
        });
      } else {
        setEmailStatus(null);
      }
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

  const getShareMessage = () => {
    if (!result) return '';
    return `Halo ${nama},

Anda diundang untuk mengikuti tahapan asesmen di EasyLegal untuk posisi ${posisiDilamar || 'Kandidat'}.

Silakan akses tautan berikut untuk memulai:
${result.link}

Orang Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:
Token: ${result.token}

Terima kasih,
Tim HR EasyLegal`;
  };

  const handleShareWhatsApp = () => {
    if (!result) return;
    const text = encodeURIComponent(getShareMessage());
    let url = `https://wa.me/?text=${text}`;
    if (telepon) {
      let phoneStr = telepon.replace(/\D/g, '');
      if (phoneStr.startsWith('0')) {
        phoneStr = '62' + phoneStr.substring(1);
      }
      url = `https://wa.me/${phoneStr}?text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleShareEmail = async () => {
    if (!result) return;
    setSendingEmailShare(true);
    setEmailStatus(null);
    try {
      const res = await resendInvitationEmail(result.id, window.location.origin);
      if (res.success) {
        setEmailStatus({ sent: true });
      } else {
        if (res.error === 'SMTP_NOT_CONFIGURED') {
          setEmailStatus({ sent: false, error: 'SMTP_NOT_CONFIGURED' });
          // Fallback to mailto
          const subject = encodeURIComponent('Undangan Asesmen - EasyLegal');
          const body = encodeURIComponent(getShareMessage());
          const mailto = `mailto:${email}?subject=${subject}&body=${body}`;
          window.location.href = mailto;
        } else {
          setEmailStatus({ sent: false, error: res.error });
        }
      }
    } catch (err) {
      console.error('Error sending email share:', err);
      setEmailStatus({ sent: false, error: 'SYSTEM_ERROR' });
    } finally {
      setSendingEmailShare(false);
    }
  };

  function handleReset() {
    setNama('');
    setPosisiDilamar('');
    setEmail('');
    setTelepon('');
    setSendEmail(true);
    setEmailStatus(null);
    setSendingEmailShare(false);
    setResult(null);
    setCopied(false);
    setError('');
  }

  const hasFormData = nama || posisiDilamar || email || telepon;

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6">
      <div className="mx-auto w-full max-w-6xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Link
              href="/dashboard/kandidat"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke daftar kandidat
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                Rekrutmen kandidat
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Tambah kandidat baru
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Buat profil awal kandidat dan generate token asesmen yang siap dikirim ke kandidat.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm">
            <ShieldCheck className="h-4 w-4 text-primary" />
            Token aktif 7 hari
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[0.82fr_1.18fr]">
          <aside className="space-y-4">
            <Card className="overflow-hidden rounded-2xl border-border bg-sidebar text-sidebar-foreground shadow-xl shadow-rose-950/10">
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-6">
                  <div>
                    <p className="text-xs font-black uppercase tracking-[0.22em] text-sidebar-primary">
                      Ringkasan
                    </p>
                    <h2 className="mt-3 text-2xl font-black tracking-tight">
                      {nama || 'Kandidat baru'}
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-sidebar-foreground/70">
                      {posisiDilamar || 'Pilih posisi untuk melengkapi undangan asesmen.'}
                    </p>
                  </div>
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-sidebar-accent text-sidebar-primary">
                    <UserPlus className="h-6 w-6" />
                  </div>
                </div>

                <div className="mt-8 space-y-3">
                  {[
                    { icon: User, label: 'Nama', value: nama || 'Belum diisi' },
                    { icon: Briefcase, label: 'Posisi', value: posisiDilamar || 'Belum dipilih' },
                    { icon: Mail, label: 'Email', value: email || 'Opsional' },
                    { icon: Phone, label: 'Telepon', value: telepon || 'Opsional' },
                  ].map((item) => (
                    <div
                      key={item.label}
                      className="flex items-center gap-3 rounded-xl bg-white/[0.06] px-4 py-3 ring-1 ring-white/10"
                    >
                      <item.icon className="h-4 w-4 shrink-0 text-sidebar-primary" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sidebar-foreground/45">
                          {item.label}
                        </p>
                        <p className="truncate text-sm font-semibold text-sidebar-foreground">
                          {item.value}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-2xl border-border bg-card/80 shadow-sm">
              <CardContent className="p-5">
                <div className="flex gap-3">
                  <div className="mt-1 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    <ClipboardCheck className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground">Alur setelah token dibuat</h3>
                    <div className="mt-4 space-y-4 text-sm text-muted-foreground">
                      <div className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-foreground">
                          1
                        </span>
                        <p>Kirim tautan asesmen ke kandidat melalui email atau WhatsApp.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-foreground">
                          2
                        </span>
                        <p>Kandidat masuk dengan token dan mengerjakan DISC lalu WPT.</p>
                      </div>
                      <div className="flex gap-3">
                        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-black text-foreground">
                          3
                        </span>
                        <p>Hasil otomatis masuk ke profil kandidat untuk direview HR.</p>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </aside>

          <section className="relative animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="absolute -inset-4 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/10 via-transparent to-secondary/70 blur-2xl" />

            {!result ? (
              <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-rose-950/5">
                <div className="border-b border-border bg-muted/30 px-6 py-5 md:px-8">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-black tracking-tight text-foreground">
                        Data kandidat
                      </h2>
                      <p className="mt-1 text-sm text-muted-foreground">
                        Isi minimal nama kandidat, lalu pilih posisi yang dilamar.
                      </p>
                    </div>
                    <div className="hidden rounded-xl bg-background px-3 py-2 text-xs font-bold text-muted-foreground ring-1 ring-border sm:block">
                      {hasFormData ? 'Draft tersimpan di layar' : 'Siap diisi'}
                    </div>
                  </div>
                </div>
                <CardContent className="p-6 md:p-8">
                  <form onSubmit={handleSubmit} className="space-y-6">
                  {error && (
                    <div className="flex items-start gap-3 rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      {error}
                    </div>
                  )}
                  
                  <div className="space-y-2.5">
                    <Label htmlFor="nama" className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Nama Lengkap <span className="text-primary">*</span>
                    </Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <User className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <Input
                        id="nama"
                        value={nama}
                        onChange={(e) => setNama(e.target.value)}
                        placeholder="Contoh: Budi Santoso"
                        className="h-14 rounded-xl border-border bg-muted/30 pl-11 font-semibold transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                        required
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div className="space-y-2.5">
                      <Label htmlFor="posisi" className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                        Posisi Dilamar
                      </Label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 z-10 flex items-center pl-4">
                          <Briefcase className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <Select value={posisiDilamar} onValueChange={(val) => setPosisiDilamar(val || '')} onOpenChange={handleOpenChange}>
                          <SelectTrigger 
                            id="posisi"
                            className="h-14 w-full rounded-xl border-border bg-muted/30 pl-11 font-semibold transition-all data-[placeholder]:text-muted-foreground/50 hover:bg-muted/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                          >
                            <SelectValue placeholder="Pilih posisi" />
                          </SelectTrigger>
                          <SelectContent className="rounded-xl border-border bg-background/95 backdrop-blur-md">
                            {loadingJobs ? (
                              <div className="p-4 text-center text-sm font-medium text-muted-foreground">Memuat posisi...</div>
                            ) : jobOptions.length > 0 ? (
                              jobOptions.map((job, idx) => (
                                <SelectItem key={idx} value={job} className="rounded-lg">
                                  {job}
                                </SelectItem>
                              ))
                            ) : (
                              <div className="p-4 text-center text-sm font-medium text-muted-foreground">Tidak ada posisi tersedia</div>
                            )}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    
                    <div className="space-y-2.5">
                      <Label htmlFor="telepon" className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                        Nomor Telepon
                      </Label>
                      <div className="relative">
                        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                          <Phone className="h-4 w-4 text-muted-foreground/60" />
                        </div>
                        <Input
                          id="telepon"
                          value={telepon}
                          onChange={(e) => setTelepon(e.target.value)}
                          placeholder="0812XXXXXXXX"
                          className="h-14 rounded-xl border-border bg-muted/30 pl-11 font-semibold transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2.5">
                    <Label htmlFor="email" className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Alamat Email
                    </Label>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                        <Mail className="h-4 w-4 text-muted-foreground/60" />
                      </div>
                      <Input
                        id="email"
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="budi@email.com"
                        className="h-14 rounded-xl border-border bg-muted/30 pl-11 font-semibold transition-all placeholder:text-muted-foreground/50 hover:bg-muted/50 focus:border-primary focus:bg-background focus:ring-4 focus:ring-primary/10"
                      />
                    </div>
                  </div>

                  {email.trim() && (
                    <div className="flex items-start space-x-3 rounded-xl border border-border bg-muted/20 p-4 transition-all hover:bg-muted/30 animate-in fade-in slide-in-from-top-1 duration-200">
                      <input
                        id="sendEmail"
                        type="checkbox"
                        checked={sendEmail}
                        onChange={(e) => setSendEmail(e.target.checked)}
                        className="mt-1 h-4.5 w-4.5 rounded border-border text-primary focus:ring-2 focus:ring-primary/30 cursor-pointer"
                      />
                      <div className="flex-1 cursor-pointer select-none" onClick={() => setSendEmail(!sendEmail)}>
                        <Label htmlFor="sendEmail" className="text-sm font-bold text-foreground cursor-pointer block">
                          Kirim Email Undangan Otomatis
                        </Label>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Kandidat akan otomatis menerima email berisi token dan tautan asesmen.
                        </p>
                      </div>
                    </div>
                  )}


                  <div className="rounded-xl border border-border bg-muted/30 p-4">
                    <div className="flex items-start gap-3">
                      <Hash className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                      <p className="text-sm leading-6 text-muted-foreground">
                        Token akan dibuat otomatis setelah kandidat tersimpan. Kandidat bisa membuka asesmen melalui tautan langsung atau halaman masuk token.
                      </p>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    disabled={loading} 
                    className="mt-2 flex h-14 w-full items-center justify-center gap-2 rounded-xl bg-primary font-black tracking-wide text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Membuat kandidat...</span>
                      </>
                    ) : (
                      <>
                        <span>Buat Kandidat & Token</span>
                        <ChevronRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </form>
              </CardContent>
            </Card>
          ) : (
            <div className="animate-in zoom-in-95 duration-500">
              <Card className="relative overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-rose-950/5">
                <div className="absolute inset-x-0 top-0 h-1.5 bg-primary" />
                <CardContent className="space-y-7 p-6 md:p-8">
                  <div className="flex flex-col gap-5 border-b border-border pb-7 sm:flex-row sm:items-center sm:justify-between">
                    <div className="flex items-center gap-4">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary ring-8 ring-primary/5">
                        <Check className="h-7 w-7 stroke-[3px]" />
                      </div>
                      <div>
                        <p className="text-xs font-black uppercase tracking-[0.22em] text-primary">
                          Token berhasil dibuat
                        </p>
                        <h2 className="mt-2 text-2xl font-black tracking-tight text-foreground">
                          {nama}
                        </h2>
                        <p className="mt-1 text-sm font-medium text-muted-foreground">
                          {posisiDilamar || 'Kandidat'} siap menerima tautan asesmen.
                        </p>
                      </div>
                    </div>
                    <Link href={`/dashboard/kandidat/${result.id}`} className="w-full sm:w-auto">
                      <Button
                        type="button"
                        variant="outline"
                        className="h-11 w-full rounded-xl border-border bg-background font-bold sm:w-auto"
                      >
                        <ExternalLink className="mr-2 h-4 w-4" />
                        Buka profil
                      </Button>
                    </Link>
                  </div>

                  {emailStatus && (
                    <div className={`flex items-start gap-3 rounded-xl border p-4 text-sm font-semibold
                      ${emailStatus.sent 
                        ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400' 
                        : emailStatus.error === 'SMTP_NOT_CONFIGURED'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-700 dark:text-amber-400'
                          : 'border-destructive/20 bg-destructive/10 text-destructive'
                      }`}
                    >
                      {emailStatus.sent ? (
                        <>
                          <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <div>
                            <p className="font-bold">Email undangan berhasil dikirim!</p>
                            <p className="text-xs font-medium opacity-85 mt-0.5">Token dan tautan asesmen telah dikirimkan ke {email}.</p>
                          </div>
                        </>
                      ) : emailStatus.error === 'SMTP_NOT_CONFIGURED' ? (
                        <>
                          <AlertCircle className="h-5 w-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                          <div>
                            <p className="font-bold">Email tidak dikirim otomatis</p>
                            <p className="text-xs font-medium opacity-85 mt-0.5">SMTP belum dikonfigurasi di file env (.env.local). Silakan kirimkan tautan secara manual di bawah.</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <AlertCircle className="h-5 w-5 shrink-0 text-destructive mt-0.5" />
                          <div>
                            <p className="font-bold">Gagal mengirim email otomatis</p>
                            <p className="text-xs font-medium opacity-85 mt-0.5">Terjadi kesalahan SMTP: {emailStatus.error}. Silakan kirimkan secara manual.</p>
                          </div>
                        </>
                      )}
                    </div>
                  )}


                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-4">
                      <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                        Kode akses
                      </Label>
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-black text-primary">
                        Aktif
                      </span>
                    </div>
                    <div className="group relative overflow-hidden rounded-2xl bg-sidebar p-6 text-center text-white shadow-2xl shadow-rose-950/15">
                      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,hsl(var(--primary)/0.28),transparent_34%)] opacity-80 transition-opacity duration-300 group-hover:opacity-100" />
                      <span className="relative z-10 break-all font-mono text-2xl font-black tracking-[0.16em] text-white selection:bg-primary/50 md:text-4xl">
                        {result.token}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-5">
                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Tautan Asesmen Langsung
                    </Label>
                    <div className="flex flex-col sm:flex-row gap-2.5">
                      <Input 
                        value={result.link} 
                        readOnly 
                        className="h-12 w-full select-all rounded-xl border-border/80 bg-background font-mono text-xs text-foreground focus-visible:ring-2" 
                      />
                      <Button 
                        type="button"
                        onClick={handleCopy}
                        variant={copied ? "default" : "outline"}
                        className={`h-12 w-full shrink-0 rounded-xl px-6 font-bold tracking-wide transition-all active:scale-95 sm:w-auto
                          ${copied 
                            ? 'border-transparent bg-primary text-primary-foreground shadow-lg shadow-primary/20 hover:bg-primary/90' 
                            : 'bg-background hover:bg-muted border-border'
                          }`}
                      >
                        {copied ? (
                          <>
                            <Check className="w-4 h-4 mr-2" />
                            Tersalin
                          </>
                        ) : (
                          <>
                            <Copy className="w-4 h-4 mr-2" />
                            Salin
                          </>
                        )}
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 pt-1 sm:grid-cols-2">
                    <Button 
                      type="button"
                      onClick={handleShareWhatsApp}
                      className="h-14 rounded-xl bg-[#25D366] font-black text-white shadow-xl shadow-[#25D366]/20 transition-all hover:bg-[#25D366]/90 active:scale-[0.98]"
                    >
                      <MessageCircle className="mr-2 h-4 w-4" />
                      Kirim via WhatsApp
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleShareEmail}
                      disabled={sendingEmailShare}
                      className="h-14 rounded-xl bg-primary font-black text-primary-foreground shadow-xl shadow-primary/20 transition-all hover:bg-primary/90 active:scale-[0.98]"
                    >
                      {sendingEmailShare ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : (
                        <Mail className="mr-2 h-4 w-4" />
                      )}
                      Kirim via Email
                    </Button>
                  </div>
                  <div className="pt-2">
                    <Button 
                      type="button" 
                      onClick={handleReset} 
                      variant="outline"
                      className="h-14 w-full rounded-xl border-border bg-background font-black transition-all hover:bg-muted active:scale-[0.98]"
                    >
                      <RotateCcw className="mr-2 h-4 w-4" />
                      Kandidat berikutnya
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
          </section>
        </div>
      </div>
    </div>
  );
}
