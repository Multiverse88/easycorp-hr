'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { discQuestions } from '@/lib/discData';
import { calculateFitScores, getRecommendation, getLevel } from '@/lib/discParser';

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

function getFitStatus(score: number): { label: string; color: string } {
  if (score >= 75) return { label: 'SANGAT COCOK', color: 'bg-green-100 text-green-800' };
  if (score >= 60) return { label: 'COCOK', color: 'bg-blue-100 text-blue-800' };
  if (score >= 45) return { label: 'CUKUP COCOK', color: 'bg-yellow-100 text-yellow-800' };
  return { label: 'KURANG COCOK', color: 'bg-red-100 text-red-800' };
}

function getFitNote(position: string, dLvl: string, sLvl: string, cLvl: string, iLvl: string): string {
  switch (position) {
    case 'Legal Officer (LO)':
      return `C ${cLvl.toLowerCase()} (akurat, sistematis) + D ${dLvl.toLowerCase()} (decisive)`;
    case 'Customer Care / CRM':
      return `I ${iLvl.toLowerCase()} (komunikatif) + S ${sLvl.toLowerCase()} (sabar, empati)`;
    case 'PLA (Pre-Closing Lead Agent)':
      return `D+I ${dLvl.toLowerCase()},${iLvl.toLowerCase()} (agresif, persuasif, target-driven)`;
    case 'Marketing':
      return `I ${iLvl.toLowerCase()} (kreatif, storytelling) + D ${dLvl.toLowerCase()} (driven)`;
    default:
      return '-';
  }
}

