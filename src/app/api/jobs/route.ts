import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET() {
  try {
    const jobs = await prisma.job.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return NextResponse.json(jobs);
  } catch (error) {
    console.error('GET /api/jobs error:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pekerjaan' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, jobFunction, jobType, location, salaryMin, salaryMax } = body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return NextResponse.json({ error: 'Nama pekerjaan wajib diisi' }, { status: 400 });
    }

    const job = await prisma.job.create({
      data: {
        title: title.trim(),
        jobFunction: jobFunction?.trim() || null,
        jobType: jobType?.trim() || null,
        location: location?.trim() || null,
        salaryMin: salaryMin ? Number(salaryMin) : null,
        salaryMax: salaryMax ? Number(salaryMax) : null,
      },
    });

    return NextResponse.json(job, { status: 201 });
  } catch (error) {
    console.error('POST /api/jobs error:', error);
    return NextResponse.json({ error: 'Gagal menambah pekerjaan' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, title, jobFunction, jobType, location, salaryMin, salaryMax, isActive } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID pekerjaan diperlukan' }, { status: 400 });
    }

    const job = await prisma.job.update({
      where: { id },
      data: {
        ...(title !== undefined && { title: title.trim() }),
        ...(jobFunction !== undefined && { jobFunction: jobFunction?.trim() || null }),
        ...(jobType !== undefined && { jobType: jobType?.trim() || null }),
        ...(location !== undefined && { location: location?.trim() || null }),
        ...(salaryMin !== undefined && { salaryMin: salaryMin ? Number(salaryMin) : null }),
        ...(salaryMax !== undefined && { salaryMax: salaryMax ? Number(salaryMax) : null }),
        ...(isActive !== undefined && { isActive: Boolean(isActive) }),
      },
    });

    return NextResponse.json(job);
  } catch (error) {
    console.error('PUT /api/jobs error:', error);
    return NextResponse.json({ error: 'Gagal mengupdate pekerjaan' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID pekerjaan diperlukan' }, { status: 400 });
    }

    await prisma.job.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('DELETE /api/jobs error:', error);
    return NextResponse.json({ error: 'Gagal menghapus pekerjaan' }, { status: 500 });
  }
}
