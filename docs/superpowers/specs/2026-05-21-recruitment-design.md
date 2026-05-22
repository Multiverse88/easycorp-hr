# Design Spec — Website Rekrutmen EasyLegal

**Tanggal:** 2026-05-21  
**Status:** Approved (mockup)  
**Tech Stack:** Next.js (App Router) + Supabase + Vercel + Tailwind CSS + shadcn/ui

---

## 1. Overview

Website rekrutmen internal Easy Legal dengan dua portal:
- **Internal (HR):** login required, manajemen kandidat, pengisian form, export PDF/Excel
- **Eksternal (Kandidat):** akses via token unik, tanpa login, isi biodata & DISC test

---

## 2. Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend + API | Next.js 14 (App Router) |
| Database + Auth | Supabase (PostgreSQL + Auth) |
| UI | Tailwind CSS + shadcn/ui |
| Forms | React Hook Form + Zod |
| Export | `xlsx` (Excel) + `@react-pdf/renderer` (PDF) |
| Hosting | Vercel |

---

## 3. Struktur Halaman

### Internal (Login Required) — `/dashboard/*`

| Route | Halaman | Deskripsi |
|---|---|---|
| `/dashboard` | Dashboard | Ringkasan: request aktif, kandidat proses, interview minggu ini, pending approval |
| `/dashboard/manpower` | List Manpower Request | Tabel semua request + status + filter |
| `/dashboard/manpower/new` | Form Pengajuan Manpower | Form FR-HRGA-001.01 |
| `/dashboard/manpower/[id]` | Detail Request | Detail + status approval |
| `/dashboard/kandidat` | List Kandidat | Semua kandidat + status proses rekrutmen |
| `/dashboard/kandidat/[id]` | Detail Kandidat | Profil + link ke semua form terkait |
| `/dashboard/kandidat/[id]/interview` | Hasil Interview | Tab: FR-001.02 Tes Seleksi + FR-001.03 Evaluasi Interview |
| `/dashboard/kandidat/[id]/disc` | DISC Test HR View | Input & lihat hasil DISC test kandidat |
| `/dashboard/export` | Export & Laporan | Export data ke Excel/PDF |

### Eksternal (Kandidat — Token) — `/[token]/*`

| Route | Halaman | Deskripsi |
|---|---|---|
| `/apply/[token]` | Form Biodata Kandidat | Data diri, pendidikan, pengalaman |
| `/disc/[token]` | DISC Test Kandidat | 28 soal DISC, interaksi drag & drop / tap |
| `/confirm/[token]` | Konfirmasi Jadwal | Konfirmasi kehadiran interview/psikotes |

---

## 4. Desain Visual

