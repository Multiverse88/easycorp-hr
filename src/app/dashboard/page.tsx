import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { getManpowerRequests, getCandidates } from '@/lib/db';
import { FileText, Users, Calendar, Clock } from 'lucide-react';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const requests = await getManpowerRequests();
  const candidates = await getCandidates();

  const pendingRequests = requests.filter(r => r.status === 'submitted');

  const stats = {
    activeRequests: requests.filter(r => r.status === 'submitted' || r.status === 'verified').length,
    totalCandidates: candidates.length,
    candidatesInProcess: candidates.filter(c => c.status !== 'hired' && c.status !== 'rejected').length,
    pendingApproval: pendingRequests.length,
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Request Aktif
            </CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.activeRequests}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Kandidat
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.totalCandidates}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kandidat Proses
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.candidatesInProcess}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Approval
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.pendingApproval}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader>
            <CardTitle>Request Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {requests.slice(0, 5).map((req) => (
                <div key={req.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{req.posisi}</div>
                    <div className="text-xs text-muted-foreground">{req.no_request}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    req.status === 'approved' ? 'bg-green-100 text-green-700' :
                    req.status === 'verified' ? 'bg-yellow-100 text-yellow-700' :
                    req.status === 'submitted' ? 'bg-blue-100 text-blue-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {req.status}
                  </span>
                </div>
              ))}
              {requests.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada request</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Kandidat Terbaru</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {candidates.slice(0, 5).map((cand) => (
                <div key={cand.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                  <div>
                    <div className="font-medium text-sm">{cand.nama}</div>
                    <div className="text-xs text-muted-foreground">{cand.posisi_dilamar}</div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    cand.status === 'hired' ? 'bg-green-100 text-green-700' :
                    cand.status === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-blue-100 text-blue-700'
                  }`}>
                    {cand.status}
                  </span>
                </div>
              ))}
              {candidates.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">Belum ada kandidat</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {pendingRequests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-500" />
              Pending Approval
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {pendingRequests.map((req) => (
                <Link
                  key={req.id}
                  href={`/dashboard/manpower/${req.id}`}
                  className="flex items-center justify-between p-3 bg-orange-50 border border-orange-200 rounded-lg hover:bg-orange-100 transition-colors"
                >
                  <div>
                    <div className="font-medium text-sm">{req.posisi}</div>
                    <div className="text-xs text-muted-foreground">{req.no_request} - {req.pemohon}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground">{req.divisi}</span>
                    <div className="flex gap-1">
                      <span className={`w-3 h-3 rounded-full ${req.approval_user_at ? 'bg-green-500' : 'bg-gray-300'}`} title="User" />
                      <span className={`w-3 h-3 rounded-full ${req.approval_hrga_at ? 'bg-green-500' : 'bg-gray-300'}`} title="HRGA" />
                      <span className={`w-3 h-3 rounded-full ${req.approval_management_at ? 'bg-green-500' : 'bg-gray-300'}`} title="Management" />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
