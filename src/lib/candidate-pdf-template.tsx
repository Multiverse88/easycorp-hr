import React from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';
import type { Candidate } from './db';

interface DiscData {
  persen_d: number;
  persen_i: number;
  persen_s: number;
  persen_c: number;
  tipe_primer: string;
  tipe_sekunder: string;
}

interface WptData {
  skor: number;
  total_soal: number;
  persen_benar: number;
  kategori: string;
  profil_kemampuan: { category: string; total: number; benar: number; persen: number; keterangan: string }[];
  rekomendasi_posisi: { posisi: string; skorMin: number; skorIdeal: string; status: string; rekomendasi: string }[];
}

interface InterviewData {
  tanggal: string;
  tahap: string;
  interviewer: string;
  metode: string;
  ekspektasi_gaji: number;
  ketersediaan_bergabung: string;
  penilaian: { aspek: string; skor: number; catatan: string }[];
  total_skor: number;
  kelebihan: string;
  area_digali: string;
  catatan: string;
  rekomendasi: string;
}

export interface CandidatePdfData {
  candidate: Candidate;
  disc: DiscData | null;
  wpt: WptData | null;
  interview: InterviewData | null;
}

const colors = {
  primary: '#8B2252',
  primaryLight: '#F5E6EA',
  text: '#1E293B',
  textMuted: '#64748B',
  border: '#E2E8F0',
  bg: '#FFFFFF',
  bgAlt: '#F8FAFC',
};

const s = StyleSheet.create({
  page: { padding: 40, fontSize: 10, fontFamily: 'Helvetica', color: colors.text },
  header: { textAlign: 'center', marginBottom: 20, paddingBottom: 15, borderBottomWidth: 2, borderBottomColor: colors.primary },
  headerTitle: { fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 4 },
  headerSub: { fontSize: 9, color: colors.textMuted },
  section: { marginBottom: 18 },
  sectionTitle: { fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.primary, marginBottom: 8, paddingBottom: 4, borderBottomWidth: 1, borderBottomColor: colors.border },
  row: { flexDirection: 'row', marginBottom: 4 },
  label: { width: 120, color: colors.textMuted, fontSize: 9 },
  value: { flex: 1, fontSize: 10, fontFamily: 'Helvetica-Bold' },
  table: { marginBottom: 8 },
  tableHeader: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderBottomWidth: 1, borderBottomColor: colors.border, paddingVertical: 4 },
  tableHeaderText: { fontFamily: 'Helvetica-Bold', fontSize: 8, color: colors.primary },
  tableRow: { flexDirection: 'row', borderBottomWidth: 0.5, borderBottomColor: colors.border, paddingVertical: 3 },
  tableCell: { fontSize: 8 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, fontSize: 8, fontFamily: 'Helvetica-Bold', color: colors.bg },
  badgeGreen: { backgroundColor: '#16A34A' },
  badgeYellow: { backgroundColor: '#CA8A04' },
  badgeRed: { backgroundColor: '#DC2626' },
  badgeBlue: { backgroundColor: '#2563EB' },
  footer: { textAlign: 'center', marginTop: 30, paddingTop: 10, borderTopWidth: 1, borderTopColor: colors.border, fontSize: 8, color: colors.textMuted },
  emptyNote: { fontSize: 9, color: colors.textMuted, fontStyle: 'italic', marginBottom: 8 },
  subHeader: { fontSize: 10, fontFamily: 'Helvetica-Bold', marginBottom: 6, color: colors.text },
});

// ─── WPT → IQ Conversion Table (Official Scoring) ───────────────────────────
const WPT_IQ_TABLE: Record<number, number> = {
  10: 80, 11: 81, 12: 83, 13: 86, 14: 88,
  15: 90, 16: 93, 17: 95, 18: 97, 19: 98,
  20: 100, 21: 102, 22: 104, 23: 106, 24: 108,
  25: 111, 26: 113, 27: 114, 28: 116, 29: 119,
  30: 121, 31: 123, 32: 125, 33: 127, 34: 130,
  35: 132, 36: 136, 37: 139, 38: 142, 39: 145, 40: 150,
};

function getIqFromWpt(rawScore: number): number {
  if (rawScore in WPT_IQ_TABLE) return WPT_IQ_TABLE[rawScore];
  if (rawScore < 10) return 80;
  return 150;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '-';
  const d = new Date(dateStr);
  return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={s.section}>
      <Text style={s.sectionTitle}>{title}</Text>
      {children}
    </View>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={s.row}>
      <Text style={s.label}>{label}</Text>
      <Text style={s.value}>{value || '-'}</Text>
    </View>
  );
}

