'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingOverlay } from '@/components/loading-overlay';

export function SelectionTestFormClient({ candidateId, candidateName, position }: { candidateId: string; candidateName: string; position: string }) {
  const [komponen, setKomponen] = useState([
    { nama: 'Psikotes/DISC', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'PAPIKOSTIK', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Case Study', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Tes Adm/Typing/Writing', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Tes Bahasa/Komunikasi', nilai: '', batas_lulus: '', catatan: '' },
    { nama: 'Lainnya', nilai: '', batas_lulus: '', catatan: '' },
  ]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  function updateKomponen(index: number, field: string, value: string) {
    const updated = [...komponen];
    updated[index] = { ...updated[index], [field]: value };
    setKomponen(updated);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = {
      candidate_id: candidateId,
      tanggal_tes: (document.getElementById('tanggal_tes') as HTMLInputElement)?.value,
      penyelenggara: (document.getElementById('penyelenggara') as HTMLInputElement)?.value,
      komponen,
      kesimpulan: (document.getElementById('kesimpulan') as HTMLSelectElement)?.value as 'Lulus' | 'Lulus Bersyarat' | 'Tidak Lulus',
      catatan_akhir: (document.getElementById('catatan_akhir') as HTMLTextAreaElement)?.value,
    };

    try {
      const response = await fetch('/api/selection-test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        setSubmitted(true);
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
          <div className="text-green-600 text-4xl mb-4">&#10003;</div>
          <h3 className="text-lg font-bold mb-2">Hasil Tes Berhasil Disimpan</h3>
          <p className="text-muted-foreground mb-4">Data hasil tes seleksi untuk {candidateName} telah tersimpan.</p>
          <Button onClick={() => setSubmitted(false)}>Input Lagi</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <LoadingOverlay visible={isSubmitting} message="Menyimpan hasil tes seleksi..." />
      <Card>
        <CardHeader>
          <CardTitle>Form Hasil Tes Seleksi (FR-HRGA-001.02)</CardTitle>
          <div className="text-sm text-muted-foreground">
            Kandidat: <span className="font-medium text-foreground">{candidateName}</span> · Posisi: <span className="font-medium text-foreground">{position}</span>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="tanggal_tes">Tanggal Tes</Label>
                <Input id="tanggal_tes" type="date" required />
              </div>
              <div>
                <Label htmlFor="penyelenggara">Penyelenggara / Penguji</Label>
                <Input id="penyelenggara" placeholder="Nama penyelenggara" required />
              </div>
            </div>

            <div>
              <Label className="mb-2 block">Komponen Tes</Label>
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-slate-50">
                      <th className="text-left py-2 px-3 font-medium">Komponen</th>
                      <th className="text-left py-2 px-3 font-medium">Nilai / Status</th>
                      <th className="text-left py-2 px-3 font-medium">Batas Lulus</th>
                      <th className="text-left py-2 px-3 font-medium">Catatan</th>
                    </tr>
                  </thead>
                  <tbody>
                    {komponen.map((k, idx) => (
                      <tr key={k.nama} className="border-t">
                        <td className="py-2 px-3 font-medium">{k.nama}</td>
                        <td className="py-2 px-3">
                          <Input
                            placeholder="Nilai..."
                            value={k.nilai}
                            onChange={(e) => updateKomponen(idx, 'nilai', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            placeholder="Batas..."
                            value={k.batas_lulus}
                            onChange={(e) => updateKomponen(idx, 'batas_lulus', e.target.value)}
                          />
                        </td>
                        <td className="py-2 px-3">
                          <Input
                            placeholder="Catatan..."
                            value={k.catatan}
                            onChange={(e) => updateKomponen(idx, 'catatan', e.target.value)}
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="kesimpulan">Kesimpulan</Label>
                <select id="kesimpulan" className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                  <option value="Lulus">Lulus</option>
                  <option value="Lulus Bersyarat">Lulus Bersyarat</option>
                  <option value="Tidak Lulus">Tidak Lulus</option>
                </select>
              </div>
              <div>
                <Label htmlFor="catatan_akhir">Catatan Akhir</Label>
                <Textarea id="catatan_akhir" rows={2} placeholder="Catatan akhir..." />
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Simpan Hasil Tes
            </Button>
          </form>
        </CardContent>
      </Card>
    </>
  );
}
