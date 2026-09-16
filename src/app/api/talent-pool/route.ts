import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { getSession } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// Data pool kandidat hanya ditambah/diubah dari spreadsheet/AppSheet (web app tidak pernah menulis).
// Route ini hanya membaca, dengan dua sumber yang didukung (dipilih otomatis):
// 1. Apps Script Web App (TALENT_POOL_URL + TALENT_POOL_KEY) — baca langsung Google Sheets.
// 2. AppSheet API v2 (APPSHEET_APP_ID + APPSHEET_ACCESS_KEY) — baca via tabel AppSheet.
// Klien melakukan polling tiap detik dengan hash untuk deteksi perubahan.

const UPSTREAM_TTL_MS = 3000;

type PoolCandidate = {
  id: string;
  nama: string;
  wa: string;
  posisi: string;
  tahapan: string;
  platform: string;
  domisili: string;
};

type PoolCache = { at: number; hash: string; count: number; candidates: PoolCandidate[] };
let cached: PoolCache | null = null;

// Nama kolom AppSheet mengikuti header sheet; cocokkan secara longgar (abaikan
// spasi/kapital) supaya tahan terhadap variasi penamaan.
const FIELD_ALIASES: Record<keyof PoolCandidate, string[]> = {
  id: ['id'],
  nama: ['nama', 'namakandidat', 'name'],
  wa: ['nomorwa', 'nomortelepon', 'telepon', 'nowa', 'phone'],
  posisi: ['posisi', 'posisidilamar', 'position'],
  tahapan: ['tahapan', 'tahap', 'stage', 'status'],
  platform: ['platform', 'sumber'],
  domisili: ['domisili', 'lokasi'],
};

function normalizeKey(k: string): string {
  return k.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function pick(row: Record<string, unknown>, aliases: string[]): string {
  for (const [k, v] of Object.entries(row)) {
    if (aliases.includes(normalizeKey(k)) && v !== null && v !== undefined) {
      const s = String(v).trim();
      if (s) return s;
    }
  }
  return '';
}

function mapRow(row: Record<string, unknown>, index: number): PoolCandidate | null {
  const nama = pick(row, FIELD_ALIASES.nama);
  if (!nama) return null;
  const id = pick(row, FIELD_ALIASES.id) || `row-${index + 1}`;
  return {
    id,
    nama,
    wa: pick(row, FIELD_ALIASES.wa),
    posisi: pick(row, FIELD_ALIASES.posisi),
    tahapan: pick(row, FIELD_ALIASES.tahapan),
    platform: pick(row, FIELD_ALIASES.platform),
    domisili: pick(row, FIELD_ALIASES.domisili),
  };
}

function hashOf(candidates: PoolCandidate[]): string {
  return createHash('md5').update(JSON.stringify(candidates)).digest('base64');
}

async function fetchFromAppsScript(): Promise<PoolCache | null> {
  const url = process.env.TALENT_POOL_URL!;
  const key = process.env.TALENT_POOL_KEY!;
  const upstream = `${url}${url.includes('?') ? '&' : '?'}key=${encodeURIComponent(key)}`;
  const res = await fetch(upstream, { cache: 'no-store' });
  const body = (await res.json()) as Record<string, unknown>;
  if (!body || body.ok !== true || !Array.isArray(body.candidates)) return null;
  const candidates = (body.candidates as Record<string, unknown>[])
    .map(mapRow)
    .filter((c): c is PoolCandidate => c !== null);
  return { at: Date.now(), hash: String(body.hash || hashOf(candidates)), count: candidates.length, candidates };
}

async function fetchFromAppSheet(): Promise<PoolCache | null> {
  const appId = process.env.APPSHEET_APP_ID!;
  const accessKey = process.env.APPSHEET_ACCESS_KEY!;
  const tableName = process.env.APPSHEET_TABLE_NAME || 'Pool';
  const res = await fetch(
    `https://api.appsheet.com/api/v2/apps/${appId}/tables/${encodeURIComponent(tableName)}/Rows`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ApplicationAccessKey: accessKey },
      body: JSON.stringify({ Action: 'Find', Properties: { Locale: 'id-ID' }, Rows: [] }),
      cache: 'no-store',
    }
  );
  if (!res.ok) return null;
  const rows = (await res.json()) as Record<string, unknown>[];
  if (!Array.isArray(rows)) return null;
  const candidates = rows.map(mapRow).filter((c): c is PoolCandidate => c !== null);
  return { at: Date.now(), hash: hashOf(candidates), count: candidates.length, candidates };
}

export async function GET(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: 'UNAUTHORIZED' }, { status: 401 });
  }

  const useAppsScript = !!(process.env.TALENT_POOL_URL && process.env.TALENT_POOL_KEY);
  const useAppSheet = !!(process.env.APPSHEET_APP_ID && process.env.APPSHEET_ACCESS_KEY);
  if (!useAppsScript && !useAppSheet) {
    return NextResponse.json({ configured: false, candidates: [], hash: '' });
  }

  if (!cached || Date.now() - cached.at > UPSTREAM_TTL_MS) {
    try {
      const fresh = useAppsScript ? await fetchFromAppsScript() : await fetchFromAppSheet();
      if (fresh) cached = fresh;
    } catch {
      // upstream gagal: lanjut dengan cache lama, atau unavailable jika kosong
    }
  }

  if (!cached) {
    return NextResponse.json({ configured: true, unavailable: true, candidates: [], hash: '' });
  }

  const clientHash = req.nextUrl.searchParams.get('hash');
  if (clientHash && clientHash === cached.hash) {
    return NextResponse.json({ changed: false, hash: clientHash });
  }

  return NextResponse.json({
    changed: true,
    hash: cached.hash,
    count: cached.count,
    updatedAt: new Date(cached.at).toISOString(),
    candidates: cached.candidates,
  });
}
