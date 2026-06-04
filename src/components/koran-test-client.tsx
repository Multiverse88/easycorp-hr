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
  Trash2, AlertCircle, BarChart2, Activity, Zap,
  Shield, Target, ExternalLink, Calendar, User, Briefcase
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

  // Helper to parse legacy text representation or get quantitative fields
  const parseLegacyMetric = (str: string | undefined, defaultVal: number, defaultCat: string) => {
    if (!str) return { nilai: defaultVal, kategori: defaultCat };
    const parts = str.trim().split(/\s+/);
    if (parts.length >= 2) {
      const val = parseFloat(parts[0]);
      if (!isNaN(val)) {
        return { nilai: val, kategori: parts.slice(1).join(' ') };
      }
    }
    const val = parseFloat(parts[0]);
    if (isNaN(val)) {
      return { nilai: defaultVal, kategori: str };
    }
    return { nilai: val, kategori: defaultCat };
  };

  const getKoranMetrics = () => {
    if (!result) return null;
    const ar = result.analysis_result;
    
    const totalBenar = ar.total_benar !== undefined ? ar.total_benar : '-';
    const totalSalah = ar.total_salah !== undefined ? ar.total_salah : '-';
    
    const kecepatan = ar.kecepatan_nilai !== undefined
      ? { nilai: ar.kecepatan_nilai, kategori: ar.kecepatan_kategori ?? '' }
      : parseLegacyMetric(ar.kecepatan, 65.0, 'SEDANG');
      
    const akurasi = ar.akurasi_nilai !== undefined
      ? { nilai: ar.akurasi_nilai, kategori: ar.akurasi_kategori ?? '' }
      : parseLegacyMetric(ar.ketelitian, 45.0, 'RENDAH');
      
    const keajegan = ar.keajegan_nilai !== undefined
      ? { nilai: ar.keajegan_nilai, kategori: ar.keajegan_kategori ?? '' }
      : parseLegacyMetric(ar.konsistensi, 70.0, 'CUKUP TINGGI');
      
    const ketahanan = ar.ketahanan_nilai !== undefined
      ? { nilai: ar.ketahanan_nilai, kategori: ar.ketahanan_kategori ?? '' }
      : parseLegacyMetric(ar.ketahanan, 67.5, 'CUKUP TINGGI');
      
    const polaGrafik = ar.pola_grafik || '-';
    
    return { totalBenar, totalSalah, kecepatan, akurasi, keajegan, ketahanan, polaGrafik };
  };

  const getKategoriBadge = (kategori: string) => {
    const k = (kategori || '').toUpperCase();
    if (k.includes('SANGAT TINGGI') || (k.includes('TINGGI') && !k.includes('CUKUP'))) {
      return <Badge className="bg-green-100 hover:bg-green-100 text-green-800 border border-green-200 text-xs font-extrabold px-2 py-0.5">TINGGI</Badge>;
    } else if (k.includes('CUKUP') || k.includes('CUKUP TINGGI')) {
      return <Badge className="bg-emerald-50 hover:bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-extrabold px-2 py-0.5">CUKUP TINGGI</Badge>;
    } else if (k.includes('SEDANG')) {
      return <Badge className="bg-amber-50 hover:bg-amber-50 text-amber-750 border border-amber-200 text-xs font-extrabold px-2 py-0.5">SEDANG</Badge>;
    } else if (k.includes('RENDAH') || k.includes('SANGAT RENDAH')) {
      return <Badge className="bg-rose-50 hover:bg-rose-50 text-rose-800 border border-rose-200 text-xs font-extrabold px-2 py-0.5">RENDAH</Badge>;
    }
    return <Badge variant="outline" className="text-slate-650 text-xs font-bold px-2 py-0.5">{kategori || '-'}</Badge>;
  };

  const metrics = getKoranMetrics();

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
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
          {/* Main Results Column */}
          <div className="lg:col-span-2 space-y-6">
            <Card className="border border-slate-200 shadow-lg hover:shadow-xl transition-all duration-300 overflow-hidden bg-white rounded-2xl">
              <CardHeader className="bg-slate-50/80 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-emerald-600" />
                    <CardTitle className="text-xl font-extrabold tracking-tight text-slate-800">{result.nama_file}</CardTitle>
                  </div>
                  <p className="text-xs text-slate-400 font-bold">ID Analisis: {result.id}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge className={`px-3 py-1 text-xs font-extrabold shadow-sm rounded-full border ${
                    result.analysis_result.rekomendasi === 'Lulus' ? 'bg-green-50 text-green-700 border-green-200' :
                    result.analysis_result.rekomendasi === 'Dipertimbangkan' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    'bg-rose-50 text-rose-700 border-rose-200'
                  }`}>
                    {result.analysis_result.rekomendasi}
                  </Badge>
                  <Button 
                    variant="outline" 
                    size="xs" 
                    onClick={handleDelete}
                    className="flex items-center gap-1.5 px-3 py-1 text-xs font-extrabold text-rose-600 border-rose-200 hover:bg-rose-50 hover:text-rose-700 transition-all duration-150 shadow-sm"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Hapus
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent className="p-6 space-y-8">
                
                {/* Aspek Kuantitatif */}
                <div className="space-y-4">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
                    <BarChart2 className="w-4 h-4 text-emerald-600" />
                    Hasil Kuantitatif & Kurva Kerja (Kraepelin/Pauli)
                  </h4>

                  {metrics && (
                    <div className="space-y-5">
                      {/* Responsive Table of 6 Indicators */}
                      <div className="overflow-x-auto border border-slate-200/60 rounded-xl shadow-md bg-white overflow-hidden">
                        <table className="min-w-full divide-y divide-slate-200">
                          <thead className="bg-slate-50/80">
                            <tr>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">INDIKATOR UTAMA</th>
                              <th scope="col" className="px-6 py-3 text-center text-xs font-bold text-slate-500 uppercase tracking-wider">NILAI / SKOR</th>
                              <th scope="col" className="px-6 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">KATEGORI PENILAIAN</th>
                            </tr>
                          </thead>
                          <tbody className="bg-white divide-y divide-slate-100 text-sm">
                            <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-emerald-50 text-emerald-600 rounded">
                                  <CheckCircle2 className="w-3.5 h-3.5" />
                                </span>
                                Total Jawaban Benar
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-center font-extrabold text-slate-700 text-base">
                                {typeof metrics.totalBenar === 'number' ? metrics.totalBenar.toLocaleString('id-ID') : metrics.totalBenar}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-slate-400 font-semibold">—</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-rose-50 text-rose-600 rounded">
                                  <AlertCircle className="w-3.5 h-3.5" />
                                </span>
                                Total Kesalahan
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-center font-extrabold text-slate-700 text-base">
                                {typeof metrics.totalSalah === 'number' ? metrics.totalSalah.toLocaleString('id-ID') : metrics.totalSalah}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-slate-400 font-semibold">—</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-amber-50 text-amber-600 rounded">
                                  <Zap className="w-3.5 h-3.5" />
                                </span>
                                Kecepatan Kerja (Speed)
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-center font-extrabold text-slate-750 text-base">
                                {metrics.kecepatan.nilai !== 0 ? metrics.kecepatan.nilai.toFixed(1) : '-'}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap">{getKategoriBadge(metrics.kecepatan.kategori)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-blue-50 text-blue-600 rounded">
                                  <Target className="w-3.5 h-3.5" />
                                </span>
                                Akurasi Kerja (Accuracy)
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-center font-extrabold text-slate-750 text-base">
                                {metrics.akurasi.nilai !== 0 ? metrics.akurasi.nilai.toFixed(1) : '-'}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap">{getKategoriBadge(metrics.akurasi.kategori)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-indigo-50 text-indigo-600 rounded">
                                  <Activity className="w-3.5 h-3.5" />
                                </span>
                                Keajegan / Stabilitas (Stability)
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-center font-extrabold text-slate-750 text-base">
                                {metrics.keajegan.nilai !== 0 ? metrics.keajegan.nilai.toFixed(1) : '-'}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap">{getKategoriBadge(metrics.keajegan.kategori)}</td>
                            </tr>
                            <tr className="hover:bg-slate-50/50 transition-colors duration-150">
                              <td className="px-6 py-3.5 whitespace-nowrap font-bold text-slate-800 flex items-center gap-2">
                                <span className="p-1 bg-purple-50 text-purple-600 rounded">
                                  <Shield className="w-3.5 h-3.5" />
                                </span>
                                Ketahanan Kerja (Endurance)
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap text-center font-extrabold text-slate-750 text-base">
                                {metrics.ketahanan.nilai !== 0 ? metrics.ketahanan.nilai.toFixed(1) : '-'}
                              </td>
                              <td className="px-6 py-3.5 whitespace-nowrap">{getKategoriBadge(metrics.ketahanan.kategori)}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>

                      {/* Pola Grafik Section */}
                      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-50 to-slate-100/30 border-l-4 border-l-emerald-600 border border-y-slate-200/80 border-r-slate-200/80 shadow-sm">
                        <div className="flex items-center gap-2 mb-2.5">
                          <Activity className="w-4 h-4 text-emerald-600" />
                          <h5 className="font-extrabold text-slate-900 text-sm tracking-wide">Pola Grafik Kerja</h5>
                        </div>
                        <p className="text-xs text-slate-700 font-semibold leading-relaxed">
                          {metrics.polaGrafik}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Reasoning Description */}
                <div className="space-y-4 pt-4 border-t border-slate-100">
                  <h4 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider pb-1 flex items-center gap-2">
                    <Brain className="w-4 h-4 text-emerald-600" />
                    Penalaran & Analisis AI (Psychological Reasoning)
                  </h4>
                  <div className="bg-gradient-to-br from-emerald-50/15 via-white to-slate-50/50 p-6 rounded-2xl border border-slate-200/80 text-slate-700 text-sm leading-relaxed whitespace-pre-wrap font-medium shadow-inner">
                    {result.analysis_result.reasoning}
                  </div>
                </div>

              </CardContent>
            </Card>
          </div>

          {/* Image & Detail Column */}
          <div className="space-y-6">
            {/* Candidate Info Summary Card */}
            <Card className="border border-slate-200/80 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden bg-white rounded-2xl">
              <CardHeader className="bg-slate-50 border-b border-slate-100 p-4">
                <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <User className="w-4 h-4 text-emerald-600" />
                  Informasi Asesmen
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3.5">
                <div className="flex items-center justify-between text-xs border-b pb-2.5 border-slate-100">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5" /> Nama
                  </span>
                  <span className="font-extrabold text-slate-800">{candidate.nama}</span>
                </div>
                <div className="flex items-center justify-between text-xs border-b pb-2.5 border-slate-100">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5" /> Posisi Dilamar
                  </span>
                  <span className="font-extrabold text-slate-800">{candidate.posisi_dilamar}</span>
                </div>
                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-400 font-bold flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5" /> Tanggal Analisis
                  </span>
                  <span className="font-extrabold text-slate-800">
                    {result.created_at ? new Date(result.created_at).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    }) : new Date().toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric'
                    })}
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Uploaded Test Image Card */}
            <Card className="border border-slate-200 shadow-md hover:shadow-lg transition-all duration-300 overflow-hidden bg-white rounded-2xl">
              <CardHeader className="bg-slate-50 border-b p-4">
                <CardTitle className="text-xs font-extrabold text-slate-700 uppercase tracking-wider flex items-center gap-2">
                  <FileText className="w-4 h-4 text-slate-500" />
                  Lembar Tes Terunggah
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 text-center space-y-4">
                <div className="relative inline-block max-w-full overflow-hidden rounded-xl shadow-inner bg-slate-50 p-2 border border-slate-200">
                  <img 
                    src={result.foto_url} 
                    alt="Koran Test Sheet" 
                    className="max-h-80 mx-auto rounded-lg object-contain border border-slate-250/60 shadow-sm"
                  />
                </div>
                <a 
                  href={result.foto_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="block w-full"
                >
                  <Button variant="outline" size="sm" className="w-full text-xs font-bold flex items-center justify-center gap-2 border-slate-300 hover:bg-slate-50 shadow-sm py-2">
                    <ExternalLink className="w-3.5 h-3.5 text-slate-500" />
                    Buka Gambar Penuh
                  </Button>
                </a>
              </CardContent>
            </Card>
          </div>
        </div>
      )}
    </div>
  );
}
