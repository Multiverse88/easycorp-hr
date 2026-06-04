'use client';

import { useState } from 'react';
import type { Candidate, KoranTestResult } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { CandidateQuickActions } from '@/components/candidate-quick-actions';
import { 
  FileText, Upload, Brain, Sparkles, CheckCircle2, 
  Trash2, AlertCircle, RefreshCw, BarChart2, Activity, Zap
} from 'lucide-react';

interface KoranTestClientProps {
  candidate: Candidate;
  initialResult?: KoranTestResult;
}

export function KoranTestClient({ candidate, initialResult }: KoranTestClientProps) {
  const [result, setResult] = useState<KoranTestResult | null>(initialResult || null);
  const [documentName, setDocumentName] = useState(`Tes Koran - ${candidate.nama}`);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingStep, setProcessingStep] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processingSteps = [
    'Mengunggah berkas lembar tes...',
    'Menganalisis pola tulisan tangan dan digit...',
    'Menghitung kurva kerja dan tingkat ketelitian...',
    'Menyusun laporan penalaran psikologis AI...'
  ];

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const selected = e.target.files?.[0];
    if (selected) {
      setFile(selected);
      const reader = new FileReader();
      reader.onloadend = () => {
        setFilePreview(reader.result as string);
      };
      reader.readAsDataURL(selected);
    }
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;

    setIsProcessing(true);
    setError(null);
    setProcessingStep(0);

    // Simulate progress steps
    const stepIntervals = [1500, 2500, 2500, 3000];
    let currentStep = 0;
    
    const stepTimer = setInterval(() => {
      if (currentStep < processingSteps.length - 1) {
        currentStep++;
        setProcessingStep(currentStep);
      }
    }, 2000);

    const formData = new FormData();
    formData.append('candidateId', candidate.id);
    formData.append('namaFile', documentName);
    formData.append('file', file);

    try {
      const response = await fetch('/api/upload-koran', {
        method: 'POST',
        body: formData,
      });

      clearInterval(stepTimer);

      if (!response.ok) {
        const errData = await response.json();
        throw new Error(errData.error || 'Gagal menganalisis gambar');
      }

      const data = await response.json();
      setResult(data);
      setFile(null);
      setFilePreview(null);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : 'Terjadi kesalahan tidak terduga');
    } finally {
      setIsProcessing(false);
    }
  }

  async function handleDelete() {
    if (!result) return;
    if (!confirm('Apakah Anda yakin ingin menghapus hasil analisis Tes Koran ini?')) return;

    setIsProcessing(true);
    try {
      const res = await fetch(`/api/upload-koran?id=${result.id}`, {
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
        <Card className="border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-purple-50/30 overflow-hidden shadow-lg animate-pulse">
          <CardContent className="p-8 flex flex-col items-center justify-center min-h-[350px] text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 rounded-full bg-indigo-500/10 blur-xl animate-ping" />
              <div className="p-4 bg-indigo-100 rounded-full text-indigo-600 animate-spin duration-3000">
                <Brain className="w-10 h-10" />
              </div>
            </div>
            <h3 className="text-xl font-extrabold text-slate-800 mb-2">Sedang Menganalisis Lembar Tes Koran</h3>
            
            <div className="w-full max-w-md bg-slate-100 rounded-full h-2 mb-4 overflow-hidden border">
              <div 
                className="bg-indigo-600 h-2 rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${((processingStep + 1) / processingSteps.length) * 100}%` }}
              />
            </div>
            
            <div className="flex items-center gap-2 text-indigo-700 font-bold text-sm">
              <Sparkles className="w-4 h-4 animate-bounce text-amber-500" />
              <span>{processingSteps[processingStep]}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold block">Gagal Melakukan Analisis</span>
            <span className="text-sm">{error}</span>
          </div>
        </div>
      )}

      {!result && !isProcessing && (
        <Card className="border border-slate-200 shadow-xl overflow-hidden hover:border-slate-300 transition-all duration-300">
          <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-700 text-white p-5">
            <CardTitle className="flex items-center gap-2">
              <Upload className="w-5 h-5" />
              Unggah Lembar Hasil Tes Koran
            </CardTitle>
            <p className="text-xs text-emerald-100 mt-1">Unggah foto hasil pengerjaan Pauli atau Kraepelin Test untuk dianalisis oleh AI.</p>
          </CardHeader>
          <CardContent className="p-6">
            <form onSubmit={handleUpload} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="docName">Nama Dokumen / Tes</Label>
                <Input 
                  id="docName"
                  value={documentName}
                  onChange={(e) => setDocumentName(e.target.value)}
                  placeholder="Ketik nama dokumen..."
                  required
                />
              </div>

              <div className="space-y-2">
                <Label>Foto Lembar Tes</Label>
                <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50/50 hover:bg-slate-50 transition-all duration-150 flex flex-col items-center justify-center cursor-pointer relative group">
                  <input 
                    type="file" 
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                    required
                  />
                  {filePreview ? (
                    <div className="text-center">
                      <img 
                        src={filePreview} 
                        alt="Preview" 
                        className="max-h-56 rounded-lg shadow border-2 border-white mx-auto mb-4 object-contain"
                      />
                      <span className="font-bold text-slate-700 text-sm block truncate max-w-xs">{file?.name}</span>
                      <span className="text-xs text-slate-400 font-semibold">Klik atau seret untuk mengganti foto</span>
                    </div>
                  ) : (
                    <div className="text-center py-6">
                      <div className="p-4 bg-white rounded-full inline-flex text-slate-400 group-hover:text-emerald-600 group-hover:scale-110 shadow-sm border transition-all mb-4">
                        <Upload className="w-8 h-8" />
                      </div>
                      <span className="font-extrabold text-slate-800 text-base block mb-1">Seret & taruh foto di sini</span>
                      <span className="text-xs text-slate-400 block font-semibold">Mendukung format PNG, JPG, JPEG</span>
                    </div>
                  )}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white font-bold h-10 shadow"
                disabled={!file}
              >
                Mulai Analisis AI
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {result && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Results Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-xl overflow-hidden">
              <CardHeader className="bg-gradient-to-r from-slate-900 to-slate-850 text-white p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-400" />
                    <CardTitle className="text-lg">{result.nama_file}</CardTitle>
                  </div>
                  <p className="text-xs text-slate-400 font-semibold mt-1">ID Analisis: {result.id}</p>
                </div>
                <div className="flex gap-2 shrink-0">
                  <Badge className={
                    result.analysis_result.rekomendasi === 'Lulus' ? 'bg-green-600 hover:bg-green-700 text-white text-xs font-extrabold' :
                    result.analysis_result.rekomendasi === 'Dipertimbangkan' ? 'bg-yellow-600 hover:bg-yellow-700 text-white text-xs font-extrabold' :
                    'bg-red-600 hover:bg-red-700 text-white text-xs font-extrabold'
                  }>
                    {result.analysis_result.rekomendasi}
                  </Badge>
                  <Button 
                    variant="destructive" 
                    size="xs" 
                    onClick={handleDelete}
                    className="flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* 4 Core Dimensions */}
                <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                  <BarChart2 className="w-4 h-4 text-emerald-600" />
                  Aspek Psikogram Tes Koran
                </h4>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Kecepatan */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50/50 to-indigo-50/30 border border-blue-100/60 shadow-sm flex gap-3">
                    <div className="p-2.5 bg-blue-500/10 text-blue-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Zap className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm mb-1">Kecepatan Kerja (Speed)</h5>
                      <p className="text-xs text-slate-650 leading-relaxed font-semibold">{result.analysis_result.kecepatan}</p>
                    </div>
                  </div>

                  {/* Ketelitian */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50/50 to-teal-50/30 border border-emerald-100/60 shadow-sm flex gap-3">
                    <div className="p-2.5 bg-emerald-500/10 text-emerald-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm mb-1">Ketelitian Kerja (Accuracy)</h5>
                      <p className="text-xs text-slate-650 leading-relaxed font-semibold">{result.analysis_result.ketelitian}</p>
                    </div>
                  </div>

                  {/* Konsistensi */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-purple-50/50 to-pink-50/30 border border-purple-100/60 shadow-sm flex gap-3">
                    <div className="p-2.5 bg-purple-500/10 text-purple-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm mb-1">Konsistensi Kerja (Stability)</h5>
                      <p className="text-xs text-slate-650 leading-relaxed font-semibold">{result.analysis_result.konsistensi}</p>
                    </div>
                  </div>

                  {/* Ketahanan */}
                  <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50/50 to-orange-50/30 border border-amber-100/60 shadow-sm flex gap-3">
                    <div className="p-2.5 bg-amber-500/10 text-amber-600 rounded-xl shrink-0 h-10 w-10 flex items-center justify-center">
                      <Activity className="w-5 h-5" />
                    </div>
                    <div>
                      <h5 className="font-extrabold text-slate-900 text-sm mb-1">Ketahanan Kerja (Resilience)</h5>
                      <p className="text-xs text-slate-650 leading-relaxed font-semibold">{result.analysis_result.ketahanan}</p>
                    </div>
                  </div>
                </div>

                {/* Reasoning Description */}
                <div className="space-y-3 pt-2">
                  <h4 className="text-sm font-bold text-slate-950 uppercase tracking-wider border-b pb-2 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-600" />
                    Penalaran & Analisis AI (Psychological Reasoning)
                  </h4>
                  <div className="bg-slate-50 p-5 rounded-2xl border text-sm text-slate-700 leading-relaxed whitespace-pre-wrap font-medium">
                    {result.analysis_result.reasoning}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Image & Detail Column */}
          <div className="space-y-6">
            <Card className="border border-slate-200 shadow-xl overflow-hidden">
              <CardHeader className="bg-slate-50 border-b p-4">
                <CardTitle className="text-sm font-extrabold text-slate-700 flex items-center gap-1.5">
                  <FileText className="w-4 h-4" />
                  Lembar Tes Terunggah
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-center">
                <div className="relative inline-block max-w-full overflow-hidden rounded-lg shadow-inner bg-slate-100 p-2 border">
                  <img 
                    src={result.foto_url} 
                    alt="Koran Test Sheet" 
                    className="max-h-80 mx-auto rounded object-contain border"
                  />
                </div>
                <div className="mt-4">
                  <a 
                    href={result.foto_url} 
                    target="_blank" 
                    rel="noreferrer" 
                    className="inline-block"
                  >
                    <Button variant="outline" size="sm" className="w-full text-xs font-bold">
                      Buka Gambar Penuh &nearr;
                    </Button>
                  </a>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