function DiscSection({ disc }: { disc: DiscData }) {
  const barWidth = (pct: number) => Math.max(0, Math.min(100, pct));
  return (
    <Section title="B. Hasil DISC Test">
      <View style={[s.table, { marginBottom: 10 }]}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, { width: 80 }]}>Komponen</Text>
          <Text style={[s.tableHeaderText, { width: 60 }]}>Persen</Text>
          <Text style={[s.tableHeaderText, { flex: 1 }]}>Level</Text>
        </View>
        {(['D', 'I', 'S', 'C'] as const).map(k => {
          const pct = disc[`persen_${k.toLowerCase()}` as keyof DiscData] as number;
          const labels: Record<string, string> = { D: 'Dominance', I: 'Influence', S: 'Steadiness', C: 'Conscientiousness' };
          return (
            <View key={k} style={s.tableRow}>
              <Text style={[s.tableCell, { width: 80, fontFamily: 'Helvetica-Bold' }]}>{k} ({labels[k]})</Text>
              <Text style={[s.tableCell, { width: 60 }]}>{pct}%</Text>
              <View style={[s.tableCell, { flex: 1, flexDirection: 'row', alignItems: 'center' }]}>
                <View style={{ width: 80, height: 6, backgroundColor: '#E2E8F0', borderRadius: 3, marginRight: 6 }}>
                  <View style={{ width: `${barWidth(pct)}%` as unknown as number, height: 6, backgroundColor: colors.primary, borderRadius: 3 }} />
                </View>
              </View>
            </View>
          );
        })}
      </View>
      <InfoRow label="Tipe Primer" value={disc.tipe_primer} />
      <InfoRow label="Tipe Sekunder" value={disc.tipe_sekunder} />
    </Section>
  );
}

function WptSection({ wpt }: { wpt: WptData }) {
  const iqScore = getIqFromWpt(wpt.skor);
  return (
    <Section title="C. Hasil Tes IQ (WPT)">
      <View style={{ flexDirection: 'row', marginBottom: 10, gap: 10 }}>
        <View style={{ flex: 1, backgroundColor: colors.bgAlt, padding: 8, borderRadius: 4, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{iqScore}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>Skor IQ</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.bgAlt, padding: 8, borderRadius: 4, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{wpt.skor}/{wpt.total_soal}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>Skor Total</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.bgAlt, padding: 8, borderRadius: 4, alignItems: 'center' }}>
          <Text style={{ fontSize: 18, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{Math.round(wpt.persen_benar * 100)}%</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>Benar</Text>
        </View>
        <View style={{ flex: 1, backgroundColor: colors.bgAlt, padding: 8, borderRadius: 4, alignItems: 'center' }}>
          <Text style={{ fontSize: 12, fontFamily: 'Helvetica-Bold', color: colors.primary }}>{wpt.kategori}</Text>
          <Text style={{ fontSize: 8, color: colors.textMuted }}>Kategori</Text>
        </View>
      </View>

      <Text style={s.subHeader}>Profil Kemampuan per Kategori</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, { flex: 1 }]}>Kategori</Text>
          <Text style={[s.tableHeaderText, { width: 50 }]}>Benar</Text>
          <Text style={[s.tableHeaderText, { width: 40 }]}>%</Text>
          <Text style={[s.tableHeaderText, { width: 80 }]}>Keterangan</Text>
        </View>
        {wpt.profil_kemampuan.map((p, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 1 }]}>{p.category}</Text>
            <Text style={[s.tableCell, { width: 50 }]}>{p.benar}/{p.total}</Text>
            <Text style={[s.tableCell, { width: 40 }]}>{Math.round(p.persen * 100)}%</Text>
            <Text style={[s.tableCell, { width: 80 }]}>{p.keterangan}</Text>
          </View>
        ))}
      </View>

      <Text style={s.subHeader}>Rekomendasi Posisi</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, { flex: 1 }]}>Posisi</Text>
          <Text style={[s.tableHeaderText, { width: 40 }]}>Min</Text>
          <Text style={[s.tableHeaderText, { width: 50 }]}>Ideal</Text>
          <Text style={[s.tableHeaderText, { width: 70 }]}>Status</Text>
        </View>
        {wpt.rekomendasi_posisi.map((r, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 1 }]}>{r.posisi}</Text>
            <Text style={[s.tableCell, { width: 40 }]}>{r.skorMin}</Text>
            <Text style={[s.tableCell, { width: 50 }]}>{r.skorIdeal}</Text>
            <Text style={[s.tableCell, { width: 70 }]}>{r.status}</Text>
          </View>
        ))}
      </View>
    </Section>
  );
}

