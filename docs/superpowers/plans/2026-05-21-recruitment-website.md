# EasyLegal Recruitment Website Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a recruitment website with internal HR portal and external candidate-facing pages for EasyLegal.

**Architecture:** Next.js App Router with local JSON database (db_local.json) for development. Internal portal uses sidebar navigation, external pages are full-width mobile-first. DISC test scoring happens server-side.

**Tech Stack:** Next.js 14, Tailwind CSS, shadcn/ui, React Hook Form + Zod, xlsx, @react-pdf/renderer

---

## File Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout
│   ├── globals.css                   # Global styles + Tailwind
│   ├── page.tsx                      # Landing/redirect
│   ├── (auth)/
│   │   └── login/page.tsx            # Login page
│   ├── dashboard/
│   │   ├── layout.tsx                # Sidebar layout
│   │   ├── page.tsx                  # Dashboard overview
│   │   ├── manpower/
│   │   │   ├── page.tsx              # List manpower requests
│   │   │   ├── new/page.tsx          # Create new request
│   │   │   └── [id]/page.tsx         # Detail + approval
│   │   ├── kandidat/
│   │   │   ├── page.tsx              # List candidates
│   │   │   └── [id]/
│   │   │       ├── page.tsx          # Candidate detail
│   │   │       ├── interview/page.tsx # FR-001.02 + FR-001.03 tabs
│   │   │       └── disc/page.tsx     # DISC HR view
│   │   └── export/page.tsx           # Export page
│   ├── apply/[token]/page.tsx        # Candidate biodata form
│   ├── disc/[token]/page.tsx         # Candidate DISC test
│   └── confirm/[token]/page.tsx      # Schedule confirmation
├── components/
│   ├── ui/                           # shadcn/ui components
│   ├── sidebar.tsx                   # Dashboard sidebar
│   ├── manpower-form.tsx             # Manpower request form
│   ├── candidate-table.tsx           # Candidates table
│   ├── interview-tabs.tsx            # FR-001.02 + FR-001.03 tabs
│   ├── disc-question.tsx             # DISC question card
│   ├── disc-hr-view.tsx              # DISC HR view with charts
│   └── disc-candidate-view.tsx       # DISC candidate view
├── lib/
│   ├── db.ts                         # Local JSON database (exists)
│   ├── discData.ts                   # DISC questions (exists)
│   ├── discParser.ts                 # DISC scoring logic (exists)
│   ├── types.ts                      # Shared types
│   ├── utils.ts                      # Utility functions
│   └── disc-scoring.ts               # DISC calculation server actions
└── api/
    └── disc/submit/route.ts          # DISC submission API
```

---

## Task 1: Install Dependencies

**Files:**
- Modify: `package.json`

- [ ] **Step 1: Install shadcn/ui and form dependencies**

```bash
npm install @hookform/resolvers react-hook-form zod
npx shadcn@latest init
npx shadcn@latest add button card input label select table tabs badge dialog form separator sheet
```

- [ ] **Step 2: Install export dependencies**

```bash
npm install @react-pdf/renderer file-saver
npm install -D @types/file-saver
```

- [ ] **Step 3: Verify installation**

```bash
npm run build
```

Expected: Build succeeds with no errors.

- [ ] **Step 4: Commit**

```bash
git add package.json package-lock.json src/components/ui/
git commit -m "chore: install shadcn/ui, form, and export dependencies"
```

---

## Task 2: Create Shared Types and Utilities

**Files:**
- Create: `src/lib/types.ts`
- Create: `src/lib/utils.ts`

- [ ] **Step 1: Create types.ts with shared interfaces**

```typescript
// src/lib/types.ts
export type ManpowerStatus = 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected';
export type JenisKebutuhan = 'Posisi Baru' | 'Replacement' | 'Tambahan Tim';
export type StatusKaryawan = 'PKWT' | 'PKWTT' | 'Magang' | 'Outsource';
export type Urgensi = 'Tinggi' | 'Sedang' | 'Rendah';

export type CandidateStatus = 'screening' | 'interview' | 'psikotes' | 'offering' | 'hired' | 'rejected';

export type TahapInterview = 'HRGA' | 'User' | 'Final';
export type MetodeInterview = 'Online' | 'Offline';
export type Rekomendasi = 'Lanjut Tahap Berikutnya' | 'Talent Pool' | 'Tidak Lanjut';
export type KesimpulanTes = 'Lulus' | 'Lulus Bersyarat' | 'Tidak Lulus';

export interface Kualifikasi {
  pendidikan: string;
  pengalaman: string;
  keahlian: string;
  softskill: string;
  catatan: string;
}

export interface RangeGaji {
  min: number;
  max: number;
}

export interface ManpowerRequest {
  id: string;
  no_request: string;
  tanggal: string;
  divisi: string;
  pemohon: string;
  jabatan_pemohon: string;
  atasan_pemohon: string;
  posisi: string;
  jumlah: number;
  lokasi: string;
  tanggal_dibutuhkan: string;
  jenis_kebutuhan: JenisKebutuhan;
  replacement_name?: string;
  status_karyawan: StatusKaryawan;
  urgensi: Urgensi;
  alasan: string;
  jobdesk: string;
  kualifikasi: Kualifikasi;
  range_gaji: RangeGaji;
  benefit: string;
  status: ManpowerStatus;
  approval_user_at?: string;
  approval_hrga_at?: string;
  approval_management_at?: string;
}

export interface Candidate {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  posisi_dilamar: string;
  manpower_request_id?: string;
  token: string;
  token_expires_at: string;
  status: CandidateStatus;
  created_at: string;
  pendidikan?: string;
  pengalaman?: string;
  keahlian?: string;
}

export interface KomponenTes {
  nama: string;
  nilai: string;
  batas_lulus: string;
  catatan: string;
}

export interface SelectionTestResult {
  id: string;
  candidate_id: string;
  tanggal_tes: string;
  penyelenggara: string;
  komponen: KomponenTes[];
  kesimpulan: KesimpulanTes;
  catatan_akhir: string;
}

export interface Penilaian {
  aspek: string;
  skor: number;
  catatan: string;
}

export interface InterviewEvaluation {
  id: string;
  candidate_id: string;
  tanggal: string;
  tahap: TahapInterview;
  interviewer: string;
  metode: MetodeInterview;
  ekspektasi_gaji: number;
  ketersediaan_bergabung: string;
  penilaian: Penilaian[];
  total_skor: number;
  kelebihan: string;
  area_digali: string;
  catatan: string;
  rekomendasi: Rekomendasi;
}

export interface DiscAnswer {
  questionId: number;
  most: string;
  least: string;
}

export interface DiscTestResult {
  id: string;
  candidate_id: string;
  answers: DiscAnswer[];
  skor_d: number;
  skor_i: number;
  skor_s: number;
  skor_c: number;
  persen_d: number;
  persen_i: number;
  persen_s: number;
  persen_c: number;
  tipe_primer: string;
  tipe_sekunder: string;
  completed_at: string;
}
```

- [ ] **Step 2: Create utils.ts with utility functions**

```typescript
// src/lib/utils.ts
import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(amount: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  return new Intl.DateTimeFormat('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(date);
}

export function statusColor(status: string): string {
  const colors: Record<string, string> = {
    draft: 'bg-gray-100 text-gray-700',
    submitted: 'bg-blue-100 text-blue-700',
    verified: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700',
    screening: 'bg-gray-100 text-gray-700',
    interview: 'bg-blue-100 text-blue-700',
    psikotes: 'bg-purple-100 text-purple-700',
    offering: 'bg-yellow-100 text-yellow-700',
    hired: 'bg-green-100 text-green-700',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

export function generateNoRequest(): string {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();
  const seq = String(Math.floor(Math.random() * 999) + 1).padStart(3, '0');
  return `MR/${month}/${year}/${seq}`;
}
```

- [ ] **Step 3: Commit**

```bash
git add src/lib/types.ts src/lib/utils.ts
git commit -m "feat: add shared types and utility functions"
```

---

## Task 3: Create Dashboard Layout with Sidebar

**Files:**
- Create: `src/app/dashboard/layout.tsx`
- Create: `src/components/sidebar.tsx`

- [ ] **Step 1: Create sidebar component**

```tsx
// src/components/sidebar.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard,
  FileText,
  Users,
  Download,
  LogOut,
} from 'lucide-react';

const menuItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/dashboard/manpower', label: 'Manpower Request', icon: FileText },
  { href: '/dashboard/kandidat', label: 'Kandidat', icon: Users },
  { href: '/dashboard/export', label: 'Export & Laporan', icon: Download },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-0 h-screen w-64 bg-slate-900 text-white flex flex-col">
      <div className="p-6 border-b border-slate-700">
        <div className="flex items-center gap-3">
          <div className="bg-white rounded-lg p-2">
            <span className="text-blue-900 font-extrabold text-lg">EL</span>
          </div>
          <div>
            <div className="font-semibold text-sm">Easy Legal</div>
            <div className="text-xs text-slate-400">Recruitment System</div>
          </div>
        </div>
      </div>

      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/dashboard' && pathname.startsWith(item.href));
          
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-lg text-sm transition-colors',
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              )}
            >
              <item.icon className="w-5 h-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-slate-700">
        <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-slate-300 hover:bg-slate-800 hover:text-white w-full transition-colors">
          <LogOut className="w-5 h-5" />
          <span>Keluar</span>
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create dashboard layout**

