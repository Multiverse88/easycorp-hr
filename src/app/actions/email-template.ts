'use server';

import fs from 'fs/promises';
import path from 'path';
import { getUserRole } from '@/lib/auth';

const TEMPLATE_PATH = path.join(process.cwd(), 'src/lib/email-template.json');

export async function getEmailTemplate() {
  try {
    const data = await fs.readFile(TEMPLATE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Error reading email template:', error);
    // Fallback template
    return {
      subject: "Undangan Asesmen - EasyCorp",
      textTemplate: "Halo {{candidateName}},\n\nAnda diundang untuk mengikuti tahapan asesmen di EasyCorp untuk posisi {{position}}.\n\nSilakan akses tautan berikut untuk memulai:\n{{link}}\n\nAtau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:\nToken: {{token}}\n\nToken asesmen ini akan aktif hingga: {{expiresAt}}.\n\nTerima kasih,\nTim HR EasyCorp",
      htmlTemplate: "<p>Halo <strong>{{candidateName}}</strong>,</p><p>Anda diundang untuk mengikuti tahapan asesmen di EasyCorp untuk posisi <strong>{{position}}</strong>.</p><p>Silakan klik tombol di bawah ini untuk memulai:</p><p><a href=\"{{link}}\">Mulai Asesmen</a></p><p>Atau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:</p><ul><li><strong>Token:</strong> {{token}}</li></ul><p><em>Token asesmen ini akan aktif hingga: {{expiresAt}}.</em></p><p>Terima kasih,<br><strong>Tim HR EasyCorp</strong></p>"
    };
  }
}

export async function saveEmailTemplate(data: { subject: string; textTemplate: string; htmlTemplate: string }) {
  const role = await getUserRole();
  if (role !== 'superadmin' && role !== 'developer') {
    return { error: 'Unauthorized' };
  }
  
  try {
    await fs.writeFile(TEMPLATE_PATH, JSON.stringify(data, null, 2), 'utf-8');
    return { success: true };
  } catch (error: any) {
    console.error('Error saving template:', error);
    return { error: error.message };
  }
}
