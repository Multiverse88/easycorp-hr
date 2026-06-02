'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
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
  ScrollText,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/manpower', label: 'Manpower Request', icon: FileText },
  { href: '/dashboard/kandidat', label: 'Kandidat', icon: Users },
  { href: '/dashboard/kandidat/new', label: 'Tambah Kandidat', icon: UserPlus },
  { href: '/dashboard/kandidat/analisa', label: 'Analisa Batch', icon: BarChart3 },
  { href: '/dashboard/export', label: 'Export & Laporan', icon: Download },
  { href: '/dashboard/logs', label: 'Log Aktivitas', icon: ScrollText },
];

export function Sidebar() {
  const pathname = usePathname();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    window.location.href = '/login';
  }

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-slate-900 text-slate-100 flex flex-col overflow-hidden">
      {/* Gradient overlay - Deep Burgundy/Crimson to Dark Charcoal */}
      <div className="absolute inset-0 bg-gradient-to-b from-[#3A0000] via-[#1F0000] to-[#0A0A0A] pointer-events-none" />

      {/* Decorative premium elements */}
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-[#9A0000] opacity-25 filter blur-xl pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-32 h-32 rounded-full bg-[#9A0000] opacity-15 filter blur-lg pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col h-full">
        {/* Logo */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-xl p-1.5 shadow-md shadow-black/40 flex items-center justify-center shrink-0 w-11 h-11">
              <img 
                src="/logo-easylegal.png" 
                alt="EasyLegal Logo" 
                className="w-auto h-8 object-contain"
              />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white leading-none">EasyLegal</div>
              <div className="text-[10px] text-red-200/60 font-bold tracking-widest uppercase mt-1">HR Portal</div>
            </div>
          </div>
        </div>

        {/* Separator */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {menuItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200',
                  isActive
                    ? 'bg-gradient-to-r from-[#9A0000] to-[#C80000] text-white shadow-lg shadow-[#9A0000]/40'
                    : 'text-red-100/60 hover:bg-white/5 hover:text-white'
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Separator */}
        <div className="mx-4 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

        {/* Logout */}
        <div className="p-3">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-semibold text-red-200/50 hover:bg-white/5 hover:text-white w-full transition-all duration-200"
          >
            <LogOut className="w-4 h-4" />
            Keluar
          </button>
        </div>
      </div>
    </div>
  );
}
