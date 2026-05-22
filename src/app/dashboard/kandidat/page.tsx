import Link from 'next/link';
import { getCandidates, getManpowerRequests } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Eye } from 'lucide-react';
import { formatDate, statusColor } from '@/lib/utils';

export const dynamic = 'force-dynamic';

export default async function KandidatListPage() {
  const candidates = await getCandidates();
  const requests = await getManpowerRequests();

  function getRequestName(id?: string) {
    if (!id) return '-';
    const req = requests.find(r => r.id === id);
    return req ? req.posisi : '-';
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Kandidat</h1>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Kandidat</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nama</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Posisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Request</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tanggal</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((cand) => (
                  <tr key={cand.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{cand.nama}</td>
                    <td className="py-3 px-4">{cand.posisi_dilamar}</td>
                    <td className="py-3 px-4">{getRequestName(cand.manpower_request_id)}</td>
                    <td className="py-3 px-4">
                      <Badge className={statusColor(cand.status)}>
                        {cand.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">{formatDate(cand.created_at)}</td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/kandidat/${cand.id}`}>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
