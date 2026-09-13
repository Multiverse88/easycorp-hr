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
  loginLink: string;
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
    const templateData = await loadEmailTemplate();

    const textValues = {
      logoUrl: 'cid:logo-ec',
      candidateName: params.candidateName,
      position: params.position || 'Kandidat',
      link: params.link,
      loginLink: params.loginLink,
      token: params.token,
      expiresAt: formattedDate,
    };
    const escapeHtml = (value: string) => value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
    const renderTemplate = (template: string, values: Record<string, string>) =>
      Object.entries(values).reduce(
        (rendered, [key, value]) => rendered.replaceAll(`{{${key}}}`, value),
        template
      );
    const htmlValues = Object.fromEntries(
      Object.entries(textValues).map(([key, value]) => [key, key === 'logoUrl' ? value : escapeHtml(value)])
    );

    const mailOptions = {
      from: `"${fromName}" <${fromEmail}>`,
      to: params.candidateEmail,
      subject: renderTemplate(templateData.subject || 'Undangan Asesmen - EasyLegal', textValues),
      text: renderTemplate(templateData.textTemplate, textValues),
      html: renderTemplate(templateData.htmlTemplate, htmlValues),
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