function InterviewSection({ interview }: { interview: InterviewData }) {
  return (
    <Section title="E. Evaluasi Interview">
      <InfoRow label="Tanggal" value={formatDate(interview.tanggal)} />
      <InfoRow label="Tahap" value={interview.tahap} />
      <InfoRow label="Interviewer" value={interview.interviewer} />
      <InfoRow label="Metode" value={interview.metode} />
      <InfoRow label="Ekspektasi Gaji" value={interview.ekspektasi_gaji ? `Rp ${interview.ekspektasi_gaji.toLocaleString('id-ID')}` : '-'} />
      <InfoRow label="Ketersediaan Bergabung" value={interview.ketersediaan_bergabung || '-'} />

      <Text style={[s.subHeader, { marginTop: 8 }]}>Penilaian</Text>
      <View style={s.table}>
        <View style={s.tableHeader}>
          <Text style={[s.tableHeaderText, { flex: 1 }]}>Aspek</Text>
          <Text style={[s.tableHeaderText, { width: 40 }]}>Skor</Text>
          <Text style={[s.tableHeaderText, { flex: 1 }]}>Catatan</Text>
        </View>
        {interview.penilaian.map((p, i) => (
          <View key={i} style={s.tableRow}>
            <Text style={[s.tableCell, { flex: 1 }]}>{p.aspek}</Text>
            <Text style={[s.tableCell, { width: 40 }]}>{p.skor || '-'}</Text>
            <Text style={[s.tableCell, { flex: 1 }]}>{p.catatan || '-'}</Text>
          </View>
        ))}
      </View>
      <InfoRow label="Total Skor" value={String(interview.total_skor)} />
      <InfoRow label="Kelebihan" value={interview.kelebihan} />
      <InfoRow label="Area Digali" value={interview.area_digali} />
      <InfoRow label="Catatan" value={interview.catatan} />
      <InfoRow label="Rekomendasi" value={interview.rekomendasi} />
    </Section>
  );
}

export function CandidatePdfDocument({ data }: { data: CandidatePdfData }) {
  const { candidate, disc, wpt, interview } = data;
  const now = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

  return (
    <Document>
      <Page size="A4" style={s.page}>
        {/* Header */}
        <View style={s.header}>
          <Text style={s.headerTitle}>EASYCORP RECRUITMENT REPORT</Text>
          <Text style={s.headerSub}>Data Lengkap Kandidat &bull; {now}</Text>
        </View>

        {/* A. Biodata */}
        <Section title="A. Biodata Kandidat">
          <InfoRow label="Nama Lengkap" value={candidate.nama} />
          <InfoRow label="Email" value={candidate.email} />
          <InfoRow label="Telepon" value={candidate.telepon} />
          <InfoRow label="Posisi Dilamar" value={candidate.posisi_dilamar} />
          <InfoRow label="Pendidikan" value={candidate.pendidikan || '-'} />
          <InfoRow label="Pengalaman" value={candidate.pengalaman || '-'} />
          <InfoRow label="Keahlian" value={candidate.keahlian || '-'} />
          <InfoRow label="Token" value={candidate.token} />
          <InfoRow label="Status" value={candidate.status?.replace('_', ' ').toUpperCase() || '-'} />
        </Section>

        {/* B. DISC */}
        {disc ? (
          <DiscSection disc={disc} />
        ) : (
          <Section title="B. Hasil DISC Test">
            <Text style={s.emptyNote}>Kandidat belum mengerjakan tes DISC.</Text>
          </Section>
        )}

        {/* C. WPT */}
        {wpt ? (
          <WptSection wpt={wpt} />
        ) : (
          <Section title="C. Hasil Tes IQ (WPT)">
            <Text style={s.emptyNote}>Kandidat belum mengerjakan tes IQ (WPT).</Text>
          </Section>
        )}

        {/* D. Interview */}
        {interview ? (
          <InterviewSection interview={interview} />
        ) : (
          <Section title="D. Evaluasi Interview">
            <Text style={s.emptyNote}>Belum ada evaluasi interview.</Text>
          </Section>
        )}

        {/* Footer */}
        <Text style={s.footer}>EasyCorp &copy; 2026 &bull; Recruitment System &bull; Dokumen ini digenerate secara otomatis</Text>
      </Page>
    </Document>
  );
}
