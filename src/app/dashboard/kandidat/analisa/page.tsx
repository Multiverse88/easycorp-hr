import Link from 'next/link';
import { getCandidates, getDiscTestResultByCandidate } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { calculateFitScores, getRecommendation, getLevel } from '@/lib/discParser';

export const dynamic = 'force-dynamic';

export default async function AnalisaBatchPage() {
  const candidates = await getCandidates();

  // Fetch DISC results for all candidates
  const candidateData = await Promise.all(
    candidates.map(async (cand) => {
      const disc = await getDiscTestResultByCandidate(cand.id);
      return { candidate: cand, disc };
    })
  );

  // Filter only candidates with DISC results
  const withDisc = candidateData.filter(d => d.disc !== undefined);

  // Calculate fit scores
  const rows = withDisc.map((d, idx) => {
    const disc = d.disc!;
    const fitScores = calculateFitScores(
      Number(disc.skor_d),
      Number(disc.skor_s),
      Number(disc.skor_c),
      Number(disc.skor_i)
    );
    const recommendation = getRecommendation(fitScores);

    return {
      no: idx + 1,
      nama: d.candidate.nama,
      posisi: d.candidate.posisi_dilamar || '-',
      D: Number(disc.skor_d),
      S: Number(disc.skor_s),
      C: Number(disc.skor_c),
      I: Number(disc.skor_i),
      fitLo: fitScores.lo,
      fitCrm: fitScores.crm,
      fitPla: fitScores.pla,
      fitMkt: fitScores.mkt,
      recommendation,
    };
  });

  // Count recommendations
  const recCounts = {
    lo: rows.filter(r => r.recommendation.includes('Legal')).length,
    crm: rows.filter(r => r.recommendation.includes('Customer')).length,
    pla: rows.filter(r => r.recommendation.includes('PLA')).length,
    mkt: rows.filter(r => r.recommendation.includes('Marketing')).length,
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/kandidat" className="text-sm text-muted-foreground hover:underline">
            &larr; Kembali ke daftar kandidat
          </Link>
          <h1 className="text-2xl font-bold mt-2">Analisa Batch Kandidat</h1>
          <p className="text-sm text-muted-foreground">Kesesuaian posisi berdasarkan hasil DISC test</p>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold">{rows.length}</div>
            <div className="text-sm text-muted-foreground">Total Kandidat</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{recCounts.lo}</div>
            <div className="text-sm text-muted-foreground">⚖️ Legal Officer</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{recCounts.crm}</div>
            <div className="text-sm text-muted-foreground">🎧 Customer Care</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">{recCounts.pla + recCounts.mkt}</div>
            <div className="text-sm text-muted-foreground">⚡ PLA / 🧠 Marketing</div>
          </CardContent>
        </Card>
      </div>

      {/* Batch Analysis Table */}
      <Card>
        <CardHeader>
          <CardTitle>Kesesuaian Posisi per Kandidat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">No</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Nama Kandidat</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Posisi Dilamar</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">D</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">S</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">C</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">I</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fit LO (%)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fit CRM (%)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fit PLA (%)</th>
                  <th className="text-center py-3 px-2 font-medium text-muted-foreground">Fit Mkt (%)</th>
                  <th className="text-left py-3 px-2 font-medium text-muted-foreground">Rekomendasi</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => {
                  const dLvl = getLevel(row.D);
                  const sLvl = getLevel(row.S);
                  const cLvl = getLevel(row.C);
                  const iLvl = getLevel(row.I);

                  return (
                    <tr key={row.no} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-2">{row.no}</td>
                      <td className="py-3 px-2 font-medium">
                        <Link href={`/dashboard/kandidat/${candidates.find(c => c.nama === row.nama)?.id || ''}`} className="hover:underline text-blue-600">
                          {row.nama}
                        </Link>
                      </td>
                      <td className="py-3 px-2">{row.posisi}</td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline" className="text-xs">{row.D} ({dLvl})</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline" className="text-xs">{row.S} ({sLvl})</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline" className="text-xs">{row.C} ({cLvl})</Badge>
                      </td>
                      <td className="text-center py-3 px-2">
                        <Badge variant="outline" className="text-xs">{row.I} ({iLvl})</Badge>
                      </td>
                      <td className="text-center py-3 px-2 font-bold">{row.fitLo}</td>
                      <td className="text-center py-3 px-2 font-bold">{row.fitCrm}</td>
                      <td className="text-center py-3 px-2 font-bold">{row.fitPla}</td>
                      <td className="text-center py-3 px-2 font-bold">{row.fitMkt}</td>
                      <td className="py-3 px-2 font-bold">{row.recommendation}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {rows.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Belum ada kandidat yang menyelesaikan DISC test.
            </div>
          )}
        </CardContent>
      </Card>

      {/* Legend */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-sm">Keterangan Level</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-4 text-sm">
            <span><Badge variant="outline">Rendah</Badge> &lt; 9</span>
            <span><Badge variant="outline">Sedang</Badge> 9-13</span>
            <span><Badge variant="outline">Tinggi</Badge> 14-17</span>
            <span><Badge variant="outline">Sangat Tinggi</Badge> ≥ 18</span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