- **Style:** Corporate Clean — biru formal (#1e3a8a, #1d4ed8), putih bersih, abu-abu ringan
- **Navigasi internal:** Sidebar kiri tetap dengan ikon + label
- **Navigasi kandidat:** Tanpa sidebar, full-width, mobile-first
- **UI Components:** shadcn/ui (Card, Table, Tabs, Dialog, Form, Badge)

---

## 5. Form Detail

### 5.1 Form Permintaan Tenaga Kerja (FR-HRGA-001.01)

**Fields:**
- No. Request (auto-generate: `MR/[bulan]/[tahun]/[urutan]`)
- Tanggal Permintaan, Divisi/Departemen, Nama Pemohon, Jabatan Pemohon, Atasan Pemohon
- Posisi yang Dibutuhkan, Jumlah Kebutuhan, Lokasi Kerja, Tanggal Dibutuhkan
- Jenis Kebutuhan: `Posisi Baru | Replacement | Tambahan Tim`
- Nama Karyawan Diganti *(conditional — muncul hanya jika Replacement)*
- Status Karyawan: `PKWT | PKWTT | Magang | Outsource`
- Urgensi: `Tinggi | Sedang | Rendah`
- Section A: Alasan Permintaan
- Section B: Ringkasan Jobdesk
- Section C: Kualifikasi Wajib (tabel: Pendidikan, Pengalaman, Keahlian Teknis, Soft Skill, Catatan Khusus)
- Section D: Range Gaji (Rp min–max) + Benefit/Tunjangan

**Approval Flow:** Diajukan User → Diverifikasi HRGA → Disetujui Management/Owner

**Status:** `draft | submitted | verified | approved | rejected`

---

### 5.2 Form Hasil Tes Seleksi (FR-HRGA-001.02)

**Fields:**
- Nama Kandidat (linked), Posisi, Tanggal Tes, Jenis Tes, Penyelenggara/Penguji, Lokasi/Platform
- Tabel komponen (6 baris): Psikotes/DISC, PAPIKOSTIK, Case Study, Tes Adm/Typing/Writing, Tes Bahasa/Komunikasi, Lainnya — kolom: Nilai/Status, Batas Lulus, Catatan
- Kesimpulan: `Lulus | Lulus Bersyarat | Tidak Lulus`
- Catatan Akhir

**Approval:** Penguji/Assessor → HRGA → User/Atasan Langsung

---

### 5.3 Form Evaluasi Interview Kandidat (FR-HRGA-001.03)

**Fields:**
- Nama Kandidat (linked), Posisi, Tanggal Interview
- Tahap Interview: `HRGA | User | Final`
- Interviewer, Metode: `Online | Offline`
- Ekspektasi Gaji, Ketersediaan Bergabung
- Tabel penilaian 8 aspek (skor 1–5 + catatan): Komunikasi, Sikap/Attitude, Integritas, Kesesuaian Pengalaman, Kemampuan Teknis, Problem Solving, Motivasi Kerja, Kesesuaian Budaya Kerja
- Total Skor (auto-calculated dari 40)
- Ringkasan: Kelebihan Kandidat, Area yang Perlu Digali, Catatan Interviewer
- Rekomendasi: `Lanjut Tahap Berikutnya | Talent Pool | Tidak Lanjut`

**Approval:** Interviewer → HRGA → User/Atasan Langsung

> Halaman `/dashboard/kandidat/[id]/interview` menampilkan keduanya (FR-001.02 & FR-001.03) dalam satu halaman dengan **sistem tab**. Output/export menjadi 2 file PDF terpisah.

---

### 5.4 DISC Test

#### HR View (`/dashboard/kandidat/[id]/disc`)
- 3 tab: Petunjuk | Soal DISC (28 soal, 2 kolom) | Hasil & Analisa
- Tab Soal: progress bar, soal terjawab hijau, soal aktif highlight biru, tipe dimensi (D/I/S/C) terlihat
- Tab Hasil: bar chart skor D/I/S/C + tabel analisa fit 4 posisi (%) + rekomendasi posisi

#### Kandidat View (`/disc/[token]`)
- Tanpa sidebar, full-width, mobile-first
- Petunjuk ringkas di atas, strip info kandidat
- **Interaksi Geser ke Kolom:**
  - **Desktop:** drag & drop kata dari kolom kata → kolom M (hijau) atau L (merah). Klik item untuk hapus.
  - **Mobile:** tap kata → popup pilihan "Paling Sesuai (M)" / "Paling Tidak Sesuai (L)" / Batal
- Soal dibuka bertahap (soal berikutnya terbuka setelah soal sebelumnya selesai)
- Tombol submit aktif hanya setelah semua 28 soal terjawab
- Tipe dimensi (D/I/S/C) **disembunyikan** dari kandidat
- Hasil tidak ditampilkan ke kandidat

**Kalkulasi Skor:**
- M Score = jumlah M dipilih per dimensi
- L Score = jumlah L dipilih per dimensi  
- Net Score = M Score − L Score
- % Total = Net Score dimensi / total semua net score × 100
- Profil Dominan: dimensi dengan % tertinggi (primer) dan kedua tertinggi (sekunder)

**Analisa Fit Posisi (dari file Excel):**
| Posisi | DISC Ideal |
|---|---|
| Legal Officer (LO) | C ≥40%, D 20–30% |
| Customer Care / CRM | I ≥35%, S 25–35% |
| PLA (Pre-Closing) | D ≥35%, I ≥30% |
| Marketing | I ≥40%, D ≥25% |

---

## 6. Autentikasi

### Internal
- Login email + password via Supabase Auth
- Session persisted dengan Supabase cookies
- Role: `hr_staff | hr_manager | admin`

### Kandidat Eksternal
- Tidak perlu login
- Token unik di URL (UUID, disimpan di tabel `candidate_tokens`)
- Token dapat di-set expiry date oleh HR
- Token hanya valid untuk kandidat yang bersangkutan

---

## 7. Database Schema (Ringkasan)

```
users (Supabase Auth)
  - id, email, role, full_name

manpower_requests
  - id, no_request, tanggal, divisi, pemohon_id, posisi, jumlah
  - jenis_kebutuhan, status_karyawan, urgensi, status
  - alasan, jobdesk, kualifikasi (JSON), range_gaji
  - approval_user_at, approval_hrga_at, approval_management_at

candidates
  - id, nama, posisi_dilamar, manpower_request_id
  - status (screening | interview | psikotes | offering | hired | rejected)
  - token (UUID, for external access), token_expires_at

selection_test_results (FR-001.02)
  - id, candidate_id, tanggal_tes, penyelenggara
  - komponen (JSON array), kesimpulan, catatan_akhir

interview_evaluations (FR-001.03)
  - id, candidate_id, tanggal, tahap, interviewer_id, metode
  - ekspektasi_gaji, ketersediaan_bergabung
  - penilaian (JSON: {aspek, skor, catatan}[]), total_skor
  - kelebihan, area_digali, catatan, rekomendasi

disc_tests
  - id, candidate_id, jawaban (JSON: {no, M, L}[])
  - skor_d, skor_i, skor_s, skor_c (net score)
  - persen_d, persen_i, persen_s, persen_c
  - tipe_primer, tipe_sekunder
  - completed_at
```

---

## 8. Export

- **Excel:** semua data manpower request atau list kandidat via library `xlsx`
- **PDF per form:** FR-001.01, FR-001.02, FR-001.03, DISC hasil — via `@react-pdf/renderer`
- PDF mengikuti layout template dokumen asli perusahaan

---

## 9. Error Handling & Edge Cases

- Token kandidat expired → halaman info "Link sudah tidak berlaku, hubungi HR"
- Token sudah digunakan (DISC sudah disubmit) → tampilkan pesan "Tes sudah selesai"
- Validasi form: semua field wajib dicheck sebelum submit, error inline per field
- Approval sequential: verifikasi HRGA hanya bisa dilakukan setelah User submit, approval management hanya bisa setelah HRGA verifikasi

---

## 10. Catatan Implementasi

- Semua 28 soal DISC tersimpan sebagai static data di codebase (dari file Excel)
- Kalkulasi skor DISC dilakukan di server (API route) bukan di client — untuk mencegah manipulasi
- Tipe dimensi (D/I/S/C) per soal tidak dikirim ke kandidat view
- Supabase RLS (Row Level Security) untuk memastikan HR hanya bisa akses data perusahaan sendiri
- Vercel environment variables untuk Supabase URL + anon key + service role key