export function DiscHrView({ candidateName, position, discResult }: DiscHrViewProps) {
  const scores = [
    { label: 'D', name: 'Dominance', value: Number(discResult.persen_d) || 0, color: 'bg-red-500' },
    { label: 'I', name: 'Influence', value: Number(discResult.persen_i) || 0, color: 'bg-yellow-500' },
    { label: 'S', name: 'Steadiness', value: Number(discResult.persen_s) || 0, color: 'bg-green-500' },
    { label: 'C', name: 'Conscientiousness', value: Number(discResult.persen_c) || 0, color: 'bg-blue-500' },
  ];

  const dLvl = getLevel(discResult.skor_d);
  const iLvl = getLevel(discResult.skor_i);
  const sLvl = getLevel(discResult.skor_s);
  const cLvl = getLevel(discResult.skor_c);

  const fitScores = calculateFitScores(discResult.skor_d, discResult.skor_s, discResult.skor_c, discResult.skor_i);
  const recommendation = getRecommendation(fitScores);

  const allPositions = [
    { name: 'Legal Officer (LO)', short: 'LO', score: fitScores.lo, emoji: '⚖️' },
    { name: 'Customer Care / CRM', short: 'CRM', score: fitScores.crm, emoji: '🎧' },
    { name: 'PLA (Pre-Closing Lead Agent)', short: 'PLA', score: fitScores.pla, emoji: '⚡' },
    { name: 'Marketing', short: 'Mkt', score: fitScores.mkt, emoji: '🧠' },
  ];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Hasil DISC Test</CardTitle>
          <div className="text-sm text-muted-foreground">
            Kandidat: {candidateName} · Posisi Dilamar: {position}
          </div>
        </CardHeader>
      </Card>

      {/* Skor Mentah */}
      <Card>
        <CardHeader>
          <CardTitle>A. Skor Mentah (Raw Score)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Dimensi</th>
                  <th className="text-center py-2 px-3">M Score</th>
                  <th className="text-center py-2 px-3">L Score</th>
                  <th className="text-center py-2 px-3">Net Score</th>
                  <th className="text-center py-2 px-3">% Total</th>
                  <th className="text-center py-2 px-3">Level</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">D — Dominance</td>
                  <td className="text-center py-2 px-3">{discResult.skor_d}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_d - Math.round((discResult.skor_d * Number(discResult.persen_d)) / 100)}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_d}</td>
                  <td className="text-center py-2 px-3 font-bold">{Number(discResult.persen_d)}%</td>
                  <td className="text-center py-2 px-3"><Badge variant="outline">{dLvl}</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">I — Influence</td>
                  <td className="text-center py-2 px-3">{discResult.skor_i}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_i - Math.round((discResult.skor_i * Number(discResult.persen_i)) / 100)}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_i}</td>
                  <td className="text-center py-2 px-3 font-bold">{Number(discResult.persen_i)}%</td>
                  <td className="text-center py-2 px-3"><Badge variant="outline">{iLvl}</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">S — Steadiness</td>
                  <td className="text-center py-2 px-3">{discResult.skor_s}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_s - Math.round((discResult.skor_s * Number(discResult.persen_s)) / 100)}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_s}</td>
                  <td className="text-center py-2 px-3 font-bold">{Number(discResult.persen_s)}%</td>
                  <td className="text-center py-2 px-3"><Badge variant="outline">{sLvl}</Badge></td>
                </tr>
                <tr className="border-b">
                  <td className="py-2 px-3 font-medium">C — Conscientiousness</td>
                  <td className="text-center py-2 px-3">{discResult.skor_c}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_c - Math.round((discResult.skor_c * Number(discResult.persen_c)) / 100)}</td>
                  <td className="text-center py-2 px-3">{discResult.skor_c}</td>
                  <td className="text-center py-2 px-3 font-bold">{Number(discResult.persen_c)}%</td>
                  <td className="text-center py-2 px-3"><Badge variant="outline">{cLvl}</Badge></td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Grafik Profil DISC */}
      <Card>
        <CardHeader>
          <CardTitle>Grafik Profil DISC</CardTitle>
        </CardHeader>
        <CardContent>
          {/* Large percentage display */}
          <div className="grid grid-cols-4 gap-4 mb-8">
            {scores.map((score) => (
              <div key={score.label} className="text-center">
                <div className="relative w-28 h-28 mx-auto mb-3">
                  <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                    <circle cx="50" cy="50" r="42" fill="none" stroke="#e2e8f0" strokeWidth="8" />
                    <circle
                      cx="50" cy="50" r="42" fill="none"
                      stroke={score.label === 'D' ? '#ef4444' : score.label === 'I' ? '#eab308' : score.label === 'S' ? '#22c55e' : '#3b82f6'}
                      strokeWidth="8"
                      strokeDasharray={`${(score.value / 100) * 264} 264`}
                      strokeLinecap="round"
                    />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div>
                      <div className="text-2xl font-bold">{score.value}%</div>
                    </div>
                  </div>
                </div>
                <div className="text-lg font-bold">{score.label}</div>
                <div className="text-xs text-muted-foreground">{score.name}</div>
              </div>
            ))}
          </div>

          {/* Horizontal bars with level zones */}
          <div className="space-y-6">
            {[
              { label: 'D', name: 'Dominance', value: Number(discResult.persen_d), skor: discResult.skor_d, level: dLvl, color: 'bg-red-500', description: 'Cara merespons tantangan & masalah' },
              { label: 'I', name: 'Influence', value: Number(discResult.persen_i), skor: discResult.skor_i, level: iLvl, color: 'bg-yellow-500', description: 'Cara mempengaruhi & berhubungan dengan orang lain' },
              { label: 'S', name: 'Steadiness', value: Number(discResult.persen_s), skor: discResult.skor_s, level: sLvl, color: 'bg-green-500', description: 'Cara merespons ritme & lingkungan kerja' },
              { label: 'C', name: 'Conscientiousness', value: Number(discResult.persen_c), skor: discResult.skor_c, level: cLvl, color: 'bg-blue-500', description: 'Cara merespons aturan & standar' },
            ].map((dim) => (
              <div key={dim.label} className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <span className="text-lg font-bold">{dim.label} — {dim.name}</span>
                    <span className="text-sm text-muted-foreground ml-2">({dim.description})</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold">{dim.skor}</span>
                    <Badge className={
                      dim.level === 'Sangat Tinggi' ? 'bg-blue-100 text-blue-800' :
                      dim.level === 'Tinggi' ? 'bg-green-100 text-green-800' :
                      dim.level === 'Sedang' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }>
                      {dim.level}
                    </Badge>
                  </div>
                </div>

                {/* Level zone bar */}
                <div className="relative h-8 bg-slate-200 rounded-full overflow-hidden">
                  {/* Zone backgrounds */}
                  <div className="absolute inset-0 flex">
                    <div className="w-[22%] bg-red-50 border-r border-slate-300" title="Rendah: <9" />
                    <div className="w-[13%] bg-yellow-50 border-r border-slate-300" title="Sedang: 9-13" />
                    <div className="w-[10%] bg-green-50 border-r border-slate-300" title="Tinggi: 14-17" />
                    <div className="flex-1 bg-blue-50" title="Sangat Tinggi: ≥18" />
                  </div>
                  {/* Score indicator */}
                  <div
                    className={`absolute top-0 h-full ${dim.color} rounded-full flex items-center justify-end pr-2 transition-all duration-500`}
                    style={{ width: `${Math.max(0, Math.min(100, dim.value))}%` }}
                  >
                    <span className="text-xs text-white font-bold">{dim.value}%</span>
                  </div>
                </div>

                {/* Zone labels */}
                <div className="flex mt-1 text-xs text-muted-foreground">
                  <div className="w-[22%] text-center">Rendah &lt;9</div>
                  <div className="w-[13%] text-center">Sedang 9-13</div>
                  <div className="w-[10%] text-center">Tinggi 14-17</div>
                  <div className="flex-1 text-center">Sangat Tinggi ≥18</div>
                </div>

                {/* Interpretation */}
                <div className="mt-2 text-sm">
                  <span className="font-medium">Interpretasi: </span>
                  <span className="text-muted-foreground">
                    {dim.level === 'Rendah' && dim.label === 'D' && 'Menghindari konflik, tidak agresif, lebih suka dibimbing. Kurang cocok PLA.'}
                    {dim.level === 'Sedang' && dim.label === 'D' && 'Bisa tegas bila diperlukan, namun tidak dominan. Cocok sebagai support role.'}
                    {dim.level === 'Tinggi' && dim.label === 'D' && 'Tegas, mandiri, berorientasi hasil. Cocok CRM supervisor, LO senior, PLA.'}
                    {dim.level === 'Sangat Tinggi' && dim.label === 'D' && 'Sangat dominan, kompetitif, risk taker. Sangat cocok PLA & team lead.'}

                    {dim.level === 'Rendah' && dim.label === 'I' && 'Introvert, tidak nyaman jadi pusat perhatian. Kurang cocok PLA & Marketing.'}
                    {dim.level === 'Sedang' && dim.label === 'I' && 'Komunikasi cukup baik, bisa handle klien dengan training. CRM entry-level.'}
                    {dim.level === 'Tinggi' && dim.label === 'I' && 'Komunikatif, persuasif, hangat. Sangat cocok CRM, PLA, Marketing.'}
                    {dim.level === 'Sangat Tinggi' && dim.label === 'I' && 'Karismatik, sangat persuasif. Ideal Marketing lead & senior PLA.'}

                    {dim.level === 'Rendah' && dim.label === 'S' && 'Mudah bosan, suka perubahan cepat, kurang sabar. Kurang cocok CRM panjang.'}
                    {dim.level === 'Sedang' && dim.label === 'S' && 'Cukup stabil, bisa adaptasi. Cocok hampir semua posisi dengan supervisi.'}
                    {dim.level === 'Tinggi' && dim.label === 'S' && 'Sabar, loyal, konsisten. Sangat cocok CRM (handle komplain), LO (repetitive doc).'}
                    {dim.level === 'Sangat Tinggi' && dim.label === 'S' && 'Sangat sabar & stabil. Ideal CRM, namun perlu dorongan untuk PLA/Marketing.'}

                    {dim.level === 'Rendah' && dim.label === 'C' && 'Fleksibel, kurang sistematis. Cocok Marketing kreatif, tidak cocok LO.'}
                    {dim.level === 'Sedang' && dim.label === 'C' && 'Cukup teliti, bisa mengikuti SOP. Bisa LO entry-level dengan training.'}
                    {dim.level === 'Tinggi' && dim.label === 'C' && 'Akurat, sistematis, berbasis data. Sangat cocok Legal Officer.'}
                    {dim.level === 'Sangat Tinggi' && dim.label === 'C' && 'Perfeksionis ekstrem. Sangat cocok LO senior & quality control dokumen.'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Profil Dominan */}
      <Card>
        <CardHeader>
          <CardTitle>B. Profil Dominan</CardTitle>
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

      {/* Analisa Kesesuaian Posisi */}
      <Card>
        <CardHeader>
          <CardTitle>C. Analisa Kesesuaian Posisi</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 px-3">Posisi</th>
                  <th className="text-center py-2 px-3">Skor Fit (%)</th>
                  <th className="text-center py-2 px-3">Status</th>
                  <th className="text-left py-2 px-3">Catatan HR</th>
                </tr>
              </thead>
              <tbody>
                {allPositions.map((pos) => {
                  const status = getFitStatus(pos.score);
                  const note = getFitNote(pos.name, dLvl, sLvl, cLvl, iLvl);
                  const isRecommended = recommendation.includes(pos.short) ||
                    (pos.short === 'LO' && recommendation.includes('Legal')) ||
                    (pos.short === 'CRM' && recommendation.includes('Customer')) ||
                    (pos.short === 'PLA' && recommendation.includes('PLA')) ||
                    (pos.short === 'Mkt' && recommendation.includes('Marketing'));

                  return (
                    <tr key={pos.short} className={`border-b ${isRecommended ? 'bg-blue-50' : ''}`}>
                      <td className="py-3 px-3 font-medium">
                        {pos.emoji} {pos.name}
                        {isRecommended && (
                          <Badge className="ml-2 bg-blue-600">Rekomendasi</Badge>
                        )}
                      </td>
                      <td className="text-center py-3 px-3">
                        <span className="text-lg font-bold">{pos.score}</span>
                      </td>
                      <td className="text-center py-3 px-3">
                        <Badge className={status.color}>{status.label}</Badge>
                      </td>
                      <td className="py-3 px-3 text-muted-foreground">{note}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Rekomendasi Final */}
      <Card>
        <CardHeader>
          <CardTitle>D. Rekomendasi Final HR</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-sm text-muted-foreground mb-1">Posisi Paling Direkomendasikan:</div>
              <div className="text-2xl font-bold text-blue-900">{recommendation}</div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Skor Fit Posisi Terpilih:</div>
                <div className="text-xl font-bold">
                  {recommendation.includes('Legal') ? fitScores.lo :
                   recommendation.includes('Customer') ? fitScores.crm :
                   recommendation.includes('PLA') ? fitScores.pla :
                   fitScores.mkt}%
                </div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Status:</div>
                <Badge className={
                  getFitStatus(
                    recommendation.includes('Legal') ? fitScores.lo :
                    recommendation.includes('Customer') ? fitScores.crm :
                    recommendation.includes('PLA') ? fitScores.pla :
                    fitScores.mkt
                  ).color
                }>
                  {getFitStatus(
                    recommendation.includes('Legal') ? fitScores.lo :
                    recommendation.includes('Customer') ? fitScores.crm :
                    recommendation.includes('PLA') ? fitScores.pla :
                    fitScores.mkt
                  ).label}
                </Badge>
              </div>
            </div>
            <div className="bg-amber-50 border border-amber-200 p-3 rounded-lg text-sm text-amber-800">
              ⚠️ DISC adalah alat bantu seleksi, bukan penentu tunggal. Kombinasikan dengan wawancara mendalam, tes kemampuan, & referensi.
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detail Jawaban */}
      <Card>
        <CardHeader>
          <CardTitle>Detail Jawaban</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {discResult.answers.map((answer) => {
              const question = discQuestions.find(q => q.id === answer.questionId);
              if (!question) return null;

              return (
                <div key={answer.questionId} className="flex items-center gap-4 p-2 bg-slate-50 rounded">
                  <div className="w-8 text-xs font-bold text-slate-500">#{answer.questionId}</div>
                  <div className="flex-1 text-sm">
                    <span className="text-green-600 font-medium">M: {answer.most}</span>
                    <span className="mx-2 text-slate-300">|</span>
                    <span className="text-red-600 font-medium">L: {answer.least}</span>
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
