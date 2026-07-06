'use client';

import { useState } from 'react';
import type { Candidate, PapikostikTestResult, PapikostikSession } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { FileText, Upload, CheckCircle2, Trash2, Brain, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { generatePapikostikLink } from '@/app/actions/papikostik';

interface PapikostikTestClientProps {
  candidate: Candidate;
  initialResult?: PapikostikTestResult;
  digitalSession?: PapikostikSession;
  userRole?: string | null;
}

const MOCK_PAPIKOSTIK_RESULTS = [
  { code: 'G', name: 'role of hard intens worker', score: 5, analysis: 'MIDDLE RANGE' },
  { code: 'L', name: 'leadership role', score: 7, analysis: 'HIGH ANALISYS' },
  { code: 'I', name: 'ease in decision making', score: 4, analysis: 'MIDDLE RANGE' },
  { code: 'T', name: 'pace', score: 2, analysis: 'LOW ANALISYS' },
  { code: 'V', name: 'vigorous type', score: 6, analysis: 'HIGH ANALISYS' },
  { code: 'S', name: 'social extension', score: 5, analysis: 'MIDDLE RANGE' },
  { code: 'R', name: 'theoritical type', score: 3, analysis: 'LOW ANALISYS' },
  { code: 'D', name: 'interest in working with details', score: 8, analysis: 'HIGH ANALISYS' },
  { code: 'C', name: 'organized type', score: 9, analysis: 'HIGH ANALISYS' },
  { code: 'E', name: 'emotional restraint', score: 4, analysis: 'MIDDLE RANGE' },
  { code: 'N', name: 'need to finish task', score: 6, analysis: 'HIGH ANALISYS' },
  { code: 'A', name: 'need to achieve', score: 7, analysis: 'HIGH ANALISYS' },
  { code: 'P', name: 'need to control others', score: 5, analysis: 'MIDDLE RANGE' },
  { code: 'X', name: 'need to be notice', score: 2, analysis: 'LOW ANALISYS' },
  { code: 'B', name: 'need to belong to group', score: 4, analysis: 'MIDDLE RANGE' },
  { code: 'O', name: 'need for closeness and affection', score: 5, analysis: 'MIDDLE RANGE' },
  { code: 'Z', name: 'need for change', score: 8, analysis: 'HIGH ANALISYS' },
  { code: 'K', name: 'need to be forcefull', score: 6, analysis: 'HIGH ANALISYS' },
  { code: 'F', name: 'need to support authority', score: 4, analysis: 'MIDDLE RANGE' },
  { code: 'W', name: 'need for rule and supervision', score: 5, analysis: 'MIDDLE RANGE' },
];

export function PapikostikTestClient({ candidate, initialResult, digitalSession, userRole }: PapikostikTestClientProps) {
  const [result, setResult] = useState<PapikostikTestResult | null>(initialResult || null);
  const [session, setSession] = useState<PapikostikSession | null>(digitalSession || null);
  const [file, setFile] = useState<File | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleGenerateLink() {
    setIsProcessing(true);
    setError(null);
    try {
      const res = await generatePapikostikLink(candidate.id);
      if (res.error) throw new Error(res.error);
      
      // Update local state by mocking a partial session, in a real app we'd fetch the full session or refresh
      setSession({
        id: 'new',
        candidate_id: candidate.id,
        token: res.token!,
        status: 'PENDING',
        current_page: 1,
        answers: {},
        results: null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Gagal membuat link');
    } finally {
      setIsProcessing(false);
    }
  }

  function handleCopyLink() {
    if (!session?.token) return;
    const link = `${window.location.origin}/papikostik/${session.token}`;
    navigator.clipboard.writeText(link);
    alert('Link berhasil disalin!');
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setError(null);

    const formData = new FormData();
    formData.append('candidateId', candidate.id);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-papikostik', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal mengekstrak hasil');
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete() {
    if (!result) return;
    if (!confirm('Apakah Anda yakin ingin menghapus hasil analisis Papikostik ini?')) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/upload-papikostik?id=${result.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        setResult(null);
      } else {
        throw new Error('Gagal menghapus data');
      }
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Terjadi kesalahan saat menghapus');
    } finally {
      setIsProcessing(false);
    }
  }

  return (
    <div className="space-y-6">
      <CandidateQuickActions candidateId={candidate.id} />

      {isProcessing && !result && (
        <Card className="border border-indigo-100 bg-indigo-50/50">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[250px] text-center">
            <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 animate-spin duration-3000 mb-4">
              <Brain className="w-10 h-10" />
            </div>
            <h3 className="text-xl font-bold text-slate-800">Sedang Mengekstrak Data Excel</h3>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 bg-red-50 text-red-700 border border-red-200 rounded-lg">
          <strong>Error: </strong> {error}
        </div>
      )}

      {!result && !isProcessing && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Digital Assessment Card */}
          <Card className="border-indigo-100 bg-white shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Brain className="w-5 h-5 text-indigo-600" />
                Digital Assessment
              </CardTitle>
              <CardDescription>Generate link unik untuk kandidat mengisi tes Papikostik secara online.</CardDescription>
            </CardHeader>
            <CardContent>
              {session ? (
                <div className="space-y-4">
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm font-medium text-slate-700">Status Tes:</span>
                      <Badge variant={session.status === 'COMPLETED' ? 'default' : 'secondary'} className={session.status === 'COMPLETED' ? 'bg-green-500' : ''}>
                        {session.status}
                      </Badge>
                    </div>
                    {session.status === 'PENDING' && (
                      <div className="flex justify-between items-center mb-4">
                        <span className="text-sm font-medium text-slate-700">Progres:</span>
                        <span className="text-sm text-slate-500">Halaman {session.current_page} / 9</span>
                      </div>
                    )}
                    
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" onClick={handleCopyLink} className="flex-1">
                        <LinkIcon className="w-4 h-4 mr-2" />
                        Salin Link
                      </Button>
                      <Button variant="secondary" size="sm" onClick={() => window.open(`/papikostik/${session.token}?preview=true`, '_blank')} className="flex-1">
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Buka
                      </Button>
                    </div>
                  </div>
                  
                  {session.status === 'COMPLETED' && session.results && (
                     <div className="pt-2">
                       <Button variant="default" className="w-full bg-indigo-600 hover:bg-indigo-700" onClick={() => window.location.reload()}>
                         Lihat Hasil Analisis
                       </Button>
                     </div>
                  )}
                </div>
              ) : (
                <Button onClick={handleGenerateLink} disabled={isProcessing} className="w-full bg-indigo-600 hover:bg-indigo-700">
                  <LinkIcon className="w-4 h-4 mr-2" />
                  Generate Test Link
                </Button>
              )}
            </CardContent>
          </Card>

          {/* Legacy Excel Upload Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Unggah Hasil Papikostik (Excel)</CardTitle>
              <CardDescription>Gunakan fitur ini jika kandidat mengerjakan tes secara offline.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpload} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="file">File Excel PAPIKOSTIK (.xlsx)</Label>
                  <div className="flex items-center gap-4">
                    <Input 
                      id="file" 
                      type="file" 
                      accept=".xlsx, .xls"
                      onChange={handleFileChange}
                      className="flex-1"
                    />
                  </div>
                </div>

                <Button type="submit" disabled={!file || isProcessing} className="w-full" variant="outline">
                  {isProcessing ? 'Mengunggah...' : (
                    <>
                      <Upload className="w-4 h-4 mr-2" />
                      Unggah & Ekstrak Nilai
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      )}

      {(result || (session?.status === 'COMPLETED' && session.results) || (userRole === 'superadmin' && session?.status === 'PENDING')) ? (
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    <CheckCircle2 className="w-6 h-6 text-green-500" />
                    Hasil Asesmen Papikostik
                    {userRole === 'superadmin' && session?.status === 'PENDING' && (
                      <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">
                        Developer Preview (Mock Data)
                      </Badge>
                    )}
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Sumber data: {result ? result.nama_file : 'Digital Assessment'}
                  </p>
                </div>
                {result && (
                  <Button variant="destructive" size="sm" onClick={handleDelete} disabled={isProcessing}>
                    <Trash2 className="w-4 h-4 mr-2" />
                    Hapus Hasil
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {(result?.results || session?.results || (userRole === 'superadmin' ? MOCK_PAPIKOSTIK_RESULTS : []))?.map((r: any, i: number) => (
                  <div key={i} className={`border rounded-lg p-3 shadow-sm flex flex-col justify-between ${
                    userRole === 'superadmin' && session?.status === 'PENDING' 
                      ? 'border-amber-200 bg-amber-50/30 opacity-80 grayscale-[30%]' 
                      : 'border-slate-200 bg-white'
                  }`}>
                    <div>
                      <div className="text-[10px] text-slate-500 font-semibold mb-1 tracking-wider uppercase">{r.kode || r.code} - {r.aspek || r.name}</div>
                      <div className="text-2xl font-black text-[#8B2252] mb-2">{r.skor || r.score}</div>
                    </div>
                    <div>
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700 text-xs py-0.5">
                        {r.analisis || r.analysis}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      ) : (session?.status === 'PENDING' && userRole !== 'superadmin' && (
        <div className="space-y-6">
          <Card className="border-dashed border-slate-300 bg-slate-50/50">
            <CardContent className="p-10 flex flex-col items-center justify-center text-center">
              <div className="p-4 bg-slate-100 rounded-full text-slate-400 mb-4">
                <CheckCircle2 className="w-10 h-10 opacity-50" />
              </div>
              <h3 className="text-xl font-bold text-slate-700">Menunggu Kandidat</h3>
              <p className="text-slate-500 mt-2 max-w-md">
                Tampilan hasil skor dan 20 aspek Papikostik akan otomatis muncul di sini setelah kandidat menyelesaikan seluruh 9 halaman tes.
              </p>
            </CardContent>
          </Card>
        </div>
      ))}
    </div>
  );
}
