'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Briefcase,
  Loader2,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
} from 'lucide-react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

type Job = {
  id: string;
  title: string;
  jobFunction: string | null;
  jobType: string | null;
  location: string | null;
  salaryMin: number | null;
  salaryMax: number | null;
  isActive: boolean;
  createdAt: string;
};

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [title, setTitle] = useState('');
  const [jobFunction, setJobFunction] = useState('');
  const [jobType, setJobType] = useState('');
  const [location, setLocation] = useState('');
  const [salaryMin, setSalaryMin] = useState('');
  const [salaryMax, setSalaryMax] = useState('');

  async function fetchJobs() {
    try {
      const res = await fetch('/api/jobs');
      const data = await res.json();
      setJobs(data);
    } catch {
      console.error('Failed to fetch jobs');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchJobs();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);

    try {
      const res = await fetch('/api/jobs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          jobFunction,
          jobType,
          location,
          salaryMin: salaryMin ? Number(salaryMin) : null,
          salaryMax: salaryMax ? Number(salaryMax) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Gagal menambah pekerjaan');
        return;
      }

      setTitle('');
      setJobFunction('');
      setJobType('');
      setLocation('');
      setSalaryMin('');
      setSalaryMax('');
      await fetchJobs();
    } catch {
      setError('Gagal menambah pekerjaan');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Yakin ingin menghapus pekerjaan ini?')) return;

    try {
      await fetch(`/api/jobs?id=${id}`, { method: 'DELETE' });
      await fetchJobs();
    } catch {
      console.error('Failed to delete job');
    }
  }

  async function handleToggleActive(id: string, current: boolean) {
    try {
      await fetch('/api/jobs', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, isActive: !current }),
      });
      await fetchJobs();
    } catch {
      console.error('Failed to toggle job');
    }
  }

  function formatSalary(val: number) {
    return `Rp ${(val / 1000).toFixed(0)}rb`;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] py-6">
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="space-y-3">
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" />
              Kembali ke dashboard
            </Link>
            <div>
              <p className="text-xs font-black uppercase tracking-[0.28em] text-primary">
                Pengaturan
              </p>
              <h1 className="mt-2 text-3xl font-black tracking-tight text-foreground md:text-5xl">
                Kelola Posisi
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground">
                Tambah, edit, atau hapus posisi pekerjaan yang tersedia di dropdown pendaftaran kandidat.
              </p>
            </div>
          </div>
          <div className="inline-flex w-fit items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3 text-sm font-semibold text-foreground shadow-sm">
            <Briefcase className="h-4 w-4 text-primary" />
            {jobs.filter(j => j.isActive).length} posisi aktif
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
          {/* Form tambah posisi */}
          <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-rose-950/5 h-fit">
            <div className="border-b border-border bg-muted/30 px-6 py-5">
              <h2 className="text-lg font-black tracking-tight text-foreground">
                Tambah Posisi Baru
              </h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Isi data posisi yang ingin ditambahkan.
              </p>
            </div>
            <CardContent className="p-6">
              <form onSubmit={handleAdd} className="space-y-4">
                {error && (
                  <div className="rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm font-semibold text-destructive">
                    {error}
                  </div>
                )}

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Nama Posisi <span className="text-primary">*</span>
                  </Label>
                  <Input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Contoh: Content Creator"
                    required
                    className="h-11 rounded-xl border-border bg-muted/30 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Fungsi
                    </Label>
                    <Input
                      value={jobFunction}
                      onChange={(e) => setJobFunction(e.target.value)}
                      placeholder="Contoh: Marketing"
                      className="h-11 rounded-xl border-border bg-muted/30 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Tipe
                    </Label>
                    <Input
                      value={jobType}
                      onChange={(e) => setJobType(e.target.value)}
                      placeholder="Contoh: Full-time"
                      className="h-11 rounded-xl border-border bg-muted/30 font-semibold"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                    Lokasi
                  </Label>
                  <Input
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Contoh: Coblong"
                    className="h-11 rounded-xl border-border bg-muted/30 font-semibold"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Gaji Min (IDR)
                    </Label>
                    <Input
                      type="number"
                      value={salaryMin}
                      onChange={(e) => setSalaryMin(e.target.value)}
                      placeholder="2500000"
                      className="h-11 rounded-xl border-border bg-muted/30 font-semibold"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-xs font-black uppercase tracking-[0.18em] text-muted-foreground">
                      Gaji Max (IDR)
                    </Label>
                    <Input
                      type="number"
                      value={salaryMax}
                      onChange={(e) => setSalaryMax(e.target.value)}
                      placeholder="3500000"
                      className="h-11 rounded-xl border-border bg-muted/30 font-semibold"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={submitting || !title.trim()}
                  className="h-11 rounded-xl font-bold uppercase tracking-wider text-sm"
                >
                  {submitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-1" />
                      Tambah Posisi
                    </>
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Daftar posisi */}
          <Card className="overflow-hidden rounded-2xl border-border bg-card shadow-xl shadow-rose-950/5">
            <div className="border-b border-border bg-muted/30 px-6 py-5 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black tracking-tight text-foreground">
                  Daftar Posisi
                </h2>
                <p className="mt-1 text-sm text-muted-foreground">
                  {jobs.length} total posisi terdaftar
                </p>
              </div>
            </div>
            <CardContent className="p-0">
              {loading ? (
                <div className="p-8 text-center">
                  <Loader2 className="h-6 w-6 animate-spin text-primary mx-auto" />
                  <p className="mt-2 text-sm text-muted-foreground">Memuat data...</p>
                </div>
              ) : jobs.length === 0 ? (
                <div className="p-8 text-center text-sm text-muted-foreground">
                  Belum ada posisi terdaftar.
                </div>
              ) : (
                <div className="divide-y divide-border">
                  {jobs.map((job) => (
                    <div
                      key={job.id}
                      className="flex items-center gap-4 px-6 py-4 hover:bg-muted/20 transition-colors"
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-foreground truncate">
                            {job.title}
                          </span>
                          {!job.isActive && (
                            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="mt-1 flex flex-wrap gap-2 text-xs text-muted-foreground">
                          {job.jobFunction && <span>{job.jobFunction}</span>}
                          {job.jobType && (
                            <>
                              <span className="text-border">|</span>
                              <span>{job.jobType}</span>
                            </>
                          )}
                          {job.location && (
                            <>
                              <span className="text-border">|</span>
                              <span>{job.location}</span>
                            </>
                          )}
                          {job.salaryMin && job.salaryMax && (
                            <>
                              <span className="text-border">|</span>
                              <span>
                                {formatSalary(job.salaryMin)} - {formatSalary(job.salaryMax)}
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 shrink-0">
                        <button
                          onClick={() => handleToggleActive(job.id, job.isActive)}
                          className="p-2 rounded-lg hover:bg-muted transition-colors"
                          title={job.isActive ? 'Nonaktifkan' : 'Aktifkan'}
                        >
                          {job.isActive ? (
                            <ToggleRight className="h-5 w-5 text-primary" />
                          ) : (
                            <ToggleLeft className="h-5 w-5 text-muted-foreground/50" />
                          )}
                        </button>
                        <button
                          onClick={() => handleDelete(job.id)}
                          className="p-2 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
