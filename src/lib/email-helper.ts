import defaultTemplate from './email-template.json';
import { prisma } from './prisma';

export type EmailTemplate = {
  subject: string;
  textTemplate: string;
  htmlTemplate: string;
};

const EMAIL_TEMPLATE_KEY = 'candidate_invitation_email';

export async function loadEmailTemplate(): Promise<EmailTemplate> {
  try {
    const setting = await prisma.appSetting.findUnique({ where: { key: EMAIL_TEMPLATE_KEY } });
    return setting?.value ? setting.value as unknown as EmailTemplate : defaultTemplate;
  } catch (error) {
    console.error('Gagal membaca template email:', error);
    return defaultTemplate;
  }
}

export async function persistEmailTemplate(template: EmailTemplate): Promise<void> {
  await prisma.appSetting.upsert({
    where: { key: EMAIL_TEMPLATE_KEY },
    create: { key: EMAIL_TEMPLATE_KEY, value: template },
    update: { value: template },
  });
}
