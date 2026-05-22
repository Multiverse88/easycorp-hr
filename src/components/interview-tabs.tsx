'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2 } from 'lucide-react';
import { LoadingOverlay } from '@/components/loading-overlay';

interface InterviewEvaluationFormProps {
  candidateId: string;
  candidateName: string;
  position: string;
}

export function InterviewTabs({ candidateId, candidateName, position }: InterviewEvaluationFormProps) {
  return <InterviewEvaluationForm candidateId={candidateId} candidateName={candidateName} position={position} />;
}

function InterviewEvaluationForm({ candidateId, candidateName, position }: InterviewEvaluationFormProps) {
  const router = useRouter();
  const aspekPenilaian = [
    'Komunikasi', 'Sikap/Attitude', 'Integritas', 'Kesesuaian Pengalaman',
    'Kemampuan Teknis', 'Problem Solving', 'Motivasi Kerja', 'Kesesuaian Budaya Kerja'
  ];

  const [penilaian, setPenilaian] = useState(
    aspekPenilaian.map(aspek => ({ aspek, skor: 0, catatan: '' }))
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updatePenilaian(index: number, field: string, value: string | number) {
    const updated = [...penilaian];
    updated[index] = { ...updated[index], [field]: value };
    setPenilaian(updated);
  }

  const totalSkor = penilaian.reduce((sum, p) => sum + p.skor, 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      candidate_id: candidateId,
      tanggal: (document.getElementById('interview_tanggal') as HTMLInputElement)?.value,
      tahap: (document.getElementById('interview_tahap') as HTMLSelectElement)?.value as 'HRGA' | 'User' | 'Final',
      interviewer: (document.getElementById('interviewer') as HTMLInputElement)?.value,
      metode: (document.getElementById('metode') as HTMLSelectElement)?.value as 'Online' | 'Offline',
      ekspektasi_gaji: Number((document.getElementById('ekspektasi_gaji') as HTMLInputElement)?.value) || 0,
      ketersediaan_bergabung: (document.getElementById('ketersediaan') as HTMLInputElement)?.value,
      penilaian,
      total_skor: totalSkor,
      kelebihan: (document.getElementById('kelebihan') as HTMLTextAreaElement)?.value,
      area_digali: (document.getElementById('area_digali') as HTMLTextAreaElement)?.value,
      catatan: (document.getElementById('catatan_interviewer') as HTMLTextAreaElement)?.value,
      rekomendasi: (document.getElementById('rekomendasi') as HTMLSelectElement)?.value as 'Lanjut Tahap Berikutnya' | 'Talent Pool' | 'Tidak Lanjut',
    };

    try {
      const response = await fetch('/api/interview-evaluation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
        router.refresh();
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-bold mb-2">Evaluasi Interview Berhasil Disimpan</h3>
          <p className="text-muted-foreground">Data evaluasi interview untuk {candidateName} telah tersimpan.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <LoadingOverlay visible={isSubmitting} message="Menyimpan evaluasi interview..." />
      <Card>
        <CardHeader>
          <CardTitle>Form Evaluasi Interview (FR-HRGA-001.03)</CardTitle>
          <div className="text-sm text-muted-foreground">
            Kandidat: <span className="font-medium text-foreground">{candidateName}</span> · Posisi: <span className="font-medium text-foreground">{position}</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Tanggal & Tahap */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="interview_tanggal">Tanggal Interview</Label>
                <Input id="interview_tanggal" type="date" required />
              </div>
              <div>
                <Label htmlFor="interview_tahap">Tahap Interview</Label>
                <select id="interview_tahap" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="HRGA">HRGA</option>
                  <option value="User">User</option>
                  <option value="Final">Final</option>
                </select>
              </div>
              <div>
                <Label htmlFor="interviewer">Nama Interviewer</Label>
                <Input id="interviewer" placeholder="Nama interviewer" required />
              </div>
              <div>
                <Label htmlFor="metode">Metode</Label>
                <select id="metode" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Online">Online</option>
                  <option value="Offline">Offline</option>
                </select>
              </div>
            </div>

            {/* Ekspektasi & Ketersediaan */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="ekspektasi_gaji">Ekspektasi Gaji</Label>
                <Input id="ekspektasi_gaji" type="number" placeholder="Ekspektasi gaji" />
              </div>
              <div>
                <Label htmlFor="ketersediaan">Ketersediaan Bergabung</Label>
                <Input id="ketersediaan" placeholder="Contoh: 1 minggu setelah offer" />
              </div>
            </div>

            {/* Penilaian */}
            <div>
              <Label className="mb-2 block">Penilaian (Skor 1-5)</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-2 px-3 font-medium">Aspek</th>
                      <th className="text-center py-2 px-3 font-medium w-20">Skor</th>
                      <th className="text-left py-2 px-3 font-medium">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {penilaian.map((p, idx) => (
                      <tr key={p.aspek} className="border-t">
                        <td className="py-2 px-3 font-medium">{p.aspek}</td>
                        <td className="py-2 px-3">
                          <Input
                            type="number"
                            min={0}
                            max={5}
                            value={p.skor}
                            onChange={(e) => updatePenilaian(idx, 'skor', Number(e.target.value))}
                            className="w-16 text-center mx-auto"
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            placeholder="Catatan..."
                            value={p.catatan}
                            onChange={(e) => updatePenilaian(idx, 'catatan', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-50 border-t font-medium">
                      <td className="py-2 px-3">Total Skor</td>
                      <td className="py-2 px-3 text-center">{totalSkor}</td>
                      <td className="py-2 px-3">dari {aspekPenilaian.length * 5}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>

            {/* Kelebihan & Area Digali */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kelebihan">Kelebihan Kandidat</Label>
                <Textarea id="kelebihan" rows={3} placeholder="Apa kelebihan utama kandidat?" />
              </div>
              <div>
                <Label htmlFor="area_digali">Area yang Perlu Digali</Label>
                <Textarea id="area_digali" rows={3} placeholder="Area apa yang masih perlu digali?" />
              </div>
            </div>

            {/* Catatan & Rekomendasi */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="catatan_interviewer">Catatan Interviewer</Label>
                <Textarea id="catatan_interviewer" rows={2} placeholder="Catatan tambahan..." />
              </div>
              <div>
                <Label htmlFor="rekomendasi">Rekomendasi</Label>
                <select id="rekomendasi" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Lanjut Tahap Berikutnya">Lanjut Tahap Berikutnya</option>
                  <option value="Talent Pool">Talent Pool</option>
                  <option value="Tidak Lanjut">Tidak Lanjut</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Simpan Evaluasi Interview
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
