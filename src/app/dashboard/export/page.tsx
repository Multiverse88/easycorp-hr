'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Download, FileSpreadsheet, FileText } from 'lucide-react';

export default function ExportPage() {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExportExcel(type: 'manpower' | 'candidates') {
    setIsExporting(true);
    try {
      const response = await fetch(`/api/export/${type}`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${type}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Export error:', error);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Export & Laporan</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Manpower Request
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export semua data Manpower Request ke file Excel.
            </p>
            <Button
              onClick={() => handleExportExcel('manpower')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Mengexport...' : 'Download Excel'}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileSpreadsheet className="w-5 h-5" />
              Export Data Kandidat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export semua data kandidat beserta status rekrutmen.
            </p>
            <Button
              onClick={() => handleExportExcel('candidates')}
              disabled={isExporting}
            >
              <Download className="w-4 h-4 mr-2" />
              {isExporting ? 'Mengexport...' : 'Download Excel'}
            </Button>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Export PDF per Form
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Export form dalam format PDF. Pilih kandidat dan form yang ingin diexport dari halaman detail kandidat.
            </p>
            <div className="text-sm text-muted-foreground">
              Fitur PDF tersedia di halaman detail kandidat &rarr; pilih form &rarr; klik &quot;Export PDF&quot;.
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
