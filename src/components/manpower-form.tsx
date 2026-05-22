'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LoadingOverlay } from '@/components/loading-overlay';

const formSchema = z.object({
  divisi: z.string().min(1, 'Divisi wajib diisi'),
  pemohon: z.string().min(1, 'Nama pemohon wajib diisi'),
  jabatan_pemohon: z.string().min(1, 'Jabatan wajib diisi'),
  atasan_pemohon: z.string().min(1, 'Atasan wajib diisi'),
  posisi: z.string().min(1, 'Posisi wajib diisi'),
  jumlah: z.number().min(1, 'Jumlah minimal 1'),
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
  range_gaji_min: z.number().min(0),
  range_gaji_max: z.number().min(0),
  benefit: z.string().min(1, 'Benefit wajib diisi'),
});

type FormData = z.infer<typeof formSchema>;

export function ManpowerForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
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
    setIsSubmitting(true);
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
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <LoadingOverlay visible={isSubmitting} message="Menyimpan request manpower..." />
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Informasi Dasar */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Divisi</Label>
              <Input {...register('divisi')} placeholder="Nama divisi" />
              {errors.divisi && <p className="text-red-500 text-xs mt-1">{errors.divisi.message}</p>}
            </div>
            <div>
              <Label>Nama Pemohon</Label>
              <Input {...register('pemohon')} placeholder="Nama lengkap" />
              {errors.pemohon && <p className="text-red-500 text-xs mt-1">{errors.pemohon.message}</p>}
            </div>
            <div>
              <Label>Jabatan Pemohon</Label>
              <Input {...register('jabatan_pemohon')} placeholder="Jabatan" />
              {errors.jabatan_pemohon && <p className="text-red-500 text-xs mt-1">{errors.jabatan_pemohon.message}</p>}
            </div>
            <div>
              <Label>Atasan Langsung</Label>
              <Input {...register('atasan_pemohon')} placeholder="Nama atasan" />
              {errors.atasan_pemohon && <p className="text-red-500 text-xs mt-1">{errors.atasan_pemohon.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Posisi */}
        <Card>
          <CardHeader>
            <CardTitle>Detail Posisi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Posisi yang Dibutuhkan</Label>
              <Input {...register('posisi')} placeholder="Nama posisi" />
              {errors.posisi && <p className="text-red-500 text-xs mt-1">{errors.posisi.message}</p>}
            </div>
            <div>
              <Label>Jumlah</Label>
              <Input type="number" {...register('jumlah', { valueAsNumber: true })} placeholder="Jumlah" />
              {errors.jumlah && <p className="text-red-500 text-xs mt-1">{errors.jumlah.message}</p>}
            </div>
            <div>
              <Label>Lokasi</Label>
              <Input {...register('lokasi')} placeholder="Lokasi kerja" />
              {errors.lokasi && <p className="text-red-500 text-xs mt-1">{errors.lokasi.message}</p>}
            </div>
            <div>
              <Label>Tanggal Dibutuhkan</Label>
              <Input type="date" {...register('tanggal_dibutuhkan')} />
              {errors.tanggal_dibutuhkan && <p className="text-red-500 text-xs mt-1">{errors.tanggal_dibutuhkan.message}</p>}
            </div>
            <div>
              <Label>Jenis Kebutuhan</Label>
              <select {...register('jenis_kebutuhan')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="Posisi Baru">Posisi Baru</option>
                <option value="Replacement">Replacement</option>
                <option value="Tambahan Tim">Tambahan Tim</option>
              </select>
            </div>
            {jenisKebutuhan === 'Replacement' && (
              <div>
                <Label>Nama Karyawan yang Diganti</Label>
                <Input {...register('replacement_name')} placeholder="Nama karyawan" />
              </div>
            )}
            <div>
              <Label>Status Karyawan</Label>
              <select {...register('status_karyawan')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="PKWTT">PKWTT</option>
                <option value="PKWT">PKWT</option>
                <option value="Magang">Magang</option>
                <option value="Outsource">Outsource</option>
              </select>
            </div>
            <div>
              <Label>Urgensi</Label>
              <select {...register('urgensi')} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
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
              <Label>Alasan Permintaan</Label>
              <Textarea {...register('alasan')} rows={3} placeholder="Jelaskan alasan permintaan..." />
              {errors.alasan && <p className="text-red-500 text-xs mt-1">{errors.alasan.message}</p>}
            </div>
            <div>
              <Label>Ringkasan Jobdesk</Label>
              <Textarea {...register('jobdesk')} rows={3} placeholder="Jelaskan jobdesk utama..." />
              {errors.jobdesk && <p className="text-red-500 text-xs mt-1">{errors.jobdesk.message}</p>}
            </div>
          </CardContent>
        </Card>

        {/* Kualifikasi */}
        <Card>
          <CardHeader>
            <CardTitle>Kualifikasi</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Pendidikan Minimal</Label>
              <Input {...register('kualifikasi_pendidikan')} placeholder="Contoh: S1 Hukum" />
              {errors.kualifikasi_pendidikan && <p className="text-red-500 text-xs mt-1">{errors.kualifikasi_pendidikan.message}</p>}
            </div>
            <div>
              <Label>Pengalaman</Label>
              <Input {...register('kualifikasi_pengalaman')} placeholder="Contoh: 2 tahun" />
              {errors.kualifikasi_pengalaman && <p className="text-red-500 text-xs mt-1">{errors.kualifikasi_pengalaman.message}</p>}
            </div>
            <div>
              <Label>Keahlian Teknis</Label>
              <Input {...register('kualifikasi_keahlian')} placeholder="Keahlian yang dibutuhkan" />
              {errors.kualifikasi_keahlian && <p className="text-red-500 text-xs mt-1">{errors.kualifikasi_keahlian.message}</p>}
            </div>
            <div>
              <Label>Soft Skill</Label>
              <Input {...register('kualifikasi_softskill')} placeholder="Soft skill yang dibutuhkan" />
              {errors.kualifikasi_softskill && <p className="text-red-500 text-xs mt-1">{errors.kualifikasi_softskill.message}</p>}
            </div>
            <div className="md:col-span-2">
              <Label>Catatan Khusus (Opsional)</Label>
              <Input {...register('kualifikasi_catatan')} placeholder="Catatan tambahan..." />
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
              <Label>Gaji Minimum (Rp)</Label>
              <Input type="number" {...register('range_gaji_min', { valueAsNumber: true })} placeholder="0" />
            </div>
            <div>
              <Label>Gaji Maksimum (Rp)</Label>
              <Input type="number" {...register('range_gaji_max', { valueAsNumber: true })} placeholder="0" />
            </div>
            <div className="md:col-span-2">
              <Label>Benefit / Tunjangan</Label>
              <Textarea {...register('benefit')} rows={2} placeholder="BPJS, tunjangan, fasilitas..." />
              {errors.benefit && <p className="text-red-500 text-xs mt-1">{errors.benefit.message}</p>}
            </div>
          </CardContent>
        </Card>

        <Button type="submit" className="w-full" disabled={isSubmitting}>
          Submit Request Manpower
        </Button>
      </form>
    </>
  );
}
