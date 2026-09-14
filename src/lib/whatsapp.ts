// Integrasi pengiriman WhatsApp otomatis via Fonnte (https://fonnte.com).
// Berbeda dari tautan wa.me (yang cuma membuka chat, HR masih harus klik kirim manual),
// ini benar-benar mengirim pesan lewat device WhatsApp yang terhubung ke akun Fonnte.

export interface SendWhatsAppResult {
  success: boolean;
  error?: string;
}

function normalizePhone(phone: string): string {
  let digits = phone.replace(/\D/g, '');
  if (digits.startsWith('0')) {
    digits = '62' + digits.substring(1);
  }
  return digits;
}

export async function sendFonnteWhatsApp(phone: string, message: string): Promise<SendWhatsAppResult> {
  const token = process.env.FONNTE_TOKEN;

  if (!token) {
    console.warn('FONNTE_TOKEN is missing. WhatsApp message not sent.');
    return { success: false, error: 'Konfigurasi Fonnte belum diatur di server.' };
  }

  const target = normalizePhone(phone);
  if (!target) {
    return { success: false, error: 'Nomor telepon tidak valid.' };
  }

  try {
    const form = new FormData();
    form.append('target', target);
    form.append('message', message);
    form.append('countryCode', '62');

    const res = await fetch('https://api.fonnte.com/send', {
      method: 'POST',
      headers: { Authorization: token },
      body: form,
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || data?.status === false) {
      return { success: false, error: data?.reason || `Fonnte merespons status ${res.status}` };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Unknown Fonnte error' };
  }
}
