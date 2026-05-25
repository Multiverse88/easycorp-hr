import { getLogs } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollText } from 'lucide-react';
import { formatDateTime } from '@/lib/utils';
import { LogsAutoRefresh } from '@/components/logs-auto-refresh';

export const dynamic = 'force-dynamic';

function actionColor(action: string): string {
  const colors: Record<string, string> = {
    CREATE: 'bg-green-100 text-green-700',
    UPDATE: 'bg-blue-100 text-blue-700',
    DELETE: 'bg-red-100 text-red-700',
  };
  return colors[action] || 'bg-gray-100 text-gray-700';
}

export default async function LogsPage() {
  const logs = await getLogs(200);

  return (
    <div>
      <LogsAutoRefresh />
      <div className="flex items-center gap-3 mb-6">
        <ScrollText className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Log Aktivitas</h1>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Riwayat Aktivitas Sistem</CardTitle>
        </CardHeader>
        <CardContent>
          {logs.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Belum ada aktivitas tercatat
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Waktu</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aksi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tabel</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Deskripsi</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">User</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 whitespace-nowrap">
                        {formatDateTime(log.created_at)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={actionColor(log.action)}>
                          {log.action}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 font-mono text-xs">
                        {log.table_name}
                      </td>
                      <td className="py-3 px-4">{log.description}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">
                        {log.user_email || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