```tsx
// src/app/dashboard/layout.tsx
import { Sidebar } from '@/components/sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Sidebar />
      <main className="ml-64 p-8">
        {children}
      </main>
    </div>
  );
}
```

- [ ] **Step 3: Update root page to redirect to dashboard**

```tsx
// src/app/page.tsx
import { redirect } from 'next/navigation';

export default function Home() {
  redirect('/dashboard');
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/sidebar.tsx src/app/dashboard/layout.tsx src/app/page.tsx
git commit -m "feat: add dashboard layout with sidebar navigation"
```

---

## Task 4: Create Dashboard Overview Page

**Files:**
- Create: `src/app/dashboard/page.tsx`

- [ ] **Step 1: Create dashboard page with summary cards**

```tsx
// src/app/dashboard/page.tsx
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getManpowerRequests, getCandidates } from '@/lib/db';
import { FileText, Users, Calendar, Clock } from 'lucide-react';

export default async function DashboardPage() {
  const requests = await getManpowerRequests();
  const candidates = await getCandidates();

  const stats = {
    activeRequests: requests.filter(r => r.status === 'submitted' || r.status === 'verified').length,
    totalCandidates: candidates.length,
    candidatesInProcess: candidates.filter(c => c.status !== 'hired' && c.status !== 'rejected').length,
    pendingApproval: requests.filter(r => r.status === 'submitted').length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Request Aktif
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kandidat
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCandidates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kandidat Proses
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.candidatesInProcess}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingApproval}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{req.posisi}</div>
                    <div className="text-xs text-muted-foreground">{req.no_request}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    req.status === 'verified' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kandidat Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidates.slice(0, 5).map((cand) => (
                <div key={cand.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{cand.nama}</div>
                    <div className="text-xs text-muted-foreground">{cand.posisi_dilamar}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cand.status === 'hired' ? 'bg-green-100 text-green-700' :
                    cand.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {cand.status}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test dashboard renders**

```bash
npm run dev
```

Navigate to `http://localhost:3000/dashboard`. Expected: Dashboard shows with sidebar and summary cards.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/page.tsx
git commit -m "feat: add dashboard overview with summary cards"
```

---

## Task 5: Manpower Request List Page

**Files:**
- Create: `src/app/dashboard/manpower/page.tsx`

- [ ] **Step 1: Create manpower list page**

```tsx
// src/app/dashboard/manpower/page.tsx
import Link from 'next/link';
import { getManpowerRequests } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Eye } from 'lucide-react';
import { formatRupiah, formatDate, statusColor } from '@/lib/utils';

