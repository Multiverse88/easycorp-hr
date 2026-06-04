import { NextRequest, NextResponse } from 'next/server';
import { saveKoranTestResult } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const candidateId = formData.get('candidateId') as string;
    const namaFile = formData.get('namaFile') as string;
    const file = formData.get('file') as File;

    if (!candidateId || !namaFile || !file) {
      return NextResponse.json({ error: 'candidateId, namaFile, dan file wajib diisi' }, { status: 400 });
    }

    // Step 1: Save the file to public/uploads
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = join(process.cwd(), 'public', 'uploads');
    if (!existsSync(uploadDir)) {
      await mkdir(uploadDir, { recursive: true });
    }

    const uniqueName = `${candidateId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
    const filePath = join(uploadDir, uniqueName);
    await writeFile(filePath, buffer);

    const fotoUrl = `/uploads/${uniqueName}`;

    // Step 2: Prepare base64 representation of the image for AI request
    const base64Image = buffer.toString('base64');
    const mimeType = file.type || 'image/jpeg';

    // Step 3: Call Anthropic Messages API with Image block
    let content: string | undefined;
    const apiKey = process.env.ANTHROPIC_API_KEY?.trim();

    if (apiKey) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            temperature: 0.3,
            messages: [
              {
                role: 'user',
                content: [
                  {
                    type: 'image',
                    source: {
                      type: 'base64',
                      media_type: mimeType,
                      data: base64Image
                    }
                  },
                  {
                    type: 'text',
                    text: `Anda adalah psikolog industri dan organisasi ahli. Analisis gambar hasil Tes Koran (Pauli/Kraepelin Test) berikut untuk kandidat ini.
Gambar ini menunjukkan lembar tes koran (angka-angka penjumlahan kolom). AI harus mengamati pola pengerjaan, tingkat pengisian baris/kolom, coretan, fluktuasi grafik kerja yang digambar, atau menyimpulkannya secara logis dari kerapihan dan konsistensi jawaban.

Estimasikan dan hitung indikator-indikator kuantitatif berikut secara profesional:
1. Total Jawaban Benar (total_benar): estimasi jumlah penjumlahan yang berhasil diselesaikan secara keseluruhan (misal: antara 800 - 2000).
2. Total Kesalahan (total_salah): jumlah penjumlahan yang salah atau dikoreksi.
3. Kecepatan (Speed): kecepatan kerja rata-rata per segmen. Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
4. Akurasi (Accuracy): rasio ketelitian kerja (kebalikan dari tingkat kesalahan). Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
5. Keajegan (Stability): konsistensi ritme kerja tanpa fluktuasi ekstrim. Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
6. Ketahanan (Endurance): resiliensi terhadap kelelahan sepanjang sesi tes koran. Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
7. Pola Grafik (pola_grafik): deskripsi pola grafik kerja (misal: "Sangat fluktuatif sepanjang X segmen — rentang nilai Y–Z per segmen. Grafik kesalahan juga fluktuatif (A–B), menunjukkan...")

