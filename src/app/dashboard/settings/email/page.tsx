import { getEmailTemplate } from '@/app/actions/email-template';
import { EmailTemplateForm } from './form';
import { getUserRole } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';

export default async function EmailSettingsPage() {
  const role = await getUserRole();
  if (role !== 'superadmin' && role !== 'developer') {
    redirect('/dashboard');
  }

  const template = await getEmailTemplate();

  return (
    <div className="max-w-4xl mx-auto py-8">
      <h1 className="text-2xl font-bold mb-2 text-slate-900">Pengaturan Template Email</h1>
      <p className="text-slate-500 mb-8">Sesuaikan pesan email yang akan dikirimkan ke kandidat saat mengundang mereka untuk asesmen.</p>

      <EmailTemplateForm initialTemplate={template} />
    </div>
  );
}
