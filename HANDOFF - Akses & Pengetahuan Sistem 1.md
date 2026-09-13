---
tags: [easylegal, handoff, infra, access]
updated: 2026-09-01
---

# Handoff — EasyLegal Infra & Akses

Dokumen ini buat dioper ke agent/AI lain biar gak perlu re-explore dari nol. Baca ini duluan sebelum nyentuh apa pun.

## ⚠️ Kredensial

**Akses VPS (SSH):**
```
IP        : 100.81.215.57   (Tailscale IP — cuma bisa diakses kalau device sudah join Tailnet yang sama)
IP publik : 157.10.252.77   (buat DNS record, BUKAN buat SSH)
Port      : 22
Username  : it_easylegal26
Password  : lihat [[Akses VPS.md]] — di-rotate 2026-09-04, JANGAN pakai `Jauhimaksiat@1` lagi (sudah bocor & mati)
```
Password sudo di VPS = password SSH yang sama.

**Cara SSH dari sandbox non-interaktif** (sshpass sering gak ke-install, ini workaround yang selalu jalan):
```bash
cat > /tmp/askpass.sh << 'EOF'
#!/bin/sh
echo '<password dari Akses VPS.md>'
EOF
chmod +x /tmp/askpass.sh
export SSH_ASKPASS=/tmp/askpass.sh
export SSH_ASKPASS_REQUIRE=force
setsid ssh -o PreferredAuthentications=password -o StrictHostKeyChecking=no it_easylegal26@100.81.215.57 "<command>" < /dev/null
```
`/tmp/askpass.sh` sering ke-wipe kalau sandbox reset — buat ulang tiap kali kepakai lagi.

**GitHub:**
- Repo: `github.com/Multiverse88/websiteel-app` (monorepo Turborepo — `apps/web`, `apps/api`, `infra/admin-dashboard`)
- **Tidak ada PAT valid yang tersimpan sekarang** — token lama sudah diminta di-revoke setelah sempat kepaste di chat. Kalau butuh push dari sandbox tanpa akses `git@github.com` SSH key, minta user generate PAT baru (scope `repo`, dan `workflow` kalau perlu ubah `.github/workflows/`) — JANGAN reuse token lama.
- Kalau sandbox punya SSH key ke GitHub (`~/.ssh/id_ed25519`) itu biasanya sudah cukup buat push tanpa token.

**Database & secrets lain** — jangan tulis ulang di sini, semuanya ada di env var Dokploy langsung (lihat bagian "Deploy" di bawah) atau di [[Infra - Panduan Troubleshooting VPS.md]]. Kalau perlu isi `.env` lokal, minta ke user, jangan asumsi/reuse dari transkrip lama (beberapa sudah di-rotate).

## Arsitektur singkat

**3 aplikasi Next.js/Express/Vite, deploy independen di 1 VPS (Dokploy + Traefik):**

| Domain | App | Source folder | Repo/branch |
|---|---|---|---|
| `easylegal.biz.id` + www | pageview (production) | `apps/web` | `main` |
| `easylegal.co.id` + www | pageview co.id (production) | `apps/web-co` (duplikat penuh dari `apps/web`, isolasi deploy) | `main` |
| pageview-dev / coid-dev | domain dev (sslip.io auto-gen) | sama seperti di atas | `develop` |
| `api.easylegal.my.id` | admin-api (Express) — **shared**, tidak ada versi dev | `apps/api` | `develop`/`main` (manual deploy) |
| `admin.easylegal.my.id/dashboard/` | admin-dashboard (Vite SPA) — **shared** | `infra/admin-dashboard` | `develop`/`main` (manual deploy) |
| `db.easylegal.my.id` | Adminer (DB viewer, basic-auth) | — | — |

**Database & MinIO/CDN**: Postgres & MinIO **shared** antara semua app di atas (satu sumber data), dikelola sebagai Dokploy Database resource terpisah (bukan container di compose file manapun).

**Standing rule (WAJIB dipatuhi)**: semua kerja kode push ke branch **`develop`** dulu. **`main` (production) HANYA disentuh kalau user eksplisit bilang** "push ke production" / "sudah oke" — jangan pernah auto-merge.

## Cara deploy

**Frontend (`apps/web`, `apps/web-co`) — auto-deploy dari Dokploy** begitu di-push ke branch yang di-track (git push cukup, tidak perlu SSH manual). Kalau mau paksa trigger:
```bash
curl -X POST "https://panel.easylegal.my.id/api/deploy/Ge2Au_0IMXd2bRNdAJSSp" \
  -H "Content-Type: application/json" \
  -H "X-GitHub-Event: push" \
  -d '{"ref":"refs/heads/main","repository":{"full_name":"Multiverse88/websiteel-app"}}'
```
(ganti `refs/heads/main` sesuai branch yang mau di-deploy — webhook nolak kalau branch gak cocok sama yang di-set di Dokploy app-nya).

