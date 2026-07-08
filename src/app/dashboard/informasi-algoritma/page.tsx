'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Users, 
  BrainCircuit, 
  ClipboardList, 
  Scale, 
  Target,
  FileCheck2,
  BarChart4,
  Code
} from 'lucide-react';

export default function InformasiAlgoritmaPage() {
  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-800 tracking-tight flex items-center gap-3">
          <Scale className="w-8 h-8 text-indigo-600" />
          Metodologi Penilaian Kandidat
        </h1>
        <p className="text-slate-500 mt-2">
          Panduan tentang bagaimana sistem mengkalkulasi skor, mengukur potensi, dan merumuskan kesimpulan akhir (Resume Evaluasi) secara otomatis dan objektif berdasar data rekrutmen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-indigo-100 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-600 flex items-center justify-center mb-4">
              <BarChart4 className="w-6 h-6" />
            </div>
            <CardTitle>Sistem Pembobotan (Scoring)</CardTitle>
            <CardDescription>Bagaimana skor akhir (Overall Score) dihitung</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Skor akhir kandidat (Kesesuaian Overall) merupakan nilai rata-rata yang diambil dari empat parameter asesmen wajib. Setiap tes dikonversi ke dalam skala persentase 1-100% agar dapat digabungkan secara adil.
            </p>
            <ul className="text-sm text-slate-600 space-y-2 list-disc list-inside bg-slate-50 p-4 rounded-xl border border-slate-100">
              <li><strong>Kesesuaian Kepribadian (DISC):</strong> Dinilai dari seberapa relevan tipe karakter kandidat terhadap posisi yang dilamar.</li>
              <li><strong>Skor Kognitif (WPT):</strong> Skor asli maksimal 50 akan dikonversi menjadi skala 100%.</li>
              <li><strong>Ketahanan Kerja (Koran):</strong> Merupakan nilai tengah dari kombinasi Kecepatan dan Ketelitian kerja.</li>
              <li><strong>Evaluasi Wawancara:</strong> Mengambil angka absolut dari total penilaian wawancara oleh tim rekrutmen (skala 100).</li>
            </ul>
          </CardContent>
        </Card>

        <Card className="border-emerald-100 shadow-sm relative overflow-hidden group">
          <div className="absolute inset-0 bg-gradient-to-br from-emerald-50/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <CardHeader>
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center mb-4">
              <Target className="w-6 h-6" />
            </div>
            <CardTitle>Kategori Rekomendasi Akhir</CardTitle>
            <CardDescription>Standar kelulusan berdasarkan nilai</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-slate-600 leading-relaxed">
              Berdasarkan nilai <strong>Kesesuaian Overall</strong> yang diperoleh dari tahap sebelumnya, sistem akan menyematkan label rekomendasi final untuk membantu HR dalam pengambilan keputusan:
            </p>
            <div className="space-y-3 mt-2">
              <div className="flex items-center justify-between p-2 rounded-lg bg-emerald-50 border border-emerald-100">
                <span className="text-sm font-semibold text-emerald-800">Sangat Direkomendasikan</span>
                <Badge className="bg-emerald-600">Score ≥ 85%</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-blue-50 border border-blue-100">
                <span className="text-sm font-semibold text-blue-800">Direkomendasikan</span>
                <Badge className="bg-blue-600">Score 75% - 84%</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 border border-yellow-100">
                <span className="text-sm font-semibold text-yellow-800">Dipertimbangkan</span>
                <Badge className="bg-yellow-600 text-white">Score 60% - 74%</Badge>
              </div>
              <div className="flex items-center justify-between p-2 rounded-lg bg-rose-50 border border-rose-100">
                <span className="text-sm font-semibold text-rose-800">Tidak Direkomendasikan</span>
                <Badge className="bg-rose-600">Score &lt; 60%</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-indigo-500" />
        Deskripsi Parameter Analisis
      </h2>
      
      <div className="grid grid-cols-1 gap-4">
        {/* DISC */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="w-16 h-16 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center shrink-0">
            <Users className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">1. Profil Karakter Kerja (DISC)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sistem menyimpulkan narasi profil kepribadian dengan melihat kombinasi dua tipe tertinggi kandidat (Tipe Primer dan Sekunder). Hal ini membantu HR membaca gaya komunikasi kandidat:
            </p>
            <ul className="text-sm text-slate-600 space-y-1.5 list-disc list-inside">
              <li><strong>Tipe D (Dominance):</strong> Fokus pada target dan hasil kerja. Memiliki potensi untuk posisi <em>leadership</em>.</li>
              <li><strong>Tipe I (Influence):</strong> Sangat baik dalam komunikasi persuasif, cocok untuk posisi <em>Sales</em> atau <em>Public Relations</em>.</li>
              <li><strong>Tipe S (Steadiness):</strong> Stabil, loyal, dan pekerja tim yang luar biasa (cocok untuk <em>Customer Service</em> atau operasional).</li>
              <li><strong>Tipe C (Compliance):</strong> Berstandar tinggi, taat aturan, dan presisi (cocok untuk <em>Finance</em> atau posisi klerikal/analis).</li>
            </ul>
          </div>
        </div>

        {/* WPT & Koran */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <BrainCircuit className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">2. Intelektual (WPT) & Daya Tahan (Koran)</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Untuk aspek kognitif, sistem menyusun deskripsi kemampuan belajar kandidat berdasarkan kategorisasi baku WPT (Tinggi, Cukup, Kurang). Nilai ini menunjukan seberapa cepat kandidat dapat menguasai tugas baru saat <em>Onboarding</em>.
            </p>
            <p className="text-sm text-slate-600 leading-relaxed">
              Sedangkan untuk ketahanan kerja (Tes Koran Pauli/Kraepelin), sistem secara otomatis mengekstrak tingkat <strong>Kecepatan</strong> (Volume pekerjaan yang diselesaikan) dan <strong>Ketelitian</strong> (minimnya kesalahan). Ini menjadi prediktor performa untuk pekerjaan yang bersifat rutin dan berada di bawah tekanan batas waktu.
            </p>
          </div>
        </div>

        {/* Analisis Integrasi */}
        <div className="bg-white border rounded-2xl p-6 shadow-sm flex flex-col md:flex-row gap-6">
          <div className="w-16 h-16 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center shrink-0">
            <FileCheck2 className="w-8 h-8" />
          </div>
          <div className="flex-1 space-y-3">
            <h3 className="text-lg font-bold text-slate-800">3. Kesimpulan Wawancara & Identifikasi Risiko</h3>
            <p className="text-sm text-slate-600 leading-relaxed">
              Nilai subjektif dari penilai <em>(interviewer)</em> digabungkan ke dalam perhitungan sistem. Jika nilai keseluruhan atau indikator tertentu dirasa terlalu rendah (&lt; 70%), sistem akan secara proaktif merumuskan <strong>Potensi Risiko</strong> yang mungkin dihadapi kandidat, serta menyarankan <strong>Rekomendasi Onboarding</strong> yang tepat (misalnya: butuh <em>shadowing</em> yang intens).
            </p>
          </div>
        </div>
      </div>

      <h2 className="text-xl font-bold text-slate-800 mt-10 mb-4 flex items-center gap-2">
        <ClipboardList className="w-5 h-5 text-indigo-500" />
        Sumber & Validitas Deskripsi Teks
      </h2>
      <Card className="border-indigo-100 shadow-sm bg-indigo-50/30">
        <CardContent className="pt-6 space-y-4 text-sm text-slate-700 leading-relaxed">
          <p>
            Semua narasi panjang (deskripsi kepribadian, gaya kerja, dan rekomendasi) yang tercetak pada Resume Evaluasi <strong>bukanlah hasil karangan bebas</strong>, melainkan bersumber dari <strong>Bank Data Rubrik Psikologi Standar</strong> yang telah ditanamkan ke dalam sistem. Bank data ini mencakup:
          </p>
          <ul className="list-disc list-inside space-y-2 ml-2">
            <li><strong>Teori Perilaku DISC (William Moulton Marston):</strong> Memetakan dinamika emosi dan perilaku kerja ke dalam kuadran Dominance, Influence, Steadiness, dan Compliance sebagai acuan utama deskripsi karakter.</li>
            <li><strong>Konsep Kognitif WPT (Wonderlic Personnel Test):</strong> Diadopsi untuk menerjemahkan skor kecerdasan logika-matematis ke dalam deskripsi kemampuan penyerapan instruksi dan pemecahan masalah.</li>
            <li><strong>Analisis Kurva Konsentrasi (Kraepelin/Pauli):</strong> Rumus interpretasi untuk melihat grafik fluktuasi kinerja, guna mendeskripsikan daya tahan, stabilitas, dan toleransi kandidat terhadap tekanan berulang.</li>
            <li><strong>Matriks Wawancara Perilaku Terstruktur (Targeted Selection):</strong> Menyediakan templat umpan balik (feedback) baku terkait kompetensi interpersonal dan integritas, yang menjamin bahasa evaluasi tetap objektif dan netral.</li>
          </ul>
          <p className="mt-4 pt-4 border-t border-indigo-100 text-slate-500">
            Sistem berfungsi sebagai <strong>mesin perakit otomatis</strong> yang mengaitkan angka hasil tes kandidat dengan potongan interpretasi psikologis baku tersebut. Dengan pendekatan ini, setiap Resume Evaluasi yang dihasilkan dijamin valid, seragam secara kebahasaan, dan bebas dari bias subjektivitas.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
