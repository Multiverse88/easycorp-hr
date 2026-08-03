import { Sidebar } from '@/components/sidebar';
import { getUserRole } from '@/lib/auth';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const role = await getUserRole();

  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar userRole={role} />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
