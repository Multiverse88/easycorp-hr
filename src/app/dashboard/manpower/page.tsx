import Link from 'next/link';
import { getManpowerRequests } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const dynamic = 'force-dynamic';
import { Plus, Eye } from 'lucide-react';
import { statusColor } from '@/lib/utils';

export default async function ManpowerListPage() {
  const requests = await getManpowerRequests();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Manpower Request</h1>
        <Link href="/dashboard/manpower/new">
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Buat Request Baru
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Daftar Request</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">No. Request</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Posisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Divisi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Jumlah</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Urgensi</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((req) => (
                  <tr key={req.id} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-4 font-medium">{req.no_request}</td>
                    <td className="py-3 px-4">{req.posisi}</td>
                    <td className="py-3 px-4">{req.divisi}</td>
                    <td className="py-3 px-4">{req.jumlah} orang</td>
                    <td className="py-3 px-4">
                      <Badge variant={req.urgensi === 'Tinggi' ? 'destructive' : req.urgensi === 'Sedang' ? 'default' : 'secondary'}>
                        {req.urgensi}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Badge className={statusColor(req.status)}>
                        {req.status}
                      </Badge>
                    </td>
                    <td className="py-3 px-4">
                      <Link href={`/dashboard/manpower/${req.id}`}>
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
