'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { saveEmailTemplate } from '@/app/actions/email-template';
import { Save, CheckCircle2, AlertCircle, Eye, FileText, MonitorSmartphone } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function EmailTemplateForm({ initialTemplate }: { initialTemplate: any }) {
  const [template, setTemplate] = useState(initialTemplate);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState<{type: 'success' | 'error', msg: string} | null>(null);
  const [previewMode, setPreviewMode] = useState<'html' | 'text'>('html');
  const [isMounted, setIsMounted] = useState(false);
  const [logoUrl, setLogoUrl] = useState('');

  useEffect(() => {
    setLogoUrl(`${window.location.origin}/logo-ec.png`);
    setIsMounted(true);
  }, []);

  async function handleSave() {
    setIsSaving(true);
    setStatus(null);
    try {
      const res = await saveEmailTemplate(template);
      if (res.error) throw new Error(res.error);
      setStatus({ type: 'success', msg: 'Template email berhasil disimpan!' });
    } catch (err: any) {
      setStatus({ type: 'error', msg: err.message || 'Gagal menyimpan template' });
    } finally {
      setIsSaving(false);
    }
  }

  // Helper untuk memproses dummy data ke dalam template
  const processTemplate = (tmpl: string) => {
    if (!tmpl) return '';
    return tmpl
      .replace(/{{logoUrl}}/g, logoUrl)
      .replace(/{{candidateName}}/g, 'Budi Santoso')
      .replace(/{{position}}/g, 'Software Engineer')
      .replace(/{{link}}/g, 'https://easycorp.com/tes/abc-123')
      .replace(/{{token}}/g, 'ABC-123')
      .replace(/{{expiresAt}}/g, '31 Desember 2026');
  };

  const dummyHtml = processTemplate(template.htmlTemplate);
  const dummyText = processTemplate(template.textTemplate);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
      {/* Kolom Kiri: Editor */}
      <div className="space-y-6">
        {status && (
          <div className={`p-4 rounded-xl flex items-start gap-3 ${
            status.type === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}>
            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertCircle className="w-5 h-5 shrink-0" />}
            <div className="font-medium text-sm">{status.msg}</div>
          </div>
        )}

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Subjek Email</CardTitle>
            <CardDescription>Judul email yang akan muncul di inbox kandidat.</CardDescription>
          </CardHeader>
          <CardContent>
            <Input 
              value={template.subject}
              onChange={(e) => setTemplate({...template, subject: e.target.value})}
              placeholder="Undangan Asesmen - EasyCorp"
            />
          </CardContent>
        </Card>

        <Card className="border border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle>Pesan Teks (Plain Text)</CardTitle>
            <CardDescription>Digunakan jika klien email kandidat tidak mendukung HTML.</CardDescription>
          </CardHeader>
          <CardContent>
            <Textarea 
              value={template.textTemplate}
              onChange={(e) => setTemplate({...template, textTemplate: e.target.value})}
              className="min-h-[250px] font-mono text-sm"
            />
          </CardContent>
        </Card>

        <Card className="border border-indigo-100 bg-indigo-50/50 shadow-sm">
          <CardHeader>
            <CardTitle className="text-indigo-800">Variabel yang Tersedia</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-sm text-indigo-700 space-y-1 font-mono">
              <li><strong className="text-indigo-900">{"{{candidateName}}"}</strong> : Nama lengkap kandidat</li>
              <li><strong className="text-indigo-900">{"{{position}}"}</strong> : Posisi yang dilamar</li>
              <li><strong className="text-indigo-900">{"{{link}}"}</strong> : Tautan langsung ke portal ujian</li>
              <li><strong className="text-indigo-900">{"{{token}}"}</strong> : Kode token akses</li>
              <li><strong className="text-indigo-900">{"{{expiresAt}}"}</strong> : Tanggal batas akhir akses token</li>
            </ul>
          </CardContent>
        </Card>

        <div className="flex justify-start">
          <Button onClick={handleSave} disabled={isSaving} className="bg-indigo-600 hover:bg-indigo-700 min-w-[150px]">
            {isSaving ? 'Menyimpan...' : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Simpan Perubahan
              </>
            )}
          </Button>
        </div>
      </div>

      {/* Kolom Kanan: Live Preview (Sticky) */}
      <div className="relative">
        <div className="sticky top-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-slate-900 flex items-center gap-2">
              <Eye className="w-5 h-5 text-indigo-600" />
              Live Preview
            </h3>
          </div>

          <Card className="border border-slate-200 shadow-sm overflow-hidden flex flex-col h-[750px]">
            <div className="border-b bg-slate-50 p-2">
              <Tabs value={previewMode} onValueChange={(val: any) => setPreviewMode(val)} className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="html" className="flex items-center gap-2">
                    <MonitorSmartphone className="w-4 h-4" />
                    HTML Preview
                  </TabsTrigger>
                  <TabsTrigger value="text" className="flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    Plain Text
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>
            
            <div className="bg-slate-100 p-4 border-b text-sm">
              <div className="flex mb-1">
                <span className="w-20 text-slate-500 font-semibold">Subjek:</span>
                <span className="text-slate-900 font-medium">{template.subject}</span>
              </div>
              <div className="flex">
                <span className="w-20 text-slate-500 font-semibold">Ke:</span>
                <span className="text-slate-900">budi.santoso@example.com</span>
              </div>
            </div>

            <div className="flex-1 bg-white overflow-hidden relative">
              {!isMounted ? (
                <div className="flex items-center justify-center h-full text-slate-400 text-sm">Memuat preview...</div>
              ) : previewMode === 'html' ? (
                <iframe 
                  title="Email Preview"
                  srcDoc={dummyHtml}
                  className="w-full h-full border-none absolute inset-0"
                  sandbox="allow-same-origin"
                />
              ) : (
                <div className="p-6 whitespace-pre-wrap font-mono text-sm text-slate-800 h-full overflow-y-auto">
                  {dummyText}
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
