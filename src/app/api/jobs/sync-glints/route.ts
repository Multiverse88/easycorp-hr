import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

interface GlintsJobPayload {
  title: string;
  jobFunction: string | null;
  jobType: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
}

// Fetch ke Glints dijalankan di browser (client), bukan di server ini — server VPS
// diblokir WAF Glints (403) karena IP-nya terdeteksi sebagai datacenter/hosting.
// Browser HR admin memakai IP residensial/kantor biasa sehingga tidak diblokir.
// Endpoint ini hanya menerima hasil fetch dari client lalu meng-upsert ke tabel Job.
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const jobs: GlintsJobPayload[] = Array.isArray(body?.jobs) ? body.jobs : [];

    if (jobs.length === 0) {
      return NextResponse.json({ success: true, found: 0, created: 0, updated: 0 });
    }

    let created = 0;
    let updated = 0;

    for (const job of jobs) {
      if (!job.title || typeof job.title !== 'string') continue;

      const existing = await prisma.job.findFirst({ where: { title: job.title } });

      if (existing) {
        await prisma.job.update({
          where: { id: existing.id },
          data: {
            jobFunction: job.jobFunction ?? null,
            jobType: job.jobType ?? null,
            location: job.location ?? null,
            salaryMin: job.salaryMin ?? null,
            salaryMax: job.salaryMax ?? null,
            isActive: true,
          },
        });
        updated++;
      } else {
        await prisma.job.create({
          data: {
            title: job.title,
            jobFunction: job.jobFunction ?? null,
            jobType: job.jobType ?? null,
            location: job.location ?? null,
            salaryMin: job.salaryMin ?? null,
            salaryMax: job.salaryMax ?? null,
            isActive: true,
          },
        });
        created++;
      }
    }

    return NextResponse.json({ success: true, found: jobs.length, created, updated });
  } catch (error) {
    console.error('POST /api/jobs/sync-glints error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Gagal sinkronisasi dari Glints' },
      { status: 500 }
    );
  }
}
