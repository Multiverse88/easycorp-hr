'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { MessageCircle, Mail, Loader2, Check, AlertCircle } from 'lucide-react';
import { Candidate, resendInvitationEmail } from '@/lib/db';

export function ShareInvitation({ candidate }: { candidate: Candidate }) {
  const [sending, setSending] = useState(false);
  const [status, setStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const getShareMessage = () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const link = `${origin}/disc/${candidate.token}`;
    return `Halo ${candidate.nama},

Anda diundang untuk mengikuti tahapan asesmen di EasyLegal untuk posisi ${candidate.posisi_dilamar || 'Kandidat'}.

Silakan akses tautan berikut untuk memulai:
${link}

Atau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:
Token: ${candidate.token}

Terima kasih,
Tim HR EasyLegal`;
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(getShareMessage());
    let url = `https://wa.me/?text=${text}`;
    if (candidate.telepon) {
      let phoneStr = candidate.telepon.replace(/\D/g, '');
      if (phoneStr.startsWith('0')) {
        phoneStr = '62' + phoneStr.substring(1);
      }
      url = `https://wa.me/${phoneStr}?text=${text}`;
    }
    window.open(url, '_blank');
  };

  const handleShareEmail = async () => {
    if (!candidate.email) {
      setStatus({ type: 'error', message: 'Email kandidat belum diisi.' });
      return;
    }
    
    setSending(true);
    setStatus(null);
    
    try {
      const origin = window.location.origin;
      const res = await resendInvitationEmail(candidate.id, origin);
      if (res.success) {
        setStatus({ type: 'success', message: 'Email undangan berhasil dikirim!' });
      } else {
        if (res.error === 'SMTP_NOT_CONFIGURED') {
          // Fallback to mailto
          setStatus({ type: 'error', message: 'SMTP belum diatur. Membuka email client...' });
          const subject = encodeURIComponent('Undangan Asesmen - EasyLegal');
          const body = encodeURIComponent(getShareMessage());
          const mailto = `mailto:${candidate.email || ''}?subject=${subject}&body=${body}`;
          window.location.href = mailto;
        } else {
          setStatus({ type: 'error', message: `Gagal mengirim email: ${res.error}` });
        }
      }
    } catch (err) {
      console.error('Error sending email:', err);
      setStatus({ type: 'error', message: 'Terjadi kesalahan sistem saat mengirim email.' });
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-3 mt-3">
      <div className="flex flex-wrap gap-2">
        <Button 
          type="button"
          size="sm"
          onClick={handleShareWhatsApp}
          className="bg-[#25D366] text-white hover:bg-[#25D366]/90 shadow-sm font-bold"
        >
          <MessageCircle className="mr-2 h-4 w-4" />
          Kirim via WA
        </Button>
        <Button 
          type="button" 
          size="sm"
          onClick={handleShareEmail}
          disabled={sending}
          className="shadow-sm font-bold"
        >
          {sending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Mail className="mr-2 h-4 w-4" />
          )}
          Kirim via Email
        </Button>
      </div>
      
      {status && (
        <div className={`flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-lg border max-w-sm transition-all
          ${status.type === 'success' 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-950/20 dark:border-emerald-900/30 dark:text-emerald-400' 
            : 'bg-amber-50 border-amber-200 text-amber-800 dark:bg-amber-950/20 dark:border-amber-900/30 dark:text-amber-400'
          }`}
        >
          {status.type === 'success' ? (
            <Check className="h-3.5 w-3.5 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="h-3.5 w-3.5 shrink-0 text-amber-600 dark:text-amber-400" />
          )}
          <span>{status.message}</span>
        </div>
      )}
    </div>
  );
}