Kembalikan jawaban Anda dalam format JSON yang valid dengan struktur berikut:
{
  "total_benar": 1564,
  "total_salah": 34,
  "kecepatan": {
    "nilai": 65.0,
    "kategori": "SEDANG"
  },
  "akurasi": {
    "nilai": 45.0,
    "kategori": "RENDAH"
  },
  "keajegan": {
    "nilai": 70.0,
    "kategori": "CUKUP TINGGI"
  },
  "ketahanan": {
    "nilai": 67.5,
    "kategori": "CUKUP TINGGI"
  },
  "pola_grafik": "Deskripsi singkat pola grafik kerja...",
  "reasoning": "Analisis psikologis menyeluruh yang mendalam, detail, dan deskriptif mengenai performa kandidat pada tes koran...",
  "rekomendasi": "Lulus | Dipertimbangkan | Tidak Lulus"
}
Pastikan hanya mengembalikan JSON yang valid tanpa markdown code fences \`\`\`json atau teks lainnya. Jangan menambahkan teks pembuka/penutup, langsung kembalikan raw JSON saja.`
                  }
                ]
              }
            ]
          })
        });

        if (response.ok) {
          const aiResult = await response.json();
          content = aiResult.content?.[0]?.text;
        } else {
          const errText = await response.text();
          console.warn('Anthropic API returned error, trying OpenAI fallback:', errText);
        }
      } catch (err) {
        console.error('Anthropic API call failed, trying OpenAI fallback:', err);
      }
    }

    // Fallback to OpenAI if Anthropic didn't succeed
    if (!content) {
      console.log('Using OpenAI fallback for Koran upload...');
      const openAiKey = process.env.OPENAI_API_KEY?.trim();
      if (!openAiKey) {
        return NextResponse.json({ error: 'Tidak ada API Key yang valid (Anthropic & OpenAI tidak aktif)' }, { status: 500 });
      }

      const openAiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openAiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'text',
                  text: `Anda adalah psikolog industri dan organisasi ahli. Analisis gambar hasil Tes Koran (Pauli/Kraepelin Test) berikut untuk kandidat ini.
Gambar ini menunjukkan lembar tes koran (angka-angka penjumlahan kolom). AI harus mengamati pola pengerjaan, tingkat pengisian baris/kolom, coretan, fluktuasi grafik kerja yang digambar, atau menyimpulkannya secara logis dari kerapihan dan konsistensi jawaban.

Estimasikan dan hitung indikator-indikator kuantitatif berikut secara profesional:
1. Total Jawaban Benar (total_benar): estimasi jumlah penjumlahan yang berhasil diselesaikan secara keseluruhan (misal: antara 800 - 2000).
2. Total Kesalahan (total_salah): jumlah penjumlahan yang salah atau dikoreksi.
3. Kecepatan (Speed): kecepatan kerja rata-rata per segmen. Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
4. Akurasi (Accuracy): rasio ketelitian kerja (kebalikan dari tingkat kesalahan). Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
5. Keajegan (Stability): konsistensi ritme kerja tanpa fluktuasi ekstrim. Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
6. Ketahanan (Endurance): resiliensi terhadap kelelahan sepanjang sesi tes koran. Kembalikan nilai (angka 0-100) dan kategori (RENDAH / SEDANG / CUKUP TINGGI / TINGGI / SANGAT TINGGI).
7. Pola Grafik (pola_grafik): deskripsi pola grafik kerja (misal: "Sangat fluktuatif sepanjang X segmen — rentang nilai Y–Z per segmen. Grafik kesalahan juga fluktuatif (A–B), menunjukkan...")

Kembalikan jawaban Anda dalam format JSON yang valid dengan struktur berikut:
{
  "total_benar": 1564,
  "total_salah": 34,
  "kecepatan": {
    "nilai": 65.0,
    "kategori": "SEDANG"
  },
  "akurasi": {
    "nilai": 45.0,
    "kategori": "RENDAH"
  },
  "keajegan": {
    "nilai": 70.0,
    "kategori": "CUKUP TINGGI"
  },
  "ketahanan": {
    "nilai": 67.5,
    "kategori": "CUKUP TINGGI"
  },
  "pola_grafik": "Deskripsi singkat pola grafik kerja...",
  "reasoning": "Analisis psikologis menyeluruh yang mendalam, detail, dan deskriptif mengenai performa kandidat pada tes koran...",
  "rekomendasi": "Lulus | Dipertimbangkan | Tidak Lulus"
}
Pastikan hanya mengembalikan JSON yang valid tanpa markdown code fences \`\`\`json atau teks lainnya. Jangan menambahkan teks pembuka/penutup, langsung kembalikan raw JSON saja.`
                },
                {
                  type: 'image_url',
                  image_url: {
                    url: `data:${mimeType};base64,${base64Image}`
                  }
                }
              ]
            }
          ],
          response_format: { type: 'json_object' }
        })
      });

      if (!openAiResponse.ok) {
        const errorText = await openAiResponse.text();
        throw new Error(`OpenAI API fallback error status: ${openAiResponse.status} - ${errorText}`);
      }

      const openAiResult = await openAiResponse.json();
      content = openAiResult.choices?.[0]?.message?.content;
    }

    if (!content) {
      throw new Error('Respons AI kosong atau tidak valid (gagal pada Anthropic dan OpenAI).');
    }

    // Clean any potential json formatting markdown around content
    let cleanJson = content.trim();
    if (cleanJson.startsWith('```json')) {
      cleanJson = cleanJson.substring(7);
    }
    if (cleanJson.startsWith('```')) {
      cleanJson = cleanJson.substring(3);
    }
    if (cleanJson.endsWith('```')) {
      cleanJson = cleanJson.substring(0, cleanJson.length - 3);
    }
    cleanJson = cleanJson.trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanJson);
    } catch (e) {
      console.error('Failed to parse AI JSON:', cleanJson, e);
      throw new Error('AI tidak mengembalikan JSON yang valid.');
    }

    // Ensure we parse fields correctly and provide fallback compatibility
    const total_benar = Number(analysisResult.total_benar ?? 0);
    const total_salah = Number(analysisResult.total_salah ?? 0);

    const kecepatanNilai = analysisResult.kecepatan?.nilai ?? 65.0;
    const kecepatanKategori = analysisResult.kecepatan?.kategori ?? 'SEDANG';
    const kecepatanText = typeof analysisResult.kecepatan === 'string' 
      ? analysisResult.kecepatan 
      : `${kecepatanNilai} ${kecepatanKategori}`;

    const akurasiNilai = analysisResult.akurasi?.nilai ?? 45.0;
    const akurasiKategori = analysisResult.akurasi?.kategori ?? 'RENDAH';
    const ketelitianText = typeof analysisResult.ketelitian === 'string' 
      ? analysisResult.ketelitian 
      : `${akurasiNilai} ${akurasiKategori}`;

    const keajeganNilai = analysisResult.keajegan?.nilai ?? 70.0;
    const keajeganKategori = analysisResult.keajegan?.kategori ?? 'CUKUP TINGGI';
    const konsistensiText = typeof analysisResult.konsistensi === 'string' 
      ? analysisResult.konsistensi 
      : `${keajeganNilai} ${keajeganKategori}`;

    const ketahananNilai = analysisResult.ketahanan?.nilai ?? 67.5;
    const ketahananKategori = analysisResult.ketahanan?.kategori ?? 'CUKUP TINGGI';
    const ketahananText = typeof analysisResult.ketahanan === 'string' 
      ? analysisResult.ketahanan 
      : `${ketahananNilai} ${ketahananKategori}`;

    // Step 4: Save to database
    const savedResult = await saveKoranTestResult({
      candidate_id: candidateId,
      nama_file: namaFile,
      foto_url: fotoUrl,
      analysis_result: {
        kecepatan: kecepatanText,
        ketelitian: ketelitianText,
        konsistensi: konsistensiText,
        ketahanan: ketahananText,
        reasoning: analysisResult.reasoning || '-',
        rekomendasi: (analysisResult.rekomendasi === 'Lulus' || analysisResult.rekomendasi === 'Dipertimbangkan' || analysisResult.rekomendasi === 'Tidak Lulus') 
          ? analysisResult.rekomendasi 
          : 'Dipertimbangkan',
        total_benar,
        total_salah,
        kecepatan_nilai: kecepatanNilai,
        kecepatan_kategori: kecepatanKategori,
        akurasi_nilai: akurasiNilai,
        akurasi_kategori: akurasiKategori,
        keajegan_nilai: keajeganNilai,
        keajegan_kategori: keajeganKategori,
        ketahanan_nilai: ketahananNilai,
        ketahanan_kategori: ketahananKategori,
        pola_grafik: analysisResult.pola_grafik || '-'
      }
    });

    return NextResponse.json(savedResult);
  } catch (error) {
    console.error('Upload Koran error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'id required' }, { status: 400 });
    }

    const { deleteKoranTestResult } = await import('@/lib/db');
    await deleteKoranTestResult(id);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete Koran error:', error);
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Gagal hapus data' }, { status: 550 });
  }
}
