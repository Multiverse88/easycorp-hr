'use server';

import { getUserRole } from '@/lib/auth';
import {
  loadEmailTemplate,
  persistEmailTemplate,
  type EmailTemplate,
} from '@/lib/email-helper';

export async function getEmailTemplate(): Promise<EmailTemplate> {
  return loadEmailTemplate();
}

export async function saveEmailTemplate(data: EmailTemplate) {
  const role = await getUserRole();
  if (role !== 'superadmin' && role !== 'developer') {
    return { error: 'Unauthorized' };
  }

  if (!data.subject?.trim() || !data.textTemplate?.trim() || !data.htmlTemplate?.trim()) {
    return { error: 'Subjek, template teks, dan template HTML wajib diisi.' };
  }

  try {
    await persistEmailTemplate(data);
    return { success: true };
  } catch (error) {
    console.error('Error saving template:', error);
    return { error: error instanceof Error ? error.message : 'Gagal menyimpan template' };
  }
}
