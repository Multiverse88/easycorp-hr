'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  FileText,
  Users,
  Download,
  LogOut,
  UserPlus,
  BarChart3,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/manpower', label: 'Manpower Request', icon: FileText },
  { href: '/dashboard/kandidat', label: 'Kandidat', icon: Users },
  { href: '/dashboard/kandidat/new', label: 'Tambah Kandidat', icon: UserPlus },
  { href: '/dashboard/kandidat/analisa', label: 'Analisa Batch', icon: BarChart3 },
  { href: '/dashboard/export', label: 'Export & Laporan', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push('/login');
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-sidebar text-sidebar-foreground flex flex-col overflow-hidden">
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-[hsl(350_25%_16%)] to-[hsl(350_30%_10%)] pointer-events-none" />

      {/* Decorative circle */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[hsl(350_40%_25%)] opacity-30 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-[hsl(350_35%_20%)] opacity-20 pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-br from-[hsl(350_60%_65%)] to-[hsl(350_70%_55%)] rounded-xl p-2.5 shadow-lg shadow-[hsl(350_50%_40%_/_0.3)]">
              <span className="text-white font-extrabold text-lg tracking-tight">EL</span>
            </div>
            <div>
              <div className="font-bold text-base tracking-tight">Easy Legal</div>
              <div className="text-xs text-[hsl(15_25%_60%)] font-medium">Recruitment</div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[hsl(350_25%_25%)] to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[hsl(350_50%_55%)] to-[hsl(350_55%_48%)] text-white shadow-lg shadow-[hsl(350_40%_30%_/_0.3)]'
                    : 'text-[hsl(15_25%_70%)] hover:bg-[hsl(350_20%_18%)] hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-[hsl(350_25%_25%)] to-transparent" />

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm text-[hsl(15_20%_60%)] hover:bg-[hsl(350_20%_18%)] hover:text-[hsl(350_60%_70%)] w-full transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
