# EasyLegal HR Recruitment System

Sistem rekrutmen internal untuk PT EasyLegal yang membantu proses rekrutmen dari awal hingga akhir — mulai dari permintaan manpower, seleksi kandidat, tes DISC, interview, hingga onboarding.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| UI Components | shadcn/ui + Radix UI |
| Styling | Tailwind CSS |
| Database | Supabase (PostgreSQL) |
| Authentication | Supabase Auth |
| Hosting | Hostinger (Node.js) |
| PDF Export | PizZip + docxtemplater |
| Excel Export | SheetJS (xlsx) |
| Charts | Recharts |

## Fitur Utama

### Dashboard HR
- Statistik request manpower, total kandidat, dan pending approval
- Request terbaru dan kandidat terbaru
- Daftar request yang menunggu persetujuan

### Manpower Request
- Form pengajuan kebutuhan tenaga kerja baru
- 3-level approval: User → HRGA → Management
- Tracking status: submitted → verified → approved

### Kandidat Management
- Pencatatan data kandidat baru
- Generate token unik untuk akses kandidat
- Tracking status: screening → interview → psikotes → offering → hired

### Tes Seleksi (Psikotes)
- Form evaluasi komponen tes (Psikotes, PAPIKOSTIK, Case Study, dll)
- Input nilai, batas lulus, dan catatan per komponen
- Kesimpulan: Lulus / Lulus Bersyarat / Tidak Lulus

### DISC Personality Test
- 28 soal pilihan Most/Least
- Kalkulasi otomatis skor D, I, S, C
- Penentuan tipe primer & sekunder
- Token sekali pakai (single-use)

### Evaluasi Interview
- Penilaian 8 aspek: Komunikasi, Sikap, Integritas, dll
- Skor 1-5 per aspek dengan total otomatis
- Rekomendasi: Lanjut / Talent Pool / Tidak Lanjut

### Export & Laporan
- Export data kandidat ke Excel
- Export hasil tes seleksi ke DOCX
- Laporan statistik rekrutmen

## Arsitektur

```
┌─────────────────────────────────────────────────────────┐
│                      Browser                            │
├──────────────────┬──────────────────────────────────────┤
│  disc.easyai.id  │       dashboard.easyai.id            │
│  (Kandidat)      │       (HR Internal)                  │
├──────────────────┴──────────────────────────────────────┤
│                    Middleware                           │
│              (Subdomain Routing)                        │
├─────────────────────────────────────────────────────────┤
│                   Next.js App                          │
│           (Server Components + API Routes)             │
├─────────────────────────────────────────────────────────┤
│                    Supabase                            │
│              (Auth + PostgreSQL)                        │
└─────────────────────────────────────────────────────────┘
```

## Subdomain Routing

| Subdomain | Akses | Halaman |
|-----------|-------|---------|
| `easyai.id` | - | Redirect ke subdomain |
| `disc.easyai.id` | Kandidat | `/masuk`, `/apply/[token]`, `/disc/[token]` |
| `dashboard.easyai.id` | HR Internal | `/login`, `/dashboard/*` |

## Struktur Folder

```
recruit-EL/
├── src/
│   ├── app/
│   │   ├── api/           # API Routes
│   │   │   ├── disc/      # DISC test submission
│   │   │   ├── manpower/  # Manpower CRUD & approval
│   │   │   └── interview/ # Interview evaluation
│   │   ├── apply/         # Biodata kandidat
│   │   ├── disc/          # DISC test page
│   │   ├── dashboard/     # Halaman internal HR
│   │   │   ├── manpower/  # Manpower request list & detail
│   │   │   ├── kandidat/  # Kandidat management
│   │   │   └── export/    # Export & laporan
│   │   ├── login/         # Login HR
│   │   └── masuk/         # Token entry kandidat
│   ├── components/
│   │   ├── ui/            # shadcn/ui components
│   │   ├── sidebar.tsx    # Navigation sidebar
│   │   └── ...            # Feature components
│   ├── lib/
│   │   ├── db.ts          # Database queries
│   │   ├── discParser.ts  # DISC calculation
│   │   └── utils.ts       # Utility functions
│   └── middleware.ts      # Subdomain routing
├── scripts/
│   └── migrate-and-seed.sql  # Database schema
├── public/
└── tailwind.config.ts
```

## Database Schema

### Tables

**manpower_requests**
- id, no_request, tanggal, divisi, pemohon
- posisi, jumlah, lokasi, tanggal_dibutuhkan
- jenis_kebutuhan, status_karyawan, urgensi
- alasan, jobdesk, kualifikasi, range_gaji, benefit
- status: submitted → verified → approved
- approval_user_at, approval_hrga_at, approval_management_at

**candidates**
- id, token, nama, posisi_dilamar
- pendidikan, pengalaman, keahlian
- status: screening → interview → psikotes → offering → hired

**disc_tests**
- id, candidate_id, answers
- skor_d, skor_i, skor_s, skor_c
- persen_d, persen_i, persen_s, persen_c
- tipe_primer, tipe_sekunder, completed_at

**interview_evaluations**
- id, candidate_id, tanggal, tahap
- interviewer, metode, ekspektasi_gaji
- penilaian (8 aspek), total_skor
- kelebihan, area_digali, catatan, rekomendasi

**selection_tests**
- id, candidate_id, tanggal_tes
- penyelenggara, komponen (6 jenis tes)
- kesimpulan, catatan_akhir

## Environment Variables

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-key
```

## Instalasi

```bash
# Install dependencies
npm install

# Jalankan development server
npm run dev

# Build untuk production
npm run build

# Jalankan production server
npm start
```

## Deployment

1. Push code ke GitHub
2. Setup Node.js App di Hostinger cPanel
3. Clone repository
4. Set environment variables
5. Jalankan `npm install && npm run build && npm start`

## License

Copyright © 2026 EasyLegal. All rights reserved.