**Backend (`apps/api`, `infra/admin-dashboard`) — manual, TIDAK auto-deploy.** Recipe baku (pakai SSH_ASKPASS di atas):
```bash
cd /etc/dokploy/compose/easylegal-easylegalinfra-kyda6p/code
echo '<password dari Akses VPS.md>' | sudo -S git fetch origin develop
echo '<password dari Akses VPS.md>' | sudo -S git reset --hard FETCH_HEAD
sudo docker compose -f docker-compose.infra.dokploy.yml build admin-api admin-dashboard
sudo docker compose -f docker-compose.infra.dokploy.yml up -d admin-api admin-dashboard
```
Build `admin-api` ~1.5 menit, `admin-dashboard` ~35 detik. Migration Prisma jalan otomatis saat `admin-api` start.

**Verifikasi selalu**: cek compiled code (`docker exec <container> grep -c '<keyword>' /app/dist/... atau /usr/share/nginx/html/assets/*.js`) + live curl end-to-end — jangan cuma percaya "build sukses".

## Bahaya yang sudah pernah kejadian (jangan diulang)

1. **Container duplikat / router Traefik bentrok** — sudah terjadi 2x (postgrest, admin-dashboard). Selalu ada sisa compose lama di `~/easylegal/` (folder legacy pre-Dokploy) yang kadang masih jalan diam-diam dan rebutan domain. Kalau ada gejala "kode sudah dideploy tapi kelihatan versi lama", cek `docker ps -a` cari nama container duplikat, cek label Traefik-nya (`docker inspect <name> --format '{{json .Config.Labels}}'`).
2. **PostgREST perlu di-`NOTIFY`** setiap ada kolom baru dari migration Prisma — PostgREST nge-cache schema, gak otomatis reload. `docker exec <postgres-container> psql -U postgres -d easylegal -c "NOTIFY pgrst, 'reload schema';"`.
3. **`.git` folder di repo ini kegedean (~250-450MB)** — bikin `git clone` dari VPS ke GitHub sering putus di tengah (`CANCEL (err 8)`, `early EOF`). Biasanya cuma retry aja (transient), tapi kalau berulang, cek ukuran `.git` (`git count-objects -vH`).
4. **`apps/web` dan `apps/web-co` HARUS disinkron manual** — bukan symlink/package bersama (sengaja dipisah biar deploy isolasi). Tiap kali ubah `apps/web`, cek `diff` dulu sebelum `cp` ke `apps/web-co`, jangan asumsi masih identik.
5. **Cloudflare cache** bisa nge-cache respons 404/salah kalau kena race condition pas container restart — kalau abis deploy tapi masih keliatan versi lama padahal origin sudah benar (`curl` langsung ke VPS beda dari lewat domain), curiga cache, minta user purge Cloudflare atau ganti nama file (cache-bust).

## Dokumen referensi lain di vault ini

- [[Infra - Panduan Troubleshooting VPS.md]] — detail kasus-kasus di atas + cara diagnosis
- [[PLANNING - Pisah Repo & Auto-Deploy Per Komponen.md]] — rencana (belum dieksekusi) buat misahin `apps/api`/`infra/admin-dashboard` jadi repo sendiri-sendiri
- [[notes/brainstorming-skill.md]] — metodologi brainstorm yang dipakai: klasifikasi Spike/Bounded/Architectural → tanya satu-satu → desain singkat → tunggu approval → baru eksekusi
- `websiteel-app/CLAUDE.md` — reference arsitektur kode (agak basi soal domain lama, tapi struktur foldernya akurat)
- `websiteel-app/AGENTS.md` — tabel diagnosa cepat gejala umum

## Fitur besar yang sudah dibangun sesi-sesi lalu (biar gak dikira belum ada)

- WhatsApp rotator in-house (`apps/api/src/routes/whatsapp.ts`) — fair rotation, lead tracking (`leadCode`), attribution (gads/metaads/googleseo/direct), autotext personal + override per halaman/tombol(`ctaId`)/domain, semua bisa diedit dari **Admin Dashboard → Rotator WhatsApp**.
- Auto-refresh 15s di tab Nomor & Leads dashboard.
- GA4 (`G-02KE12HWY1`) + GTM (`GTM-TVHZW45Q`) terpasang di semua halaman pageview, plus custom event `cta_whatsapp_click`/`contact_form_submit`.
- Artikel + FAQ per-artikel + header/footer global editable dari dashboard (`#/settings`).
- Diagram arsitektur terkini: [[Diagram Arsitektur - WhatsApp Rotator.html]]
