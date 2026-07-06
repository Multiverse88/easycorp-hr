import fs from 'fs/promises';
import path from 'path';

export async function loadEmailTemplate() {
  const TEMPLATE_PATH = path.join(process.cwd(), 'src/lib/email-template.json');
  try {
    const data = await fs.readFile(TEMPLATE_PATH, 'utf-8');
    return JSON.parse(data);
  } catch (error) {
    return {
      subject: "Undangan Asesmen - EasyCorp",
      textTemplate: "Halo {{candidateName}},\n\nAnda diundang untuk mengikuti tahapan asesmen di EasyCorp untuk posisi {{position}}.\n\nSilakan akses tautan berikut untuk memulai:\n{{link}}\n\nAtau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:\nToken: {{token}}\n\nToken asesmen ini akan aktif hingga: {{expiresAt}}.\n\nTerima kasih,\nTim HR EasyCorp",
      htmlTemplate: "<p>Halo <strong>{{candidateName}}</strong>,</p><p>Anda diundang untuk mengikuti tahapan asesmen di EasyCorp untuk posisi <strong>{{position}}</strong>.</p><p>Silakan klik tombol di bawah ini untuk memulai:</p><p><a href=\"{{link}}\">Mulai Asesmen</a></p><p>Atau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:</p><ul><li><strong>Token:</strong> {{token}}</li></ul><p><em>Token asesmen ini akan aktif hingga: {{expiresAt}}.</em></p><p>Terima kasih,<br><strong>Tim HR EasyCorp</strong></p>"
    };
  }
}