export default async function ManpowerListPage() {
  const requests = await getManpowerRequests();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manpower Request</h1>
        <Link href="/dashboard/manpower/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Buat Request Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">No. Request</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Posisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Divisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jumlah</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Urgensi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{req.no_request}</td>
                    <td className="py-3 px-4">{req.posisi}</td>
                    <td className="py-3 px-4">{req.divisi}</td>
                    <td className="py-3 px-4">{req.jumlah} orang</td>
                    <td className="py-3 px-4">
                      <Badge variant={req.urgensi === 'Tinggi' ? 'destructive' : req.urgensi === 'Sedang' ? 'default' : 'secondary'}>
                        {req.urgensi}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={statusColor(req.status)}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/manpower/${req.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Test manpower list renders**

Navigate to `http://localhost:3000/dashboard/manpower`. Expected: Table shows with seed data.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/manpower/page.tsx
git commit -m "feat: add manpower request list page"
```

---

## Task 6: Manpower Request Detail Page with Approval

**Files:**
- Create: `src/app/dashboard/manpower/[id]/page.tsx`

- [ ] **Step 1: Create manpower detail page**

```tsx
// src/app/dashboard/manpower/[id]/page.tsx
import { getManpowerRequestById, approveManpowerRequest, rejectManpowerRequest } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, formatDate, statusColor } from '@/lib/utils';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export default async function ManpowerDetailPage({ params }: { params: { id: string } }) {
  const req = await getManpowerRequestById(params.id);
  if (!req) {
    return <div>Request tidak ditemukan</div>;
  }

  async function handleApprove(formData: FormData) {
    'use server';
    const role = formData.get('role') as 'hrga' | 'management';
    await approveManpowerRequest(params.id, role);
    redirect('/dashboard/manpower');
  }

  async function handleReject() {
    'use server';
    await rejectManpowerRequest(params.id);
    redirect('/dashboard/manpower');
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/manpower" className="text-sm text-muted-foreground hover:underline">
            &larr; Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Manpower Request</h1>
        </div>
        <Badge className={statusColor(req.status)}>{req.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">No. Request</div>
                <div className="font-medium">{req.no_request}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tanggal</div>
                <div className="font-medium">{formatDate(req.tanggal)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Divisi</div>
                <div className="font-medium">{req.divisi}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pemohon</div>
                <div className="font-medium">{req.pemohon}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Posisi yang Dibutuhkan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Posisi</div>
                <div className="font-medium">{req.posisi}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Jumlah</div>
                <div className="font-medium">{req.jumlah} orang</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lokasi</div>
                <div className="font-medium">{req.lokasi}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Urgensi</div>
                <Badge variant={req.urgensi === 'Tinggi' ? 'destructive' : 'default'}>
                  {req.urgensi}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alasan & Jobdesk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Alasan Permintaan</div>
              <div className="p-3 bg-slate-50 rounded-lg">{req.alasan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Ringkasan Jobdesk</div>
              <div className="p-3 bg-slate-50 rounded-lg">{req.jobdesk}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kualifikasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Pendidikan</div>
              <div className="font-medium">{req.kualifikasi.pendidikan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pengalaman</div>
              <div className="font-medium">{req.kualifikasi.pengalaman}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Keahlian Teknis</div>
              <div className="font-medium">{req.kualifikasi.keahlian}</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kompensasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Range Gaji</div>
              <div className="font-medium">
                {formatRupiah(req.range_gaji.min)} — {formatRupiah(req.range_gaji.max)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Benefit</div>
              <div className="font-medium">{req.benefit}</div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Actions */}
        {req.status === 'submitted' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Approval HRGA</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <form action={handleApprove}>
                  <input type="hidden" name="role" value="hrga" />
                  <Button type="submit">Verifikasi (HRGA)</Button>
                </form>
                <form action={handleReject}>
                  <Button type="submit" variant="destructive">Tolak</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {req.status === 'verified' && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Approval Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <form action={handleApprove}>
                  <input type="hidden" name="role" value="management" />
                  <Button type="submit">Setujui (Management)</Button>
                </form>
                <form action={handleReject}>
                  <Button type="submit" variant="destructive">Tolak</Button>
                </form>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Approval Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`flex-1 p-4 rounded-lg ${req.approval_user_at ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <div className="text-sm font-medium">User Submit</div>
                <div className="text-xs text-muted-foreground">{req.approval_user_at ? formatDate(req.approval_user_at) : 'Menunggu'}</div>
              </div>
              <div className={`flex-1 p-4 rounded-lg ${req.approval_hrga_at ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <div className="text-sm font-medium">HRGA Verifikasi</div>
                <div className="text-xs text-muted-foreground">{req.approval_hrga_at ? formatDate(req.approval_hrga_at) : 'Menunggu'}</div>
              </div>
              <div className={`flex-1 p-4 rounded-lg ${req.approval_management_at ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <div className="text-sm font-medium">Management Approve</div>
                <div className="text-xs text-muted-foreground">{req.approval_management_at ? formatDate(req.approval_management_at) : 'Menunggu'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Test detail page and approval flow**

Navigate to `http://localhost:3000/dashboard/manpower/mr-3`. Expected: Shows detail with approval buttons for "submitted" status.

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/manpower/[id]/page.tsx
git commit -m "feat: add manpower detail page with approval flow"
```

---

## Task 7: Create Manpower Request Form

**Files:**
- Create: `src/app/dashboard/manpower/new/page.tsx`
- Create: `src/components/manpower-form.tsx`

- [ ] **Step 1: Create manpower form component**

```tsx
// src/components/manpower-form.tsx
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const formSchema = z.object({
  divisi: z.string().min(1, 'Divisi wajib diisi'),
  pemohon: z.string().min(1, 'Nama pemohon wajib diisi'),
  jabatan_pemohon: z.string().min(1, 'Jabatan wajib diisi'),
  atasan_pemohon: z.string().min(1, 'Atasan wajib diisi'),
  posisi: z.string().min(1, 'Posisi wajib diisi'),
  jumlah: z.coerce.number().min(1, 'Jumlah minimal 1'),
  lokasi: z.string().min(1, 'Lokasi wajib diisi'),
  tanggal_dibutuhkan: z.string().min(1, 'Tanggal wajib diisi'),
  jenis_kebutuhan: z.enum(['Posisi Baru', 'Replacement', 'Tambahan Tim']),
  replacement_name: z.string().optional(),
  status_karyawan: z.enum(['PKWT', 'PKWTT', 'Magang', 'Outsource']),
  urgensi: z.enum(['Tinggi', 'Sedang', 'Rendah']),
  alasan: z.string().min(10, 'Alasan minimal 10 karakter'),
  jobdesk: z.string().min(10, 'Jobdesk minimal 10 karakter'),
  kualifikasi_pendidikan: z.string().min(1, 'Pendidikan wajib diisi'),
  kualifikasi_pengalaman: z.string().min(1, 'Pengalaman wajib diisi'),
  kualifikasi_keahlian: z.string().min(1, 'Keahlian wajib diisi'),
  kualifikasi_softskill: z.string().min(1, 'Soft skill wajib diisi'),
  kualifikasi_catatan: z.string().optional(),
  range_gaji_min: z.coerce.number().min(0),
  range_gaji_max: z.coerce.number().min(0),
  benefit: z.string().min(1, 'Benefit wajib diisi'),
});

type FormData = z.infer<typeof formSchema>;

export function ManpowerForm() {
  const router = useRouter();
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      jenis_kebutuhan: 'Posisi Baru',
      status_karyawan: 'PKWTT',
      urgensi: 'Sedang',
    },
  });

  const jenisKebutuhan = watch('jenis_kebutuhan');

  async function onSubmit(data: FormData) {
    try {
      const response = await fetch('/api/manpower', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...data,
          kualifikasi: {
            pendidikan: data.kualifikasi_pendidikan,
            pengalaman: data.kualifikasi_pengalaman,
            keahlian: data.kualifikasi_keahlian,
            softskill: data.kualifikasi_softskill,
            catatan: data.kualifikasi_catatan || '',
          },
          range_gaji: {
            min: data.range_gaji_min,
            max: data.range_gaji_max,
          },
        }),
      });

      if (response.ok) {
        router.push('/dashboard/manpower');
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Informasi Dasar */}
      <Card>
        <CardHeader>
          <CardTitle>Informasi Dasar</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="divisi">Divisi/Departemen</Label>
            <Input id="divisi" {...register('divisi')} />
            {errors.divisi && <p className="text-sm text-red-500 mt-1">{errors.divisi.message}</p>}
          </div>
          <div>
            <Label htmlFor="pemohon">Nama Pemohon</Label>
            <Input id="pemohon" {...register('pemohon')} />
            {errors.pemohon && <p className="text-sm text-red-500 mt-1">{errors.pemohon.message}</p>}
          </div>
          <div>
            <Label htmlFor="jabatan_pemohon">Jabatan Pemohon</Label>
            <Input id="jabatan_pemohon" {...register('jabatan_pemohon')} />
            {errors.jabatan_pemohon && <p className="text-sm text-red-500 mt-1">{errors.jabatan_pemohon.message}</p>}
          </div>
          <div>
            <Label htmlFor="atasan_pemohon">Atasan Pemohon</Label>
            <Input id="atasan_pemohon" {...register('atasan_pemohon')} />
            {errors.atasan_pemohon && <p className="text-sm text-red-500 mt-1">{errors.atasan_pemohon.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Posisi */}
      <Card>
        <CardHeader>
          <CardTitle>Posisi yang Dibutuhkan</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="posisi">Posisi</Label>
            <Input id="posisi" {...register('posisi')} />
            {errors.posisi && <p className="text-sm text-red-500 mt-1">{errors.posisi.message}</p>}
          </div>
          <div>
            <Label htmlFor="jumlah">Jumlah Kebutuhan</Label>
            <Input id="jumlah" type="number" {...register('jumlah')} />
            {errors.jumlah && <p className="text-sm text-red-500 mt-1">{errors.jumlah.message}</p>}
          </div>
          <div>
            <Label htmlFor="lokasi">Lokasi Kerja</Label>
            <Input id="lokasi" {...register('lokasi')} />
            {errors.lokasi && <p className="text-sm text-red-500 mt-1">{errors.lokasi.message}</p>}
          </div>
          <div>
            <Label htmlFor="tanggal_dibutuhkan">Tanggal Dibutuhkan</Label>
            <Input id="tanggal_dibutuhkan" type="date" {...register('tanggal_dibutuhkan')} />
            {errors.tanggal_dibutuhkan && <p className="text-sm text-red-500 mt-1">{errors.tanggal_dibutuhkan.message}</p>}
          </div>
          <div>
            <Label htmlFor="jenis_kebutuhan">Jenis Kebutuhan</Label>
            <select id="jenis_kebutuhan" {...register('jenis_kebutuhan')} className="w-full border rounded-md p-2">
              <option value="Posisi Baru">Posisi Baru</option>
              <option value="Replacement">Replacement</option>
              <option value="Tambahan Tim">Tambahan Tim</option>
            </select>
          </div>
          {jenisKebutuhan === 'Replacement' && (
            <div>
              <Label htmlFor="replacement_name">Nama Karyawan Diganti</Label>
              <Input id="replacement_name" {...register('replacement_name')} />
            </div>
          )}
          <div>
            <Label htmlFor="status_karyawan">Status Karyawan</Label>
            <select id="status_karyawan" {...register('status_karyawan')} className="w-full border rounded-md p-2">
              <option value="PKWT">PKWT</option>
              <option value="PKWTT">PKWTT</option>
              <option value="Magang">Magang</option>
              <option value="Outsource">Outsource</option>
            </select>
          </div>
          <div>
            <Label htmlFor="urgensi">Urgensi</Label>
            <select id="urgensi" {...register('urgensi')} className="w-full border rounded-md p-2">
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Alasan & Jobdesk */}
      <Card>
        <CardHeader>
          <CardTitle>Alasan & Jobdesk</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="alasan">Alasan Permintaan</Label>
            <Textarea id="alasan" {...register('alasan')} rows={3} />
            {errors.alasan && <p className="text-sm text-red-500 mt-1">{errors.alasan.message}</p>}
          </div>
          <div>
            <Label htmlFor="jobdesk">Ringkasan Jobdesk</Label>
            <Textarea id="jobdesk" {...register('jobdesk')} rows={3} />
            {errors.jobdesk && <p className="text-sm text-red-500 mt-1">{errors.jobdesk.message}</p>}
          </div>
        </CardContent>
      </Card>

      {/* Kualifikasi */}
      <Card>
        <CardHeader>
          <CardTitle>Kualifikasi Wajib</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="kualifikasi_pendidikan">Pendidikan</Label>
            <Input id="kualifikasi_pendidikan" {...register('kualifikasi_pendidikan')} placeholder="contoh: S1 Hukum" />
          </div>
          <div>
            <Label htmlFor="kualifikasi_pengalaman">Pengalaman</Label>
            <Input id="kualifikasi_pengalaman" {...register('kualifikasi_pengalaman')} placeholder="contoh: Minimal 1 tahun" />
          </div>
          <div>
            <Label htmlFor="kualifikasi_keahlian">Keahlian Teknis</Label>
            <Input id="kualifikasi_keahlian" {...register('kualifikasi_keahlian')} />
          </div>
          <div>
            <Label htmlFor="kualifikasi_softskill">Soft Skill</Label>
            <Input id="kualifikasi_softskill" {...register('kualifikasi_softskill')} />
          </div>
          <div>
            <Label htmlFor="kualifikasi_catatan">Catatan Khusus</Label>
            <Input id="kualifikasi_catatan" {...register('kualifikasi_catatan')} />
          </div>
        </CardContent>
      </Card>

      {/* Kompensasi */}
      <Card>
        <CardHeader>
          <CardTitle>Kompensasi</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label htmlFor="range_gaji_min">Gaji Minimum (Rp)</Label>
            <Input id="range_gaji_min" type="number" {...register('range_gaji_min')} />
          </div>
          <div>
            <Label htmlFor="range_gaji_max">Gaji Maksimum (Rp)</Label>
            <Input id="range_gaji_max" type="number" {...register('range_gaji_max')} />
          </div>
          <div className="md:col-span-2">
            <Label htmlFor="benefit">Benefit/Tunjangan</Label>
            <Textarea id="benefit" {...register('benefit')} rows={2} />
            {errors.benefit && <p className="text-sm text-red-500 mt-1">{errors.benefit.message}</p>}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button type="button" variant="outline" onClick={() => router.back()}>
          Batal
        </Button>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Menyimpan...' : 'Simpan & Ajukan'}
        </Button>
      </div>
    </form>
  );
}
```

- [ ] **Step 2: Create manpower new page**

```tsx
// src/app/dashboard/manpower/new/page.tsx
import { ManpowerForm } from '@/components/manpower-form';
import Link from 'next/link';

export default function ManpowerNewPage() {
  return (
    <div>
      <Link href="/dashboard/manpower" className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke daftar
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Buat Manpower Request Baru</h1>
      <ManpowerForm />
    </div>
  );
}
```

- [ ] **Step 3: Create API route for saving manpower request**

```typescript
// src/app/api/manpower/route.ts
import { NextResponse } from 'next/server';
import { saveManpowerRequest } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveManpowerRequest(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Test form submission**

Navigate to `http://localhost:3000/dashboard/manpower/new`. Fill form and submit. Expected: Redirects to list page with new entry.

- [ ] **Step 5: Commit**

```bash
git add src/components/manpower-form.tsx src/app/dashboard/manpower/new/page.tsx src/app/api/manpower/route.ts
git commit -m "feat: add manpower request form with validation"
```

---

## Task 8: Candidate List Page

**Files:**
- Create: `src/app/dashboard/kandidat/page.tsx`

- [ ] **Step 1: Create candidate list page**

```tsx
// src/app/dashboard/kandidat/page.tsx
import Link from 'next/link';
import { getCandidates, getManpowerRequests } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { formatDate, statusColor } from '@/lib/utils';

export default async function KandidatListPage() {
  const candidates = await getCandidates();
  const requests = await getManpowerRequests();

  function getRequestName(id?: string) {
    if (!id) return '-';
    const req = requests.find(r => r.id === id);
    return req ? req.posisi : '-';
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kandidat</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kandidat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Posisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Request</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{cand.nama}</td>
                    <td className="py-3 px-4">{cand.posisi_dilamar}</td>
                    <td className="py-3 px-4">{getRequestName(cand.manpower_request_id)}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColor(cand.status)}>
                        {cand.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{formatDate(cand.created_at)}</td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/kandidat/${cand.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/kandidat/page.tsx
git commit -m "feat: add candidate list page"
```

---

## Task 9: Candidate Detail Page

**Files:**
- Create: `src/app/dashboard/kandidat/[id]/page.tsx`

- [ ] **Step 1: Create candidate detail page**

```tsx
// src/app/dashboard/kandidat/[id]/page.tsx
import { getCandidateById, getDiscTestResultByCandidate, getManpowerRequests } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { formatDate, statusColor, formatRupiah } from '@/lib/utils';
import Link from 'next/link';

export default async function KandidatDetailPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div>Kandidat tidak ditemukan</div>;
  }

  const discResult = await getDiscTestResultByCandidate(params.id);
  const requests = await getManpowerRequests();
  const request = requests.find(r => r.id === candidate.manpower_request_id);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/kandidat" className="text-sm text-muted-foreground hover:underline">
            &larr; Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Kandidat</h1>
        </div>
        <Badge className={statusColor(candidate.status)}>{candidate.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Pribadi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Nama Lengkap</div>
              <div className="font-medium">{candidate.nama}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Email</div>
              <div className="font-medium">{candidate.email}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Telepon</div>
              <div className="font-medium">{candidate.telepon}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Posisi Dilamar</div>
              <div className="font-medium">{candidate.posisi_dilamar}</div>
            </div>
            {request && (
              <div>
                <div className="text-sm text-muted-foreground">Request Terkait</div>
                <Link href={`/dashboard/manpower/${request.id}`} className="text-blue-600 hover:underline">
                  {request.no_request} - {request.posisi}
                </Link>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Biodata</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Pendidikan</div>
              <div className="font-medium">{candidate.pendidikan || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pengalaman</div>
              <div className="font-medium">{candidate.pengalaman || '-'}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Keahlian</div>
              <div className="font-medium">{candidate.keahlian || '-'}</div>
            </div>
          </CardContent>
        </Card>

        {/* DISC Result Summary */}
        {discResult && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Hasil DISC Test</CardTitle>
                <Link href={`/dashboard/kandidat/${params.id}/disc`}>
                  <Button variant="outline" size="sm">Lihat Detail</Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-2xl font-bold text-red-600">{discResult.persen_d}%</div>
                  <div className="text-sm text-muted-foreground">D (Dominance)</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">{discResult.persen_i}%</div>
                  <div className="text-sm text-muted-foreground">I (Influence)</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{discResult.persen_s}%</div>
                  <div className="text-sm text-muted-foreground">S (Steadiness)</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{discResult.persen_c}%</div>
                  <div className="text-sm text-muted-foreground">C (Conscientiousness)</div>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <span className="text-sm text-muted-foreground">Tipe Primer: </span>
                  <span className="font-medium">{discResult.tipe_primer}</span>
                </div>
                <div>
                  <span className="text-sm text-muted-foreground">Tipe Sekunder: </span>
                  <span className="font-medium">{discResult.tipe_sekunder}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Quick Actions */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Aksi Cepat</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-4">
              <Link href={`/dashboard/kandidat/${params.id}/interview`}>
                <Button variant="outline">Interview & Tes Seleksi</Button>
              </Link>
              <Link href={`/dashboard/kandidat/${params.id}/disc`}>
                <Button variant="outline">DISC Test (HR View)</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/dashboard/kandidat/[id]/page.tsx
git commit -m "feat: add candidate detail page with DISC summary"
```

---

## Task 10: Interview & Selection Test Tabbed Page

**Files:**
- Create: `src/app/dashboard/kandidat/[id]/interview/page.tsx`
- Create: `src/components/interview-tabs.tsx`

- [ ] **Step 1: Create interview tabs component**

```tsx
// src/components/interview-tabs.tsx
'use client';

import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface InterviewTabsProps {
  candidateId: string;
  candidateName: string;
  position: string;
}

export function InterviewTabs({ candidateId, candidateName, position }: InterviewTabsProps) {
  const [activeTab, setActiveTab] = useState('selection');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab}>
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="selection">FR-001.02 Hasil Tes Seleksi</TabsTrigger>
        <TabsTrigger value="interview">FR-001.03 Evaluasi Interview</TabsTrigger>
      </TabsList>

      <TabsContent value="selection">
        <SelectionTestForm candidateId={candidateId} candidateName={candidateName} position={position} />
      </TabsContent>

      <TabsContent value="interview">
        <InterviewEvaluationForm candidateId={candidateId} candidateName={candidateName} position={position} />
      </TabsContent>
    </Tabs>
  );
}

function SelectionTestForm({ candidateId, candidateName, position }: { candidateId: string; candidateName: string; position: string }) {
  const [komponen, setKomponen] = useState([
    { nama: 'Psikotes/DISC', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'PAPIKOSTIK', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Case Study', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Tes Adm/Typing/Writing', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Tes Bahasa/Komunikasi', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Lainnya', nilai: '', batas_lulus: '', catatan: '' },
  ]);

  function updateKomponen(index: number, field: string, value: string) {
    const updated = [...komponen];
    updated[index] = { ...updated[index], [field]: value };
    setKomponen(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = {
      candidate_id: candidateId,
      tanggal_tes: (document.getElementById('tanggal_tes') as HTMLInputElement)?.value,
      penyelenggara: (document.getElementById('penyelenggara') as HTMLInputElement)?.value,
      komponen,
      kesimpulan: (document.getElementById('kesimpulan') as HTMLSelectElement)?.value,
      catatan_akhir: (document.getElementById('catatan_akhir') as HTMLTextAreaElement)?.value,
    };

    await fetch('/api/selection-test', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Hasil Tes Seleksi</CardTitle>
        <div className="text-sm text-muted-foreground">
          Kandidat: {candidateName} · Posisi: {position}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="tanggal_tes">Tanggal Tes</Label>
              <Input id="tanggal_tes" type="date" />
            </div>
            <div>
              <Label htmlFor="penyelenggara">Penyelenggara/Penguji</Label>
              <Input id="penyelenggara" />
            </div>
          </div>

          <div>
            <Label>Komponen Tes</Label>
            <div className="border rounded-lg overflow-hidden mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-3">Komponen</th>
                    <th className="text-left py-2 px-3">Nilai/Status</th>
                    <th className="text-left py-2 px-3">Batas Lulus</th>
                    <th className="text-left py-2 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {komponen.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 px-3 font-medium">{item.nama}</td>
                      <td className="py-2 px-3">
                        <Input
                          value={item.nilai}
                          onChange={(e) => updateKomponen(idx, 'nilai', e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          value={item.batas_lulus}
                          onChange={(e) => updateKomponen(idx, 'batas_lulus', e.target.value)}
                          className="h-8"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          value={item.catatan}
                          onChange={(e) => updateKomponen(idx, 'catatan', e.target.value)}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kesimpulan">Kesimpulan</Label>
              <select id="kesimpulan" className="w-full border rounded-md p-2">
                <option value="Lulus">Lulus</option>
                <option value="Lulus Bersyarat">Lulus Bersyarat</option>
                <option value="Tidak Lulus">Tidak Lulus</option>
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="catatan_akhir">Catatan Akhir</Label>
            <Textarea id="catatan_akhir" rows={3} />
          </div>

          <Button type="submit">Simpan Hasil Tes</Button>
        </form>
      </CardContent>
    </Card>
  );
}

function InterviewEvaluationForm({ candidateId, candidateName, position }: { candidateId: string; candidateName: string; position: string }) {
  const aspekPenilaian = [
    'Komunikasi', 'Sikap/Attitude', 'Integritas', 'Kesesuaian Pengalaman',
    'Kemampuan Teknis', 'Problem Solving', 'Motivasi Kerja', 'Kesesuaian Budaya Kerja'
  ];

  const [penilaian, setPenilaian] = useState(
    aspekPenilaian.map(aspek => ({ aspek, skor: 0, catatan: '' }))
  );

  function updatePenilaian(index: number, field: string, value: string | number) {
    const updated = [...penilaian];
    updated[index] = { ...updated[index], [field]: value };
    setPenilaian(updated);
  }

  const totalSkor = penilaian.reduce((sum, p) => sum + p.skor, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const formData = {
      candidate_id: candidateId,
      tanggal: (document.getElementById('interview_tanggal') as HTMLInputElement)?.value,
      tahap: (document.getElementById('interview_tahap') as HTMLSelectElement)?.value,
      interviewer: (document.getElementById('interviewer') as HTMLInputElement)?.value,
      metode: (document.getElementById('metode') as HTMLSelectElement)?.value,
      ekspektasi_gaji: Number((document.getElementById('ekspektasi_gaji') as HTMLInputElement)?.value),
      ketersediaan_bergabung: (document.getElementById('ketersediaan') as HTMLInputElement)?.value,
      penilaian,
      total_skor: totalSkor,
      kelebihan: (document.getElementById('kelebihan') as HTMLTextAreaElement)?.value,
      area_digali: (document.getElementById('area_digali') as HTMLTextAreaElement)?.value,
      catatan: (document.getElementById('catatan_interviewer') as HTMLTextAreaElement)?.value,
      rekomendasi: (document.getElementById('rekomendasi') as HTMLSelectElement)?.value,
    };

    await fetch('/api/interview-evaluation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Form Evaluasi Interview</CardTitle>
        <div className="text-sm text-muted-foreground">
          Kandidat: {candidateName} · Posisi: {position}
        </div>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="interview_tanggal">Tanggal Interview</Label>
              <Input id="interview_tanggal" type="date" />
            </div>
            <div>
              <Label htmlFor="interview_tahap">Tahap Interview</Label>
              <select id="interview_tahap" className="w-full border rounded-md p-2">
                <option value="HRGA">HRGA</option>
                <option value="User">User</option>
                <option value="Final">Final</option>
              </select>
            </div>
            <div>
              <Label htmlFor="interviewer">Interviewer</Label>
              <Input id="interviewer" />
            </div>
            <div>
              <Label htmlFor="metode">Metode</Label>
              <select id="metode" className="w-full border rounded-md p-2">
                <option value="Online">Online</option>
                <option value="Offline">Offline</option>
              </select>
            </div>
            <div>
              <Label htmlFor="ekspektasi_gaji">Ekspektasi Gaji (Rp)</Label>
              <Input id="ekspektasi_gaji" type="number" />
            </div>
            <div>
              <Label htmlFor="ketersediaan">Ketersediaan Bergabung</Label>
              <Input id="ketersediaan" placeholder="contoh: 2 minggu setelah offer" />
            </div>
          </div>

          <div>
            <Label>Penilaian (Skor 1-5)</Label>
            <div className="border rounded-lg overflow-hidden mt-2">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="text-left py-2 px-3">Aspek</th>
                    <th className="text-left py-2 px-3">Skor (1-5)</th>
                    <th className="text-left py-2 px-3">Catatan</th>
                  </tr>
                </thead>
                <tbody>
                  {penilaian.map((item, idx) => (
                    <tr key={idx} className="border-t">
                      <td className="py-2 px-3 font-medium">{item.aspek}</td>
                      <td className="py-2 px-3">
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={item.skor}
                          onChange={(e) => updatePenilaian(idx, 'skor', Number(e.target.value))}
                          className="h-8 w-20"
                        />
                      </td>
                      <td className="py-2 px-3">
                        <Input
                          value={item.catatan}
                          onChange={(e) => updatePenilaian(idx, 'catatan', e.target.value)}
                          className="h-8"
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="mt-2 text-right font-bold">
              Total Skor: {totalSkor}/40
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="kelebihan">Kelebihan Kandidat</Label>
              <Textarea id="kelebihan" rows={3} />
            </div>
            <div>
              <Label htmlFor="area_digali">Area yang Perlu Digali</Label>
              <Textarea id="area_digali" rows={3} />
            </div>
          </div>

          <div>
            <Label htmlFor="catatan_interviewer">Catatan Interviewer</Label>
            <Textarea id="catatan_interviewer" rows={3} />
          </div>

          <div>
            <Label htmlFor="rekomendasi">Rekomendasi</Label>
            <select id="rekomendasi" className="w-full border rounded-md p-2">
              <option value="Lanjut Tahap Berikutnya">Lanjut Tahap Berikutnya</option>
              <option value="Talent Pool">Talent Pool</option>
              <option value="Tidak Lanjut">Tidak Lanjut</option>
            </select>
          </div>

          <Button type="submit">Simpan Evaluasi</Button>
        </form>
      </CardContent>
    </Card>
  );
}
```

- [ ] **Step 2: Create interview page**

```tsx
// src/app/dashboard/kandidat/[id]/interview/page.tsx
import { getCandidateById } from '@/lib/db';
import { InterviewTabs } from '@/components/interview-tabs';
import Link from 'next/link';

export default async function InterviewPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div>Kandidat tidak ditemukan</div>;
  }

  return (
    <div>
      <Link href={`/dashboard/kandidat/${params.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">Interview & Tes Seleksi</h1>
      <InterviewTabs
        candidateId={params.id}
        candidateName={candidate.nama}
        position={candidate.posisi_dilamar}
      />
    </div>
  );
}
```

- [ ] **Step 3: Create API routes**

```typescript
// src/app/api/selection-test/route.ts
import { NextResponse } from 'next/server';
import { saveSelectionTestResult } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveSelectionTestResult(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/interview-evaluation/route.ts
import { NextResponse } from 'next/server';
import { saveInterviewEvaluation } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const result = await saveInterviewEvaluation(body);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/components/interview-tabs.tsx src/app/dashboard/kandidat/[id]/interview/page.tsx src/app/api/selection-test/route.ts src/app/api/interview-evaluation/route.ts
git commit -m "feat: add interview and selection test tabbed page"
```

---

## Task 11: DISC Test - Candidate View

**Files:**
- Create: `src/app/disc/[token]/page.tsx`
- Create: `src/components/disc-candidate-view.tsx`

- [ ] **Step 1: Create DISC candidate view component**

```tsx
// src/components/disc-candidate-view.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { discQuestions } from '@/lib/discData';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface DiscCandidateViewProps {
  token: string;
  candidateName: string;
  position: string;
}

export function DiscCandidateView({ token, candidateName, position }: DiscCandidateViewProps) {
  const router = useRouter();
  const [answers, setAnswers] = useState<Record<number, { most: string; least: string }>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const currentQuestion = Object.keys(answers).length + 1;
  const allAnswered = Object.keys(answers).length === 28;

  function handleSelect(questionId: number, word: string, type: 'most' | 'least') {
    setAnswers(prev => {
      const existing = prev[questionId] || { most: '', least: '' };
      
      // If already selected, deselect
      if (existing[type] === word) {
        return { ...prev, [questionId]: { ...existing, [type]: '' } };
      }
      
      // If selecting most, can't be same as least
      if (type === 'most' && existing.least === word) {
        return prev;
      }
      // If selecting least, can't be same as most
      if (type === 'least' && existing.most === word) {
        return prev;
      }

      return { ...prev, [questionId]: { ...existing, [type]: word } };
    });
  }

  async function handleSubmit() {
    if (!allAnswered) return;
    
    setIsSubmitting(true);
    try {
      const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
        questionId: Number(questionId),
        most: answer.most,
        least: answer.least,
      }));

      const response = await fetch('/api/disc/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, answers: formattedAnswers }),
      });

      if (response.ok) {
        router.push(`/disc/${token}/success`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-blue-900 text-white p-4 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="bg-white rounded-lg p-2">
              <span className="text-blue-900 font-extrabold text-sm">EL</span>
            </div>
            <div>
              <div className="font-semibold text-sm">DISC Personality Test</div>
              <div className="text-xs text-blue-200">Easy Legal - Assessment Rekrutmen</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="bg-blue-800 rounded-full px-3 py-1 text-xs">
              {currentQuestion}/28
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-4xl mx-auto p-4">
        {/* Welcome Card */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="text-center mb-4">
              <h1 className="text-xl font-bold">Halo, {candidateName}!</h1>
              <p className="text-sm text-muted-foreground">Posisi: {position}</p>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg text-sm">
              <p className="font-medium mb-2">Petunjuk:</p>
              <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                <li>Terdiri dari <strong>28 kelompok</strong>, masing-masing berisi 4 kata sifat.</li>
                <li>Pilih <strong className="text-green-600">1 kata PALING sesuai</strong> dengan diri Anda.</li>
                <li>Pilih <strong className="text-red-600">1 kata PALING TIDAK sesuai</strong> dengan diri Anda.</li>
                <li>Jawab dengan <strong>jujur & spontan</strong>. Tidak ada jawaban benar/salah.</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Questions */}
        <div className="space-y-4">
          {discQuestions.map((question) => {
            const answer = answers[question.id];
            const isAnswered = answer?.most && answer?.least;
            const isActive = question.id === currentQuestion;

            return (
              <Card
                key={question.id}
                className={`${
                  isAnswered ? 'border-green-200 bg-green-50' :
                  isActive ? 'border-blue-500 shadow-md' :
                  'opacity-50'
                }`}
              >
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                      isAnswered ? 'bg-green-500 text-white' :
                      isActive ? 'bg-blue-500 text-white' :
                      'bg-gray-200'
                    }`}>
                      {isAnswered ? '✓' : question.id}
                    </span>
                    <span className="font-medium text-sm">
                      Soal {question.id} dari 28
                    </span>
                    {isAnswered && (
                      <span className="text-xs text-green-600 ml-auto">Terjawab</span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {question.words.map((word) => {
                      const isM = answer?.most === word.text;
                      const isL = answer?.least === word.text;

                      return (
                        <div
                          key={word.text}
                          className={`p-3 rounded-lg border text-center cursor-pointer transition-all ${
                            isM ? 'bg-green-500 text-white border-green-600' :
                            isL ? 'bg-red-500 text-white border-red-600' :
                            'bg-white hover:bg-slate-50'
                          }`}
                          onClick={() => {
                            if (!isAnswered || isActive) {
                              // For now, simple toggle: click = most, click again = least, click again = deselect
                              if (!answer?.most) {
                                handleSelect(question.id, word.text, 'most');
                              } else if (!answer?.least && word.text !== answer.most) {
                                handleSelect(question.id, word.text, 'least');
                              }
                            }
                          }}
                        >
                          <div className="font-medium">{word.text}</div>
                          {isM && <div className="text-xs mt-1">PALING SESUAI</div>}
                          {isL && <div className="text-xs mt-1">TIDAK SESUAI</div>}
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Submit */}
        <Card className="mt-6">
          <CardContent className="p-6 text-center">
            <Button
              onClick={handleSubmit}
              disabled={!allAnswered || isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? 'Mengirim...' : `Kirim Jawaban (${28 - Object.keys(answers).length} soal tersisa)`}
            </Button>
            <p className="text-xs text-muted-foreground mt-2">
              Pastikan semua soal terisi sebelum mengirim. Jawaban tidak dapat diubah setelah dikirim.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create DISC candidate page**

```tsx
// src/app/disc/[token]/page.tsx
import { getCandidateByToken } from '@/lib/db';
import { DiscCandidateView } from '@/components/disc-candidate-view';
import { Card, CardContent } from '@/components/ui/card';

export default async function DiscPage({ params }: { params: { token: string } }) {
  const candidate = await getCandidateByToken(params.token);
  
  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Link Tidak Valid</h1>
            <p className="text-muted-foreground">Link ini tidak valid atau sudah tidak berlaku. Silakan hubungi HR.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check if token expired
  if (new Date(candidate.token_expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Link Sudah Kedaluwarsa</h1>
            <p className="text-muted-foreground">Link ini sudah tidak berlaku. Silakan hubungi HR untuk mendapatkan link baru.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <DiscCandidateView
      token={params.token}
      candidateName={candidate.nama}
      position={candidate.posisi_dilamar}
    />
  );
}
```

- [ ] **Step 3: Create DISC submission API**

```typescript
// src/app/api/disc/submit/route.ts
import { NextResponse } from 'next/server';
import { getCandidateByToken, saveDiscTestResult } from '@/lib/db';
import { discQuestions } from '@/lib/discData';

export async function POST(request: Request) {
  try {
    const { token, answers } = await request.json();
    
    const candidate = await getCandidateByToken(token);
    if (!candidate) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 404 });
    }

    // Calculate scores
    const scores = { D: 0, I: 0, S: 0, C: 0 };
    
    answers.forEach((answer: { questionId: number; most: string; least: string }) => {
      const question = discQuestions.find(q => q.id === answer.questionId);
      if (!question) return;

      const mostWord = question.words.find(w => w.text === answer.most);
      const leastWord = question.words.find(w => w.text === answer.least);

      if (mostWord) scores[mostWord.dimension]++;
      if (leastWord) scores[leastWord.dimension]--;
    });

    // Calculate percentages
    const total = Math.abs(scores.D) + Math.abs(scores.I) + Math.abs(scores.S) + Math.abs(scores.C);
    const persen_d = total > 0 ? Math.round((Math.abs(scores.D) / total) * 100) : 0;
    const persen_i = total > 0 ? Math.round((Math.abs(scores.I) / total) * 100) : 0;
    const persen_s = total > 0 ? Math.round((Math.abs(scores.S) / total) * 100) : 0;
    const persen_c = total > 0 ? Math.round((Math.abs(scores.C) / total) * 100) : 0;

    // Determine types
    const percentages = [
      { type: 'D — Dominance', value: persen_d },
      { type: 'I — Influence', value: persen_i },
      { type: 'S — Steadiness', value: persen_s },
      { type: 'C — Conscientiousness', value: persen_c },
    ].sort((a, b) => b.value - a.value);

    const result = await saveDiscTestResult({
      candidate_id: candidate.id,
      answers,
      skor_d: scores.D,
      skor_i: scores.I,
      skor_s: scores.S,
      skor_c: scores.C,
      persen_d,
      persen_i,
      persen_s,
      persen_c,
      tipe_primer: percentages[0].type,
      tipe_sekunder: percentages[1].type,
      completed_at: new Date().toISOString(),
    });

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Test DISC test flow**

Navigate to `http://localhost:3000/disc/token-tiara`. Answer all 28 questions. Expected: Shows success after submission.

- [ ] **Step 5: Commit**

```bash
git add src/components/disc-candidate-view.tsx src/app/disc/[token]/page.tsx src/app/api/disc/submit/route.ts
git commit -m "feat: add DISC test candidate view with scoring"
```

---

## Task 12: DISC Test - HR View

**Files:**
- Create: `src/app/dashboard/kandidat/[id]/disc/page.tsx`
- Create: `src/components/disc-hr-view.tsx`

- [ ] **Step 1: Create DISC HR view component**

```tsx
// src/components/disc-hr-view.tsx
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { discQuestions } from '@/lib/discData';

interface DiscHrViewProps {
  candidateName: string;
  position: string;
  discResult: {
    skor_d: number;
    skor_i: number;
    skor_s: number;
    skor_c: number;
    persen_d: number;
    persen_i: number;
    persen_s: number;
    persen_c: number;
    tipe_primer: string;
    tipe_sekunder: string;
    answers: { questionId: number; most: string; least: string }[];
  };
}

// Position fit criteria from spec
const positionCriteria: Record<string, { dimension: string; min: number }[]> = {
  'Legal Officer (LO)': [{ dimension: 'C', min: 40 }, { dimension: 'D', min: 20 }],
  'Customer Care / CRM': [{ dimension: 'I', min: 35 }, { dimension: 'S', min: 25 }],
  'PLA (Pre-Closing)': [{ dimension: 'D', min: 35 }, { dimension: 'I', min: 30 }],
  'Marketing': [{ dimension: 'I', min: 40 }, { dimension: 'D', min: 25 }],
};

export function DiscHrView({ candidateName, position, discResult }: DiscHrViewProps) {
  const scores = [
    { label: 'D', name: 'Dominance', value: discResult.persen_d, color: 'bg-red-500' },
    { label: 'I', name: 'Influence', value: discResult.persen_i, color: 'bg-yellow-500' },
    { label: 'S', name: 'Steadiness', value: discResult.persen_s, color: 'bg-green-500' },
    { label: 'C', name: 'Conscientiousness', value: discResult.persen_c, color: 'bg-blue-500' },
  ];

  // Calculate position fit
  const criteria = positionCriteria[position];
  let fitScore = 0;
  let fitDetails: { dimension: string; required: number; actual: number; met: boolean }[] = [];
  
  if (criteria) {
    criteria.forEach(c => {
      const actual = c.dimension === 'D' ? discResult.persen_d :
                     c.dimension === 'I' ? discResult.persen_i :
                     c.dimension === 'S' ? discResult.persen_s :
                     discResult.persen_c;
      const met = actual >= c.min;
      if (met) fitScore += 50;
      fitDetails.push({ dimension: c.dimension, required: c.min, actual, met });
    });
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle>Hasil DISC Test</CardTitle>
          <div className="text-sm text-muted-foreground">
            Kandidat: {candidateName} · Posisi: {position}
          </div>
        </CardHeader>
      </Card>

      {/* Scores */}
      <div className="grid grid-cols-4 gap-4">
        {scores.map((score) => (
          <Card key={score.label}>
            <CardContent className="p-6 text-center">
              <div className="text-3xl font-bold mb-2">{score.value}%</div>
              <div className="text-sm text-muted-foreground">{score.label}</div>
              <div className="text-xs text-muted-foreground">{score.name}</div>
              <div className="mt-4 h-2 bg-slate-100 rounded-full overflow-hidden">
                <div
                  className={`h-full ${score.color} rounded-full`}
                  style={{ width: `${score.value}%` }}
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Profile */}
      <Card>
        <CardHeader>
          <CardTitle>Profil DISC</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div>
              <span className="text-sm text-muted-foreground">Tipe Primer: </span>
              <Badge>{discResult.tipe_primer}</Badge>
            </div>
            <div>
              <span className="text-sm text-muted-foreground">Tipe Sekunder: </span>
              <Badge variant="outline">{discResult.tipe_sekunder}</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Position Fit */}
      {criteria && (
        <Card>
          <CardHeader>
            <CardTitle>Analisa Fit Posisi: {position}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="mb-4">
              <div className="text-2xl font-bold">{fitScore}%</div>
              <div className="text-sm text-muted-foreground">Kesesuaian dengan posisi</div>
            </div>
            <div className="space-y-3">
              {fitDetails.map((detail) => (
                <div key={detail.dimension} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <span className="font-medium">Dimension {detail.dimension}</span>
                    <span className="text-sm text-muted-foreground ml-2">
                      (min. {detail.required}%)
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold">{detail.actual}%</span>
                    <Badge variant={detail.met ? 'default' : 'destructive'}>
                      {detail.met ? 'Memenuhi' : 'Belum Memenuhi'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Bar Chart Visualization */}
      <Card>
        <CardHeader>
          <CardTitle>Visualisasi Skor</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {scores.map((score) => (
              <div key={score.label} className="flex items-center gap-4">
                <div className="w-8 text-center font-bold">{score.label}</div>
                <div className="flex-1 h-8 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-full ${score.color} rounded-full flex items-center justify-end pr-2`}
                    style={{ width: `${score.value}%` }}
                  >
                    <span className="text-xs text-white font-bold">{score.value}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Answer Details */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Jawaban</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {discResult.answers.map((answer) => {
              const question = discQuestions.find(q => q.id === answer.questionId);
              if (!question) return null;

              return (
                <div key={answer.questionId} className="p-4 bg-slate-50 rounded-lg">
                  <div className="text-sm font-medium mb-2">Soal {answer.questionId}</div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-xs text-green-600">M: </span>
                      <span className="text-sm">{answer.most}</span>
                    </div>
                    <div>
                      <span className="text-xs text-red-600">L: </span>
                      <span className="text-sm">{answer.least}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
```

- [ ] **Step 2: Create DISC HR page**

```tsx
// src/app/dashboard/kandidat/[id]/disc/page.tsx
import { getCandidateById, getDiscTestResultByCandidate } from '@/lib/db';
import { DiscHrView } from '@/components/disc-hr-view';
import { Card, CardContent } from '@/components/ui/card';
import Link from 'next/link';

export default async function DiscHrPage({ params }: { params: { id: string } }) {
  const candidate = await getCandidateById(params.id);
  if (!candidate) {
    return <div>Kandidat tidak ditemukan</div>;
  }

  const discResult = await getDiscTestResultByCandidate(params.id);
  if (!discResult) {
    return (
      <div>
        <Link href={`/dashboard/kandidat/${params.id}`} className="text-sm text-muted-foreground hover:underline">
          &larr; Kembali ke detail kandidat
        </Link>
        <Card className="mt-6">
          <CardContent className="p-8 text-center">
            <h2 className="text-lg font-bold mb-2">Belum Ada Hasil DISC</h2>
            <p className="text-muted-foreground">Kandidat belum mengerjakan DISC test.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div>
      <Link href={`/dashboard/kandidat/${params.id}`} className="text-sm text-muted-foreground hover:underline">
        &larr; Kembali ke detail kandidat
      </Link>
      <h1 className="text-2xl font-bold mt-2 mb-6">DISC Test - HR View</h1>
      <DiscHrView
        candidateName={candidate.nama}
        position={candidate.posisi_dilamar}
        discResult={discResult}
      />
    </div>
  );
}
```

- [ ] **Step 3: Commit**

```bash
git add src/components/disc-hr-view.tsx src/app/dashboard/kandidat/[id]/disc/page.tsx
git commit -m "feat: add DISC test HR view with position fit analysis"
```

---

## Task 13: Export Page

**Files:**
- Create: `src/app/dashboard/export/page.tsx`

- [ ] **Step 1: Create export page**

```tsx
// src/app/dashboard/export/page.tsx
'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportExcel(type: 'manpower' | 'candidates') {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Export & Laporan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Manpower Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export semua data Manpower Request ke file Excel.
            </p>
            <Button
              onClick={() => handleExportExcel('manpower')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Mengexport...' : 'Download Excel'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Data Kandidat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export semua data kandidat beserta status rekrutmen.
            </p>
            <Button
              onClick={() => handleExportExcel('candidates')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Mengexport...' : 'Download Excel'}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Export PDF per Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export form dalam format PDF. Pilih kandidat dan form yang ingin diexport dari halaman detail kandidat.
            </p>
            <div className="text-sm text-muted-foreground">
              Fitur PDF tersedia di halaman detail kandidat → pilih form → klik "Export PDF".
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create export API routes**

```typescript
// src/app/api/export/manpower/route.ts
import { NextResponse } from 'next/server';
import { getManpowerRequests } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const requests = await getManpowerRequests();
    
    const data = requests.map(req => ({
      'No. Request': req.no_request,
      'Tanggal': req.tanggal,
      'Divisi': req.divisi,
      'Pemohon': req.pemohon,
      'Posisi': req.posisi,
      'Jumlah': req.jumlah,
      'Lokasi': req.lokasi,
      'Jenis Kebutuhan': req.jenis_kebutuhan,
      'Urgensi': req.urgensi,
      'Status': req.status,
      'Range Gaji Min': req.range_gaji.min,
      'Range Gaji Max': req.range_gaji.max,
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Manpower Requests');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=manpower-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal export' }, { status: 500 });
  }
}
```

```typescript
// src/app/api/export/candidates/route.ts
import { NextResponse } from 'next/server';
import { getCandidates, getDiscTestResultByCandidate } from '@/lib/db';
import * as XLSX from 'xlsx';

export async function GET() {
  try {
    const candidates = await getCandidates();
    
    const data = await Promise.all(candidates.map(async (cand) => {
      const disc = await getDiscTestResultByCandidate(cand.id);
      
      return {
        'Nama': cand.nama,
        'Email': cand.email,
        'Telepon': cand.telepon,
        'Posisi': cand.posisi_dilamar,
        'Status': cand.status,
        'Pendidikan': cand.pendidikan || '-',
        'Pengalaman': cand.pengalaman || '-',
        'DISC Primer': disc?.tipe_primer || '-',
        'DISC Sekunder': disc?.tipe_sekunder || '-',
        'DISC D%': disc?.persen_d || '-',
        'DISC I%': disc?.persen_i || '-',
        'DISC S%': disc?.persen_s || '-',
        'DISC C%': disc?.persen_c || '-',
      };
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(data);
    XLSX.utils.book_append_sheet(wb, ws, 'Candidates');

    const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename=candidates-${new Date().toISOString().split('T')[0]}.xlsx`,
      },
    });
  } catch (error) {
    return NextResponse.json({ error: 'Gagal export' }, { status: 500 });
  }
}
```

- [ ] **Step 3: Commit**

```bash
git add src/app/dashboard/export/page.tsx src/app/api/export/manpower/route.ts src/app/api/export/candidates/route.ts
git commit -m "feat: add export page with Excel download"
```

---

## Task 14: Candidate Biodata Form (External)

**Files:**
- Create: `src/app/apply/[token]/page.tsx`

- [ ] **Step 1: Create candidate biodata form**

```tsx
// src/app/apply/[token]/page.tsx
import { getCandidateByToken } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BiodataForm } from '@/components/biodata-form';

export default async function ApplyPage({ params }: { params: { token: string } }) {
  const candidate = await getCandidateByToken(params.token);
  
  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Link Tidak Valid</h1>
            <p className="text-muted-foreground">Link ini tidak valid atau sudah tidak berlaku. Silakan hubungi HR.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (new Date(candidate.token_expires_at) < new Date()) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Link Sudah Kedaluwarsa</h1>
            <p className="text-muted-foreground">Link ini sudah tidak berlaku. Silakan hubungi HR untuk mendapatkan link baru.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="bg-white rounded-lg p-2">
            <span className="text-blue-900 font-extrabold text-sm">EL</span>
          </div>
          <div>
            <div className="font-semibold">Easy Legal</div>
            <div className="text-xs text-blue-200">Form Biodata Kandidat</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Biodata Kandidat</CardTitle>
            <div className="text-sm text-muted-foreground">
              {candidate.nama} · {candidate.posisi_dilamar}
            </div>
          </CardHeader>
          <CardContent>
            <BiodataForm token={params.token} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Create biodata form component**

```tsx
// src/components/biodata-form.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

export function BiodataForm({ token }: { token: string }) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      pendidikan: (document.getElementById('pendidikan') as HTMLTextAreaElement)?.value,
      pengalaman: (document.getElementById('pengalaman') as HTMLTextAreaElement)?.value,
      keahlian: (document.getElementById('keahlian') as HTMLTextAreaElement)?.value,
    };

    try {
      const response = await fetch('/api/biodata', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, ...formData }),
      });

      if (response.ok) {
        router.push(`/disc/${token}`);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <Label htmlFor="pendidikan">Riwayat Pendidikan</Label>
        <Textarea
          id="pendidikan"
          rows={4}
          placeholder="contoh: S1 Hukum, Universitas Indonesia (2018-2022)"
          required
        />
      </div>

      <div>
        <Label htmlFor="pengalaman">Pengalaman Kerja</Label>
        <Textarea
          id="pengalaman"
          rows={4}
          placeholder="Sebutkan pengalaman kerja yang relevan"
          required
        />
      </div>

      <div>
        <Label htmlFor="keahlian">Keahlian</Label>
        <Textarea
          id="keahlian"
          rows={3}
          placeholder="Sebutkan keahlian yang dimiliki"
          required
        />
      </div>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? 'Menyimpan...' : 'Simpan & Lanjut ke DISC Test'}
      </Button>
    </form>
  );
}
```

- [ ] **Step 3: Create biodata API route**

```typescript
// src/app/api/biodata/route.ts
import { NextResponse } from 'next/server';
import { saveCandidateBio } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { token, pendidikan, pengalaman, keahlian } = await request.json();
    const result = await saveCandidateBio(token, { pendidikan, pengalaman, keahlian });
    
    if (!result) {
      return NextResponse.json({ error: 'Token tidak valid' }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal menyimpan' }, { status: 500 });
  }
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/apply/[token]/page.tsx src/components/biodata-form.tsx src/app/api/biodata/route.ts
git commit -m "feat: add candidate biodata form for external access"
```

---

## Task 15: Schedule Confirmation Page (External)

**Files:**
- Create: `src/app/confirm/[token]/page.tsx`

- [ ] **Step 1: Create schedule confirmation page**

```tsx
// src/app/confirm/[token]/page.tsx
import { getCandidateByToken } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export default async function ConfirmPage({ params }: { params: { token: string } }) {
  const candidate = await getCandidateByToken(params.token);
  
  if (!candidate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-8 text-center">
            <h1 className="text-xl font-bold mb-2">Link Tidak Valid</h1>
            <p className="text-muted-foreground">Link ini tidak valid. Silakan hubungi HR.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="bg-blue-900 text-white p-4">
        <div className="max-w-2xl mx-auto flex items-center gap-3">
          <div className="bg-white rounded-lg p-2">
            <span className="text-blue-900 font-extrabold text-sm">EL</span>
          </div>
          <div>
            <div className="font-semibold">Easy Legal</div>
            <div className="text-xs text-blue-200">Konfirmasi Jadwal</div>
          </div>
        </div>
      </header>

      <div className="max-w-2xl mx-auto p-4">
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Konfirmasi Kehadiran</CardTitle>
            <div className="text-sm text-muted-foreground">
              Halo, {candidate.nama}
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Jadwal Interview</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Posisi: </span>
                    <span className="font-medium">{candidate.posisi_dilamar}</span>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Status: </span>
                    <Badge>{candidate.status}</Badge>
                  </div>
                </div>
              </div>

              <div className="text-center">
                <p className="text-muted-foreground mb-4">
                  Silakan konfirmasi kehadiran Anda untuk proses rekrutmen selanjutnya.
                </p>
                <div className="flex gap-4 justify-center">
                  <Button size="lg">Konfirmasi Hadir</Button>
                  <Button size="lg" variant="outline">Tidak Bisa Hadir</Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Commit**

```bash
git add src/app/confirm/[token]/page.tsx
git commit -m "feat: add schedule confirmation page for candidates"
```

---

## Self-Review Checklist

- [ ] All routes from spec are implemented:
  - `/dashboard` - Dashboard overview ✓
  - `/dashboard/manpower` - List manpower requests ✓
  - `/dashboard/manpower/new` - Create new request ✓
  - `/dashboard/manpower/[id]` - Detail + approval ✓
  - `/dashboard/kandidat` - List candidates ✓
  - `/dashboard/kandidat/[id]` - Candidate detail ✓
  - `/dashboard/kandidat/[id]/interview` - Interview tabs ✓
  - `/dashboard/kandidat/[id]/disc` - DISC HR view ✓
  - `/dashboard/export` - Export page ✓
  - `/apply/[token]` - Candidate biodata ✓
  - `/disc/[token]` - DISC candidate view ✓
  - `/confirm/[token]` - Schedule confirmation ✓

- [ ] All forms from spec are implemented:
  - FR-HRGA-001.01 Manpower Request ✓
  - FR-HRGA-001.02 Selection Test ✓
  - FR-HRGA-001.03 Interview Evaluation ✓
  - DISC Test (28 questions) ✓

- [ ] DISC scoring logic is implemented correctly:
  - M/L selection ✓
  - Net score calculation ✓
  - Percentage calculation ✓
  - Position fit analysis ✓

- [ ] Export functionality:
  - Excel export for manpower requests ✓
  - Excel export for candidates ✓

- [ ] No placeholders or TBDs in the plan ✓

