import nodemailer from 'nodemailer';

export interface SendEmailResult {
  success: boolean;
  error?: string;
}

export interface InvitationEmailParams {
  candidateName: string;
  candidateEmail: string;
  position: string;
  token: string;
  link: string;
  expiresAt: string;
}

export async function sendAssessmentInvitation(params: InvitationEmailParams): Promise<SendEmailResult> {
  const host = process.env.SMTP_HOST;
  const port = process.env.SMTP_PORT;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASSWORD;
  const secure = process.env.SMTP_SECURE === 'true';
  const fromName = process.env.SMTP_FROM_NAME || 'EasyLegal Recruitment';
  const fromEmail = process.env.SMTP_FROM_EMAIL || user;

  // Validate presence of required env variables
  if (!host || !port || !user || !pass || !fromEmail) {
    console.warn('SMTP configuration is missing. Invitation email not sent.');
    return {
      success: false,
      error: 'SMTP_NOT_CONFIGURED',
    };
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: parseInt(port, 10),
      secure,
      auth: {
        user,
        pass,
      },
    });

    const formattedDate = new Date(params.expiresAt).toLocaleDateString('id-ID', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: params.candidateEmail,
      subject: 'Undangan Asesmen - EasyLegal',
      text: `Halo ${params.candidateName},

Anda diundang untuk mengikuti tahapan asesmen di EasyLegal untuk posisi ${params.position || 'Kandidat'}.

Silakan akses tautan berikut untuk memulai:
${params.link}

Atau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:
Token: ${params.token}
Tautan Asesmen: ${params.link}

Token asesmen ini akan aktif hingga: ${formattedDate}.

Terima kasih,
Tim HR EasyLegal`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Undangan Asesmen EasyLegal</title>
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
              background-color: #f8fafc;
              margin: 0;
              padding: 0;
              -webkit-font-smoothing: antialiased;
            }
            .wrapper {
              background-color: #f8fafc;
              width: 100%;
              padding: 40px 0;
            }
            .container {
              max-width: 600px;
              margin: 0 auto;
              background-color: #ffffff;
              border-radius: 16px;
              border: 1px border #e2e8f0;
              overflow: hidden;
              box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05), 0 2px 4px -1px rgba(0, 0, 0, 0.03);
            }
            .header {
              background-color: #991b1b; /* Rose/Red tone to match branding */
              padding: 32px;
              text-align: center;
            }
            .header h1 {
              color: #ffffff;
              margin: 0;
              font-size: 24px;
              font-weight: 800;
              letter-spacing: -0.025em;
            }
            .content {
              padding: 40px 32px;
              color: #334155;
              line-height: 1.6;
            }
            .content h2 {
              color: #0f172a;
              margin-top: 0;
              font-size: 20px;
              font-weight: 800;
            }
            .position-badge {
              display: inline-block;
              background-color: #f1f5f9;
              color: #475569;
              font-weight: 700;
              font-size: 14px;
              padding: 6px 12px;
              border-radius: 9999px;
              margin-bottom: 24px;
            }
            .btn-container {
              text-align: center;
              margin: 32px 0;
            }
            .btn {
              display: inline-block;
              background-color: #991b1b;
              color: #ffffff !important;
              font-weight: 800;
              font-size: 16px;
              text-decoration: none;
              padding: 16px 32px;
              border-radius: 12px;
              box-shadow: 0 10px 15px -3px rgba(153, 27, 27, 0.2);
              transition: background-color 0.2s;
            }
            .token-box {
              background-color: #f8fafc;
              border: 1px dashed #cbd5e1;
              border-radius: 12px;
              padding: 20px;
              text-align: center;
              margin: 24px 0;
            }
            .token-label {
              font-size: 12px;
              font-weight: 800;
              text-transform: uppercase;
              letter-spacing: 0.1em;
              color: #64748b;
              margin-bottom: 8px;
            }
            .token-value {
              font-family: monospace;
              font-size: 22px;
              font-weight: 800;
              color: #0f172a;
              letter-spacing: 0.05em;
            }
            .footer {
              background-color: #f1f5f9;
              padding: 24px 32px;
              text-align: center;
              font-size: 12px;
              color: #64748b;
              border-top: 1px solid #e2e8f0;
            }
            .footer p {
              margin: 4px 0;
            }
          </style>
        </head>
        <body>
          <div class="wrapper">
            <div class="container">
              <div class="header">
                <h1>EASYLEGAL RECRUITMENT</h1>
              </div>
              <div class="content">
                <h2>Halo ${params.candidateName},</h2>
                <p>Anda telah terdaftar sebagai kandidat dan diundang untuk mengikuti tahapan asesmen online di EasyLegal untuk posisi:</p>
                <div class="position-badge">${params.position || 'Kandidat'}</div>
                
                <p>Silakan klik tombol di bawah ini untuk memulai pengisian tes (DISC & WPT):</p>
                
                <div class="btn-container">
                  <a href="${params.link}" class="btn" target="_blank">Mulai Asesmen Sekarang</a>
                </div>

                <p>Jika tombol di atas tidak berfungsi, Anda juga dapat membuka langsung halaman masuk asesmen dan memasukkan kode akses unik Anda secara manual:</p>
                
                <div class="token-box">
                  <div class="token-label">Kode Akses Anda</div>
                  <div class="token-value">${params.token}</div>
                </div>

                <p style="font-size: 14px; color: #64748b;">
                  * Tautan dan kode akses ini bersifat rahasia serta berlaku hingga <strong>${formattedDate}</strong>.
                </p>
              </div>
              <div class="footer">
                <p>Email ini dikirim secara otomatis oleh Sistem Rekrutmen EasyLegal.</p>
                <p>&copy; ${new Date().getFullYear()} EasyLegal. All rights reserved.</p>
              </div>
            </div>
          </div>
        </body>
        </html>
      `,
    };

    await transporter.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Failed to send SMTP email:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown SMTP error',
    };
  }
}
