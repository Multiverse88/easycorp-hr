'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Eye, Search, FileText } from 'lucide-react';
import { formatDate, statusColor, statusLabel } from '@/lib/utils';
import type { CandidateWithScore } from '@/lib/db';

const SORT_OPTIONS: Record<string, string> = {
  date_desc: 'Tanggal (Terbaru)',
  date_asc: 'Tanggal (Terlama)',
  name_asc: 'Nama (A - Z)',
  name_desc: 'Nama (Z - A)',
  score_desc: 'Skor (Tertinggi)',
  score_asc: 'Skor (Terendah)',
  status_asc: 'Status Rekrutmen',
};

export function KandidatListClient({ initialCandidates }: { initialCandidates: CandidateWithScore[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState<string>('date_desc');

  const filteredAndSortedCandidates = useMemo(() => {
    let result = [...initialCandidates];

    // Search
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      result = result.filter(
        (cand) =>
          cand.nama.toLowerCase().includes(query) ||
          cand.posisi_dilamar.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      switch (sortOrder) {
        case 'name_asc':
          return a.nama.localeCompare(b.nama);
        case 'name_desc':
          return b.nama.localeCompare(a.nama);
        case 'score_desc':
          return b.score - a.score;
        case 'score_asc':
          return a.score - b.score;
        case 'status_asc':
          return (a.status || '').localeCompare(b.status || '');
        case 'status_desc':
          return (b.status || '').localeCompare(a.status || '');
        case 'date_asc':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'date_desc':
        default:
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      }
    });

    return result;
  }, [initialCandidates, searchQuery, sortOrder]);

  return (
    <Card>
      <CardHeader className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <CardTitle>Daftar Kandidat</CardTitle>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cari nama atau posisi..."
              className="w-full pl-9"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select value={sortOrder} onValueChange={setSortOrder}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Urutkan berdasarkan...">
                {SORT_OPTIONS[sortOrder]}
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {Object.entries(SORT_OPTIONS).map(([key, label]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Nama</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Posisi</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status Rekrutmen</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Progres Tes</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Skor AI</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Tanggal</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {filteredAndSortedCandidates.length > 0 ? (
                filteredAndSortedCandidates.map((cand) => {
                  const maxTests = 4; // DISC, WPT, PAPI, Koran
                  const testsDone = cand.testCount || 0;
                  const isAllTestsDone = testsDone === maxTests;
                  
                  return (
                    <tr key={cand.id} className="border-b hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">{cand.nama}</td>
                      <td className="py-3 px-4">{cand.posisi_dilamar}</td>
                      <td className="py-3 px-4">
                        <Badge className={statusColor(cand.status)}>
                          {statusLabel(cand.status)}
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5">
                          <FileText className={`w-4 h-4 ${isAllTestsDone ? 'text-emerald-500' : testsDone > 0 ? 'text-blue-500' : 'text-muted-foreground'}`} />
                          <span className={`text-xs font-medium ${isAllTestsDone ? 'text-emerald-600' : testsDone > 0 ? 'text-blue-600' : 'text-muted-foreground'}`}>
                            {testsDone} / {maxTests}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        {cand.ai_status === 'in_progress' ? (
                          <Badge variant="outline" className="bg-amber-50 text-amber-600 border-amber-200">Proses AI...</Badge>
                        ) : cand.score > 0 ? (
                          <Badge variant="outline" className={`font-bold ${cand.score >= 80 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : cand.score >= 60 ? 'bg-blue-50 text-blue-600 border-blue-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
                            {cand.score} / 100
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground text-xs italic">-</span>
                        )}
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
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    Tidak ada kandidat yang cocok dengan pencarian Anda.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
