import { NextRequest, NextResponse } from 'next/server';
import { sendFonnteWhatsApp } from '@/lib/whatsapp';

export async function POST(req: NextRequest) {
  try {
    const { phone, message } = await req.json();

    if (!phone || typeof phone !== 'string' || !phone.trim()) {
      return NextResponse.json({ error: 'Nomor telepon wajib diisi' }, { status: 400 });
    }
    if (!message || typeof message !== 'string' || !message.trim()) {
      return NextResponse.json({ error: 'Pesan wajib diisi' }, { status: 400 });
    }

    const result = await sendFonnteWhatsApp(phone, message);

    if (!result.success) {
      return NextResponse.json({ error: result.error || 'Gagal mengirim WhatsApp' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('POST /api/candidate/send-whatsapp error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal mengirim WhatsApp' },
      { status: 500 }
    );
  }
}
