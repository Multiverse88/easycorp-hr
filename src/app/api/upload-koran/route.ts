import { NextRequest, NextResponse } from 'next/server';
import { saveKoranTestResult, getKoranTestResultByCandidate } from '@/lib/db';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';

export const dynamic = 'force-dynamic';

function parseAiJson(rawContent: string): any {
  let cleanJson = rawContent.trim();
  
  // Find first '{' and last '}'
  const start = cleanJson.indexOf('{');
  const end = cleanJson.lastIndexOf('}');
  
  if (start !== -1 && end !== -1 && end > start) {
    cleanJson = cleanJson.substring(start, end + 1);
  }

  // Helper to repair truncated JSON
  const autoRepairJson = (jsonStr: string): string => {
    let cleaned = jsonStr.trim();
    if (!cleaned) return '{}';

    let inString = false;
    let escaped = false;
    const stack: ('{' | '[')[] = [];
    
    for (let i = 0; i < cleaned.length; i++) {
      const char = cleaned[i];
      
      if (char === '"' && !escaped) {
        inString = !inString;
      } else if (char === '\\' && !escaped) {
        escaped = true;
        continue;
      } else if (!inString) {
        if (char === '{') {
          stack.push('{');
        } else if (char === '[') {
          stack.push('[');
        } else if (char === '}') {
          if (stack[stack.length - 1] === '{') {
            stack.pop();
          }
        } else if (char === ']') {
          if (stack[stack.length - 1] === '[') {
            stack.pop();
          }
        }
      }
      escaped = false;
    }

    let repaired = cleaned;
    if (inString) {
      repaired += '"';
    }
    
    // Remove trailing key definitions like `,"key":` or `,"key" :`
    repaired = repaired.replace(/,?\s*["a-zA-Z0-9_]*\s*:\s*$/, '');
    // Remove trailing commas
    repaired = repaired.replace(/,\s*$/, '');
    
    // Close the open structures
    for (let i = stack.length - 1; i >= 0; i--) {
      const openChar = stack[i];
      if (openChar === '{') {
        repaired += '}';
      } else if (openChar === '[') {
        repaired += ']';
      }
    }

    return repaired;
  };

  // Run auto-repair in case the output was truncated
  let repairedJson = autoRepairJson(cleanJson);
  
  // Remove trailing commas before closing brackets/braces
  repairedJson = repairedJson.replace(/,(\s*[\]}])/g, '$1');

  try {
    return JSON.parse(repairedJson);
  } catch (firstError) {
    console.warn('Initial JSON parse failed, trying to escape literal control characters inside string values...', firstError);
    
    try {
      // Escape literal unescaped control characters inside double-quoted string values.
      let inString = false;
      let escaped = false;
      let processed = '';
      for (let i = 0; i < repairedJson.length; i++) {
        const char = repairedJson[i];
        if (char === '"' && !escaped) {
          inString = !inString;
          processed += char;
        } else if (char === '\\' && !escaped) {
          escaped = true;
          processed += char;
        } else {
          if (inString) {
            if (char === '\n') {
              processed += '\\n';
            } else if (char === '\r') {
              processed += '\\r';
            } else if (char === '\t') {
              processed += '\\t';
            } else {
              processed += char;
            }
          } else {
            processed += char;
          }
          escaped = false;
        }
      }
      return JSON.parse(processed);
    } catch (secondError) {
      console.error('JSON parse error even after escaping control characters:', secondError);
      console.error('Raw JSON string content attempting to parse:', repairedJson);
      throw new Error(`AI tidak mengembalikan JSON yang valid: ${firstError instanceof Error ? firstError.message : String(firstError)}`);
    }
  }
}


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
            model: 'claude-3-5-sonnet-latest',
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

    let analysisResult;
    try {
      analysisResult = parseAiJson(content);
    } catch (e) {
      console.error('Failed to parse AI JSON:', content, e);
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

    const existingKoran = await getKoranTestResultByCandidate(candidateId);

    // Step 4: Save to database
    const savedResult = await saveKoranTestResult({
      id: existingKoran?.id,
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
