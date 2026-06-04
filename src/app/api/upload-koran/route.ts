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

    // Step 3: Call OpenRouter API
    const apiKey = process.env.OPENROUTER_API_KEY?.trim();
    if (!apiKey) {
      return NextResponse.json({ error: 'OPENROUTER_API_KEY tidak dikonfigurasi di environment' }, { status: 500 });
    }

    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Anda adalah psikolog industri dan organisasi ahli. Analisis gambar hasil Tes Koran (Pauli/Kraepelin Test) berikut untuk kandidat ini.
Berikan penilaian mendalam mengenai:
1. Kecepatan Kerja (kuantitas hasil kerja, apakah di atas rata-rata/bagaimana grafiknya)
2. Ketelitian Kerja (kualitas hasil kerja, tingkat kesalahan/koreksi)
3. Konsistensi Kerja (kestabilan performa, tren grafik naik/turun/stabil)
4. Ketahanan Kerja (resiliensi terhadap tekanan/kelelahan, daya tahan stres)
5. Rekomendasi posisi dan keputusan akhir (Lulus / Dipertimbangkan / Tidak Lulus)

Kembalikan jawaban Anda dalam format JSON yang valid dengan struktur berikut:
{
  "kecepatan": "Penjelasan singkat (1-2 kalimat) aspek kecepatan kerja...",
  "ketelitian": "Penjelasan singkat (1-2 kalimat) aspek ketelitian...",
  "konsistensi": "Penjelasan singkat (1-2 kalimat) aspek konsistensi...",
  "ketahanan": "Penjelasan singkat (1-2 kalimat) aspek ketahanan kerja...",
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

    if (!openRouterResponse.ok) {
      const errorText = await openRouterResponse.text();
      throw new Error(`OpenRouter API returned error status: ${openRouterResponse.status} - ${errorText}`);
    }

    const aiResult = await openRouterResponse.json();
    const content = aiResult.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error('Respons AI kosong atau tidak valid.');
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

    // Step 4: Save to database
    const savedResult = await saveKoranTestResult({
      candidate_id: candidateId,
      nama_file: namaFile,
      foto_url: fotoUrl,
      analysis_result: {
        kecepatan: analysisResult.kecepatan || '-',
        ketelitian: analysisResult.ketelitian || '-',
        konsistensi: analysisResult.konsistensi || '-',
        ketahanan: analysisResult.ketahanan || '-',
        reasoning: analysisResult.reasoning || '-',
        rekomendasi: (analysisResult.rekomendasi === 'Lulus' || analysisResult.rekomendasi === 'Dipertimbangkan' || analysisResult.rekomendasi === 'Tidak Lulus') 
          ? analysisResult.rekomendasi 
          : 'Dipertimbangkan'
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
