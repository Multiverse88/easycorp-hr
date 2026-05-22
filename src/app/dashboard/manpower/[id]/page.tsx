// src/app/dashboard/manpower/[id]/page.tsx
import { getManpowerRequestById } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { formatRupiah, formatDate, statusColor } from '@/lib/utils';
import Link from 'next/link';
import { ApprovalActions } from '@/components/approval-actions';

export const dynamic = 'force-dynamic';

export default async function ManpowerDetailPage({ params }: { params: { id: string } }) {
  const req = await getManpowerRequestById(params.id);
  if (!req) {
    return <div className="p-8">Request tidak ditemukan</div>;
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Link href="/dashboard/manpower" className="text-sm text-muted-foreground hover:underline">
            &larr; Kembali ke daftar
          </Link>
          <h1 className="text-2xl font-bold mt-2">Detail Manpower Request</h1>
        </div>
        <Badge className={statusColor(req.status)}>{req.status}</Badge>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Informasi Dasar */}
        <Card>
          <CardHeader>
            <CardTitle>Informasi Dasar</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">No. Request</div>
                <div className="font-medium">{req.no_request}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tanggal</div>
                <div className="font-medium">{formatDate(req.tanggal)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Divisi</div>
                <div className="font-medium">{req.divisi}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Pemohon</div>
                <div className="font-medium">{req.pemohon}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Jabatan Pemohon</div>
                <div className="font-medium">{req.jabatan_pemohon}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Atasan Pemohon</div>
                <div className="font-medium">{req.atasan_pemohon}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Posisi yang Dibutuhkan */}
        <Card>
          <CardHeader>
            <CardTitle>Posisi yang Dibutuhkan</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Posisi</div>
                <div className="font-medium">{req.posisi}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Jumlah</div>
                <div className="font-medium">{req.jumlah} orang</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Lokasi</div>
                <div className="font-medium">{req.lokasi}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Tanggal Dibutuhkan</div>
                <div className="font-medium">{formatDate(req.tanggal_dibutuhkan)}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Jenis Kebutuhan</div>
                <Badge variant="outline">{req.jenis_kebutuhan}</Badge>
              </div>
              {req.jenis_kebutuhan === 'Replacement' && req.replacement_name && (
                <div>
                  <div className="text-sm text-muted-foreground">Nama Karyawan Diganti</div>
                  <div className="font-medium">{req.replacement_name}</div>
                </div>
              )}
              <div>
                <div className="text-sm text-muted-foreground">Status Karyawan</div>
                <div className="font-medium">{req.status_karyawan}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Urgensi</div>
                <Badge variant={req.urgensi === 'Tinggi' ? 'destructive' : req.urgensi === 'Sedang' ? 'default' : 'secondary'}>
                  {req.urgensi}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alasan & Jobdesk */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Alasan & Jobdesk</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground mb-1">Alasan Permintaan</div>
              <div className="p-3 bg-slate-50 rounded-lg">{req.alasan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground mb-1">Ringkasan Jobdesk</div>
              <div className="p-3 bg-slate-50 rounded-lg">{req.jobdesk}</div>
            </div>
          </CardContent>
        </Card>

        {/* Kualifikasi */}
        <Card>
          <CardHeader>
            <CardTitle>Kualifikasi Wajib</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="text-sm text-muted-foreground">Pendidikan</div>
              <div className="font-medium">{req.kualifikasi.pendidikan}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Pengalaman</div>
              <div className="font-medium">{req.kualifikasi.pengalaman}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Keahlian Teknis</div>
              <div className="font-medium">{req.kualifikasi.keahlian}</div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Soft Skill</div>
              <div className="font-medium">{req.kualifikasi.softskill}</div>
            </div>
            {req.kualifikasi.catatan && (
              <div>
                <div className="text-sm text-muted-foreground">Catatan Khusus</div>
                <div className="font-medium">{req.kualifikasi.catatan}</div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Kompensasi */}
        <Card>
          <CardHeader>
            <CardTitle>Kompensasi</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">Range Gaji</div>
              <div className="font-medium">
                {formatRupiah(req.range_gaji.min)} — {formatRupiah(req.range_gaji.max)}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Benefit/Tunjangan</div>
              <div className="font-medium">{req.benefit}</div>
            </div>
          </CardContent>
        </Card>

        {/* Approval Actions */}
        <ApprovalActions id={params.id} status={req.status} />

        {/* Approval Timeline */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Timeline Approval</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-4">
              <div className={`flex-1 p-4 rounded-lg ${req.approval_user_at ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <div className="text-sm font-medium">User Submit</div>
                <div className="text-xs text-muted-foreground">{req.approval_user_at ? formatDate(req.approval_user_at) : 'Menunggu'}</div>
              </div>
              <div className={`flex-1 p-4 rounded-lg ${req.approval_hrga_at ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <div className="text-sm font-medium">HRGA Verifikasi</div>
                <div className="text-xs text-muted-foreground">{req.approval_hrga_at ? formatDate(req.approval_hrga_at) : 'Menunggu'}</div>
              </div>
              <div className={`flex-1 p-4 rounded-lg ${req.approval_management_at ? 'bg-green-50 border border-green-200' : 'bg-slate-50'}`}>
                <div className="text-sm font-medium">Management Approve</div>
                <div className="text-xs text-muted-foreground">{req.approval_management_at ? formatDate(req.approval_management_at) : 'Menunggu'}</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
