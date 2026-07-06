import nodemailer from 'nodemailer';
import path from 'path';
import { loadEmailTemplate } from './email-helper';

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
  const fromName = process.env.SMTP_FROM_NAME || 'EasyCorp Recruitment';
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

    const templateData = await loadEmailTemplate();
    const processTemplate = (tmpl: string) => {
      return tmpl
        .replace(/{{logoUrl}}/g, 'cid:logo-ec')
        .replace(/{{candidateName}}/g, params.candidateName)
        .replace(/{{position}}/g, params.position || 'Kandidat')
        .replace(/{{link}}/g, params.link)
        .replace(/{{token}}/g, params.token)
        .replace(/{{expiresAt}}/g, formattedDate);
    };

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: params.candidateEmail,
      subject: processTemplate(templateData.subject || 'Undangan Asesmen - EasyCorp'),
      text: processTemplate(templateData.textTemplate),
      html: processTemplate(templateData.htmlTemplate),
      attachments: [
        {
          filename: 'logo-ec.png',
          path: path.join(process.cwd(), 'public', 'logo-ec.png'),
          cid: 'logo-ec',
        },
      ],
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
