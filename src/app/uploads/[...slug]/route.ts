import { NextRequest, NextResponse } from 'next/server';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string[] }> | { slug: string[] } }) {
  // Await params to support Next.js 15+ properly
  const resolvedParams = await params;
  const slugArray = resolvedParams.slug || [];
  const fileName = slugArray.join('/');

  if (!fileName) {
    return new NextResponse('File not found', { status: 404 });
  }

  // File is stored in /app/public/uploads in Docker
  const filePath = join(process.cwd(), 'public', 'uploads', fileName);

  try {
    if (!existsSync(filePath)) {
      return new NextResponse('File not found', { status: 404 });
    }

    const fileBuffer = readFileSync(filePath);

    // Determine content type
    let contentType = 'application/octet-stream';
    if (fileName.endsWith('.png')) contentType = 'image/png';
    else if (fileName.endsWith('.jpg') || fileName.endsWith('.jpeg')) contentType = 'image/jpeg';
    else if (fileName.endsWith('.pdf')) contentType = 'application/pdf';

    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400',
      },
    });
  } catch (error) {
    console.error('Error serving file:', error);
    return new NextResponse('Error serving file', { status: 500 });
  }
}
