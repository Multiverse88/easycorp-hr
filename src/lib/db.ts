'use server';

import { prisma } from '@/lib/prisma';
import { sendAssessmentInvitation } from '@/lib/email';

function toDateStr(val: any): string {
  if (!val) return '';
  if (val instanceof Date) return val.toISOString();
  return String(val);
}

// ==========================================
// INTERFACES (unchanged)
// ==========================================

export interface ManpowerRequest {
  id: string;
  no_request: string;
  tanggal: string;
  divisi: string;
  pemohon: string;
  jabatan_pemohon: string;
  atasan_pemohon: string;
  posisi: string;
  jumlah: number;
  lokasi: string;
  tanggal_dibutuhkan: string;
  jenis_kebutuhan: 'Posisi Baru' | 'Replacement' | 'Tambahan Tim';
  replacement_name?: string;
  status_karyawan: 'PKWT' | 'PKWTT' | 'Magang' | 'Outsource';
  urgensi: 'Tinggi' | 'Sedang' | 'Rendah';
  alasan: string;
  jobdesk: string;
  kualifikasi: {
    pendidikan: string;
    pengalaman: string;
    keahlian: string;
    softskill: string;
    catatan: string;
  };
  range_gaji: { min: number; max: number };
  benefit: string;
  status: 'draft' | 'submitted' | 'verified' | 'approved' | 'rejected';
  approval_user_at?: string;
  approval_hrga_at?: string;
  approval_management_at?: string;
  created_at?: string;
}

export interface Candidate {
  id: string;
  nama: string;
  email: string;
  telepon: string;
  posisi_dilamar: string;
  manpower_request_id?: string;
  token: string;
  token_expires_at: string;
  status: 'interview_user' | 'offering' | 'reject';
  created_at: string;
  pendidikan?: string;
  pengalaman?: string;
  keahlian?: string;
}

export interface SelectionTestResult {
  id: string;
  candidate_id: string;
  tanggal_tes: string;
  penyelenggara: string;
  komponen: {
    nama: string;
    nilai: string;
    batas_lulus: string;
    catatan: string;
  }[];
  kesimpulan: 'Lulus' | 'Lulus Bersyarat' | 'Tidak Lulus';
  catatan_akhir: string;
}

export interface InterviewEvaluation {
  id: string;
  candidate_id: string;
  tanggal: string;
  tahap: 'HRGA' | 'User' | 'Final';
  interviewer: string;
  metode: 'Online' | 'Offline';
  ekspektasi_gaji: number;
  ketersediaan_bergabung: string;
  penilaian: {
    aspek: string;
    skor: number;
    catatan: string;
  }[];
  total_skor: number;
  kelebihan: string;
  area_digali: string;
  catatan: string;
  rekomendasi: 'Lanjut Tahap Berikutnya' | 'Talent Pool' | 'Tidak Lanjut';
}

export interface DiscTestResult {
  id: string;
  candidate_id: string;
  answers: { questionId: number; most: string; least: string }[];
  skor_d: number;
  skor_i: number;
  skor_s: number;
  skor_c: number;
  persen_d: number;
  persen_i: number;
  persen_s: number;
  persen_c: number;
  tipe_primer: string;
  tipe_sekunder: string;
  completed_at: string;
}

export interface WptTestResult {
  id: string;
  candidate_id: string;
  answers: { questionId: number; answer: string }[];
  skor: number;
  total_soal: number;
  persen_benar: number;
  kategori: string;
  profil_kemampuan: { category: string; total: number; benar: number; persen: number; keterangan: string }[];
  rekomendasi_posisi: { posisi: string; skorMin: number; skorIdeal: string; status: string; rekomendasi: string }[];
  completed_at: string;
}

export interface ActivityLog {
  id: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  description: string;
  details: Record<string, unknown> | null;
  user_email: string | null;
  created_at: string;
}

export interface PapikostikTestResult {
  id: string;
  candidate_id: string;
  nama_file: string;
  results: {
    aspek: string;
    kode: string;
    skor: number;
    analisis: string;
  }[];
  completed_at: string;
}

// ==========================================
// HELPER: Convert Prisma result to snake_case interface
// ==========================================

function mapManpowerRequest(row: any): ManpowerRequest {
  return {
    id: row.id,
    no_request: row.noRequest,
    tanggal: row.tanggal,
    divisi: row.divisi,
    pemohon: row.pemohon,
    jabatan_pemohon: row.jabatanPemohon,
    atasan_pemohon: row.atasanPemohon,
    posisi: row.posisi,
    jumlah: row.jumlah,
    lokasi: row.lokasi,
    tanggal_dibutuhkan: row.tanggalDibutuhkan,
    jenis_kebutuhan: row.jenisKebutuhan,
    replacement_name: row.replacementName || undefined,
    status_karyawan: row.statusKaryawan,
    urgensi: row.urgensi,
    alasan: row.alasan,
    jobdesk: row.jobdesk,
    kualifikasi: row.kualifikasi as any,
    range_gaji: row.rangeGaji as any,
    benefit: row.benefit,
    status: row.status,
    approval_user_at: row.approvalUserAt || undefined,
    approval_hrga_at: row.approvalHrgaAt || undefined,
    approval_management_at: row.approvalManagementAt || undefined,
    created_at: toDateStr(row.createdAt),
  };
}

function mapCandidate(row: any): Candidate {
  return {
    id: row.id,
    nama: row.nama,
    email: row.email || '',
    telepon: row.telepon || '',
    posisi_dilamar: row.posisiDilamar,
    manpower_request_id: row.manpowerRequestId || undefined,
    token: row.token,
    token_expires_at: row.tokenExpiresAt,
    status: row.status,
    created_at: toDateStr(row.createdAt),
    pendidikan: row.pendidikan || undefined,
    pengalaman: row.pengalaman || undefined,
    keahlian: row.keahlian || undefined,
  };
}

function mapSelectionTestResult(row: any): SelectionTestResult {
  return {
    id: row.id,
    candidate_id: row.candidateId,
    tanggal_tes: row.tanggalTes,
    penyelenggara: row.penyelenggara,
    komponen: row.komponen as any,
    kesimpulan: row.kesimpulan,
    catatan_akhir: row.catatanAkhir,
  };
}

function mapInterviewEvaluation(row: any): InterviewEvaluation {
  return {
    id: row.id,
    candidate_id: row.candidateId,
    tanggal: row.tanggal,
    tahap: row.tahap,
    interviewer: row.interviewer,
    metode: row.metode,
    ekspektasi_gaji: row.ekspektasiGaji || 0,
    ketersediaan_bergabung: row.ketersediaanBergabung || '',
    penilaian: row.penilaian as any,
    total_skor: row.totalSkor || 0,
    kelebihan: row.kelebihan || '',
    area_digali: row.areaDigali || '',
    catatan: row.catatan || '',
    rekomendasi: row.rekomendasi,
  };
}

function mapDiscTestResult(row: any): DiscTestResult {
  return {
    id: row.id,
    candidate_id: row.candidateId,
    answers: row.answers as any,
    skor_d: row.skorD,
    skor_i: row.skorI,
    skor_s: row.skorS,
    skor_c: row.skorC,
    persen_d: row.persenD,
    persen_i: row.persenI,
    persen_s: row.persenS,
    persen_c: row.persenC,
    tipe_primer: row.tipePrimer,
    tipe_sekunder: row.tipeSekunder,
    completed_at: row.completedAt,
  };
}

function mapWptTestResult(row: any): WptTestResult {
  return {
    id: row.id,
    candidate_id: row.candidateId,
    answers: row.answers as any,
    skor: row.skor,
    total_soal: row.totalSoal,
    persen_benar: row.persenBenar,
    kategori: row.kategori,
    profil_kemampuan: row.profilKemampuan as any,
    rekomendasi_posisi: row.rekomendasiPosisi as any,
    completed_at: row.completedAt,
  };
}

function mapKoranTestResult(row: any) {
  return {
    id: row.id,
    candidate_id: row.candidateId,
    nama_file: row.namaFile,
    foto_url: row.fotoUrl,
    analysis_result: row.analysisResult,
    created_at: toDateStr(row.createdAt),
  };
}

function mapActivityLog(row: any): ActivityLog {
  return {
    id: row.id,
    action: row.action,
    table_name: row.tableName,
    record_id: row.recordId,
    description: row.description,
    details: row.details as Record<string, unknown> | null,
    user_email: row.userEmail,
    created_at: toDateStr(row.createdAt),
  };
}

// ==========================================
// LOG FUNCTIONS
// ==========================================

export async function logActivity(params: {
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  table_name: string;
  record_id: string;
  description: string;
  details?: Record<string, unknown>;
  user_email?: string;
}): Promise<void> {
  try {
    await prisma.log.create({
      data: {
        id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        action: params.action,
        tableName: params.table_name,
        recordId: params.record_id,
        description: params.description,
        details: (params.details as any) || undefined,
        userEmail: params.user_email || undefined,
      },
    });
  } catch (err) {
    console.error('logActivity error:', err);
  }
}

export async function getLogs(limit: number = 100): Promise<ActivityLog[]> {
  try {
    const rows = await prisma.log.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
    return rows.map(mapActivityLog);
  } catch (error) {
    console.error('getLogs error:', error);
    return [];
  }
}

// ==========================================
// 1. MANPOWER REQUEST ACTIONS
// ==========================================

export async function getManpowerRequests(): Promise<ManpowerRequest[]> {
  try {
    const rows = await prisma.manpowerRequest.findMany({
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapManpowerRequest);
  } catch (error) {
    console.error('getManpowerRequests error:', error);
    return [];
  }
}

export async function getManpowerRequestById(id: string): Promise<ManpowerRequest | undefined> {
  try {
    const row = await prisma.manpowerRequest.findUnique({ where: { id } });
    if (!row) return undefined;
    return mapManpowerRequest(row);
  } catch {
    return undefined;
  }
}

export async function saveManpowerRequest(req: Omit<ManpowerRequest, 'id' | 'no_request' | 'status'> & { id?: string }): Promise<ManpowerRequest> {
  if (req.id) {
    const row = await prisma.manpowerRequest.update({
      where: { id: req.id },
      data: {
        tanggal: req.tanggal,
        divisi: req.divisi,
        pemohon: req.pemohon,
        jabatanPemohon: req.jabatan_pemohon,
        atasanPemohon: req.atasan_pemohon,
        posisi: req.posisi,
        jumlah: req.jumlah,
        lokasi: req.lokasi,
        tanggalDibutuhkan: req.tanggal_dibutuhkan,
        jenisKebutuhan: req.jenis_kebutuhan,
        replacementName: req.replacement_name || null,
        statusKaryawan: req.status_karyawan,
        urgensi: req.urgensi,
        alasan: req.alasan,
        jobdesk: req.jobdesk,
        kualifikasi: req.kualifikasi as any,
        rangeGaji: req.range_gaji as any,
        benefit: req.benefit,
      },
    });
    logActivity({ action: 'UPDATE', table_name: 'manpower_requests', record_id: req.id, description: `Manpower request ${req.id} diperbarui - posisi: ${req.posisi}`, details: { posisi: req.posisi, divisi: req.divisi, jumlah: req.jumlah } });
    return mapManpowerRequest(row);
  }

  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  const count = await prisma.manpowerRequest.count();
  const seq = String(count + 1).padStart(3, '0');
  const no_request = `MR/${month}/${year}/${seq}`;
  const id = `mr-${Date.now()}`;

  const row = await prisma.manpowerRequest.create({
    data: {
      id,
      noRequest: no_request,
      tanggal: req.tanggal,
      divisi: req.divisi,
      pemohon: req.pemohon,
      jabatanPemohon: req.jabatan_pemohon,
      atasanPemohon: req.atasan_pemohon,
      posisi: req.posisi,
      jumlah: req.jumlah,
      lokasi: req.lokasi,
      tanggalDibutuhkan: req.tanggal_dibutuhkan,
      jenisKebutuhan: req.jenis_kebutuhan,
      replacementName: req.replacement_name || null,
      statusKaryawan: req.status_karyawan,
      urgensi: req.urgensi,
      alasan: req.alasan,
      jobdesk: req.jobdesk,
      kualifikasi: req.kualifikasi as any,
      rangeGaji: req.range_gaji as any,
      benefit: req.benefit,
      status: 'submitted',
      approvalUserAt: now.toISOString().split('T')[0],
    },
  });

  logActivity({ action: 'CREATE', table_name: 'manpower_requests', record_id: id, description: `Manpower request baru ${no_request} dibuat - posisi: ${req.posisi} oleh ${req.pemohon}`, details: { no_request, posisi: req.posisi, divisi: req.divisi, pemohon: req.pemohon } });
  return mapManpowerRequest(row);
}

export async function approveManpowerRequest(id: string, role: 'hrga' | 'management'): Promise<ManpowerRequest | undefined> {
  const nowStr = new Date().toISOString().split('T')[0];

  const data: Record<string, any> = {};
  if (role === 'hrga') {
    data.status = 'verified';
    data.approvalHrgaAt = nowStr;
  } else if (role === 'management') {
    data.status = 'approved';
    data.approvalManagementAt = nowStr;
  }

  console.log('approveManpowerRequest called:', { id, role, data });

  try {
    const row = await prisma.manpowerRequest.update({ where: { id }, data });
    console.log('approveManpowerRequest success:', row);
    logActivity({ action: 'UPDATE', table_name: 'manpower_requests', record_id: id, description: `Manpower request ${id} disetujui oleh ${role === 'hrga' ? 'HRGA' : 'Management'} - status: ${data.status}`, details: { role, new_status: data.status } });
    return mapManpowerRequest(row);
  } catch (error) {
    console.error('approveManpowerRequest error:', error);
    return undefined;
  }
}

export async function rejectManpowerRequest(id: string): Promise<ManpowerRequest | undefined> {
  try {
    const row = await prisma.manpowerRequest.update({
      where: { id },
      data: { status: 'rejected' },
    });
    logActivity({ action: 'UPDATE', table_name: 'manpower_requests', record_id: id, description: `Manpower request ${id} ditolak`, details: { new_status: 'rejected' } });
    return mapManpowerRequest(row);
  } catch {
    return undefined;
  }
}

// ==========================================
// 2. CANDIDATE ACTIONS
// ==========================================

export async function getCandidates(): Promise<Candidate[]> {
  try {
    const rows = await prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
    });
    console.log(`getCandidates: ${rows.length} records`);
    return rows.map(mapCandidate);
  } catch (error) {
    console.error('getCandidates error:', error);
    return [];
  }
}

export type CandidateWithScore = Candidate & { score: number; ai_status?: string; testCount?: number };

export async function getCandidatesWithAnalysis(): Promise<CandidateWithScore[]> {
  try {
    const candidates = await prisma.candidate.findMany({
      orderBy: { createdAt: 'desc' },
    });

    if (candidates.length === 0) return [];

    const candidateIds = candidates.map(c => c.id);

    const [analyses, discTests, wptTests, koranTests, papiTests] = await Promise.all([
      prisma.candidateAiAnalysis.findMany({
        where: { candidateId: { in: candidateIds } },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.discTest.findMany({ where: { candidateId: { in: candidateIds } } }),
      prisma.wptTest.findMany({ where: { candidateId: { in: candidateIds } } }),
      prisma.koranTest.findMany({ where: { candidateId: { in: candidateIds } } }),
      prisma.papikostikTestResult.findMany({ where: { candidateId: { in: candidateIds } } }),
    ]);

    const analysesByCandidate: Record<string, any[]> = {};
    for (const record of analyses) {
      if (!analysesByCandidate[record.candidateId]) {
        analysesByCandidate[record.candidateId] = [];
      }
      analysesByCandidate[record.candidateId].push(record);
    }

    const discSet = new Set(discTests.map(t => t.candidateId));
    const wptSet = new Set(wptTests.map(t => t.candidateId));
    const koranSet = new Set(koranTests.map(t => t.candidateId));
    const papiSet = new Set(papiTests.map(t => t.candidateId));

    return candidates.map((cand) => {
      let score = 0;
      let ai_status: string | undefined;
      let testCount = 0;
      
      if (discSet.has(cand.id)) testCount++;
      if (wptSet.has(cand.id)) testCount++;
      if (koranSet.has(cand.id)) testCount++;
      if (papiSet.has(cand.id)) testCount++;
      
      const candAnalyses = analysesByCandidate[cand.id];
      
      if (candAnalyses && candAnalyses.length > 0) {
        const latest = candAnalyses[0];
        if ((latest.analysis as any)?.kesimpulan_akhir?.skor_keseluruhan) {
          score = Number((latest.analysis as any).kesimpulan_akhir.skor_keseluruhan);
        }
        if ((latest.analysis as any)?.status) {
          ai_status = (latest.analysis as any).status;
        }
      }
      
      return {
        ...mapCandidate(cand),
        score,
        ai_status,
        testCount,
      } as CandidateWithScore;
    });
  } catch (error) {
    console.error('getCandidatesWithAnalysis error:', error);
    return [];
  }
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  if (id === 'mock-candidate') {
    return {
      id: 'mock-candidate',
      nama: 'John Developer',
      email: 'dev@easycorp.com',
      telepon: '08123456789',
      posisi_dilamar: 'Software Engineer',
      token: 'dev-preview',
      token_expires_at: '2099-12-31',
      status: 'interview_user',
      created_at: new Date().toISOString(),
      pendidikan: 'S1 Teknik Informatika',
    } as Candidate;
  }

  try {
    const row = await prisma.candidate.findUnique({ where: { id } });
    if (!row) return undefined;
    return mapCandidate(row);
  } catch {
    return undefined;
  }
}

export async function getCandidateByToken(token: string): Promise<Candidate | undefined> {
  if (token === 'dev-preview') {
    return {
      id: 'mock-candidate',
      nama: 'John Developer',
      email: 'dev@easycorp.com',
      telepon: '08123456789',
      posisi_dilamar: 'Software Engineer',
      token: 'dev-preview',
      token_expires_at: '2099-12-31',
      status: 'interview_user',
      created_at: new Date().toISOString(),
      pendidikan: 'S1 Teknik Informatika',
    } as Candidate;
  }

  try {
    const row = await prisma.candidate.findUnique({ where: { token } });
    if (!row) return undefined;
    return mapCandidate(row);
  } catch {
    return undefined;
  }
}

export async function createCandidate(
  cand: Omit<Candidate, 'id' | 'token' | 'token_expires_at' | 'status' | 'created_at'>,
  options?: { sendEmail?: boolean; origin?: string }
): Promise<Candidate & { emailSent?: boolean; emailError?: string }> {
  const id = `cnd-${Date.now()}`;
  const token = `token-${Math.random().toString(36).substring(2, 15)}`;

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 14);
  const token_expires_at = expiry.toISOString();

  const row = await prisma.candidate.create({
    data: {
      id,
      nama: cand.nama,
      email: cand.email || '',
      telepon: cand.telepon || '',
      posisiDilamar: cand.posisi_dilamar,
      manpowerRequestId: cand.manpower_request_id || null,
      token,
      tokenExpiresAt: token_expires_at,
      status: 'interview_user',
    },
  });

  logActivity({ 
    action: 'CREATE', 
    table_name: 'candidates', 
    record_id: id, 
    description: `Kandidat baru "${cand.nama}" dibuat untuk posisi ${cand.posisi_dilamar}`, 
    details: { nama: cand.nama, email: cand.email, posisi_dilamar: cand.posisi_dilamar } 
  });

  const result = mapCandidate(row) as Candidate & { emailSent?: boolean; emailError?: string };

  if (options?.sendEmail && cand.email) {
    const origin = process.env.NEXT_PUBLIC_APP_URL || 'https://disc.easyai.id';
    const link = `${origin}/disc/${token}`;
    
    try {
      const emailRes = await sendAssessmentInvitation({
        candidateName: cand.nama,
        candidateEmail: cand.email,
        position: cand.posisi_dilamar,
        token,
        link,
        expiresAt: token_expires_at,
      });
      
      result.emailSent = emailRes.success;
      if (!emailRes.success) {
        result.emailError = emailRes.error;
      }
    } catch (emailErr) {
      console.error('Error sending email during candidate creation:', emailErr);
      result.emailSent = false;
      result.emailError = emailErr instanceof Error ? emailErr.message : 'SMTP_ERROR';
    }
  }

  return result;
}

export async function getPapikostikTestResultByCandidate(candidateId: string): Promise<PapikostikTestResult | undefined> {
  try {
    const row = await prisma.papikostikTestResult.findUnique({ where: { candidateId } });
    if (!row) return undefined;
    return {
      id: row.id,
      candidate_id: row.candidateId,
      nama_file: row.namaFile,
      results: row.results as any,
      completed_at: toDateStr(row.completedAt),
    };
  } catch {
    return undefined;
  }
}

export async function resendInvitationEmail(
  candidateId: string,
  origin: string
): Promise<{ success: boolean; error?: string }> {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    return { success: false, error: 'KANDIDAT_TIDAK_DITEMUKAN' };
  }
  
  if (!candidate.email) {
    return { success: false, error: 'EMAIL_KANDIDAT_KOSONG' };
  }
  
  const productionOrigin = process.env.NEXT_PUBLIC_APP_URL || 'https://disc.easyai.id';
  const link = `${productionOrigin}/disc/${candidate.token}`;
  
  try {
    const res = await sendAssessmentInvitation({
      candidateName: candidate.nama,
      candidateEmail: candidate.email,
      position: candidate.posisi_dilamar,
      token: candidate.token,
      link,
      expiresAt: candidate.token_expires_at,
    });
    return res;
  } catch (err) {
    console.error('Error in resendInvitationEmail:', err);
    return { success: false, error: err instanceof Error ? err.message : 'SMTP_ERROR' };
  }
}


export async function updateCandidateStatus(id: string, status: Candidate['status']): Promise<Candidate | undefined> {
  try {
    const current = await prisma.candidate.findUnique({
      where: { id },
      select: { status: true, nama: true, email: true },
    });

    if (!current) {
      console.error('updateCandidateStatus: kandidat tidak ditemukan:', id);
      return undefined;
    }

    const row = await prisma.candidate.update({
      where: { id },
      data: { status },
    });

    logActivity({ action: 'UPDATE', table_name: 'candidates', record_id: id, description: `Status kandidat ${current.nama || id}: "${current.status}" diubah menjadi "${status}"`, details: { old_status: current.status, new_status: status, nama: current.nama }, user_email: current.email || undefined });
    return mapCandidate(row);
  } catch (error) {
    console.error('updateCandidateStatus error:', error);
    return undefined;
  }
}

export async function saveCandidateBio(token: string, bio: { pendidikan: string; pengalaman: string; keahlian: string }): Promise<Candidate | undefined> {
  try {
    const row = await prisma.candidate.update({
      where: { token },
      data: {
        pendidikan: bio.pendidikan,
        pengalaman: bio.pengalaman,
        keahlian: bio.keahlian,
      },
    });
    logActivity({ action: 'UPDATE', table_name: 'candidates', record_id: row.id, description: `Bio kandidat ${row.nama || token} diperbarui`, details: { pendidikan: bio.pendidikan, pengalaman: bio.pengalaman }, user_email: row.email || undefined });
    return mapCandidate(row);
  } catch {
    return undefined;
  }
}

// ==========================================
// 3. INTERVIEW EVALUATIONS (FR-HRGA-001.03)
// ==========================================

export async function getInterviewEvaluationByCandidate(candidateId: string): Promise<InterviewEvaluation | undefined> {
  try {
    const row = await prisma.interviewEvaluation.findUnique({ where: { candidateId } });
    if (!row) return undefined;
    return mapInterviewEvaluation(row);
  } catch {
    return undefined;
  }
}

export async function saveInterviewEvaluation(evalData: Omit<InterviewEvaluation, 'id'> & { id?: string }): Promise<InterviewEvaluation> {
  const payload: Record<string, any> = {
    candidateId: evalData.candidate_id,
    tanggal: evalData.tanggal,
    tahap: evalData.tahap,
    interviewer: evalData.interviewer,
    metode: evalData.metode,
    ekspektasiGaji: evalData.ekspektasi_gaji || null,
    ketersediaanBergabung: evalData.ketersediaan_bergabung || null,
    penilaian: evalData.penilaian as any,
    totalSkor: evalData.total_skor,
    kelebihan: evalData.kelebihan || null,
    areaDigali: evalData.area_digali || null,
    catatan: evalData.catatan || null,
    rekomendasi: evalData.rekomendasi,
  };

  let row;
  if (evalData.id) {
    row = await prisma.interviewEvaluation.update({
      where: { id: evalData.id },
      data: payload as any,
    });
  } else {
    payload.id = `ie-${Date.now()}`;
    row = await prisma.interviewEvaluation.create({ data: payload as any });
  }

  const evalAction = evalData.id ? 'UPDATE' : 'CREATE';
  logActivity({ action: evalAction, table_name: 'interview_evaluations', record_id: row.id, description: `${evalAction === 'CREATE' ? 'Evaluasi interview baru' : 'Evaluasi interview diperbarui'} - tahap ${evalData.tahap} untuk kandidat ${evalData.candidate_id}`, details: { candidate_id: evalData.candidate_id, tahap: evalData.tahap, rekomendasi: evalData.rekomendasi, total_skor: evalData.total_skor } });

  return mapInterviewEvaluation(row);
}

// ==========================================
// 4. SELECTION TEST RESULTS (FR-HRGA-001.02)
// ==========================================

export async function getSelectionTestResultByCandidate(candidateId: string): Promise<SelectionTestResult | undefined> {
  try {
    const row = await prisma.selectionTestResult.findUnique({ where: { candidateId } });
    if (!row) return undefined;
    return mapSelectionTestResult(row);
  } catch {
    return undefined;
  }
}

export async function saveSelectionTestResult(resultData: Omit<SelectionTestResult, 'id'> & { id?: string }): Promise<SelectionTestResult> {
  const payload: Record<string, any> = {
    candidateId: resultData.candidate_id,
    tanggalTes: resultData.tanggal_tes,
    penyelenggara: resultData.penyelenggara,
    komponen: resultData.komponen as any,
    kesimpulan: resultData.kesimpulan,
    catatanAkhir: resultData.catatan_akhir || null,
  };

  let row;
  if (resultData.id) {
    row = await prisma.selectionTestResult.update({
      where: { id: resultData.id },
      data: payload as any,
    });
  } else {
    payload.id = `st-${Date.now()}`;
    row = await prisma.selectionTestResult.create({ data: payload as any });
  }

  const testAction = resultData.id ? 'UPDATE' : 'CREATE';
  logActivity({ action: testAction, table_name: 'selection_test_results', record_id: row.id, description: `${testAction === 'CREATE' ? 'Hasil tes seleksi baru' : 'Hasil tes seleksi diperbarui'} - kandidat ${resultData.candidate_id}`, details: { candidate_id: resultData.candidate_id, kesimpulan: resultData.kesimpulan, penyelenggara: resultData.penyelenggara } });
  return mapSelectionTestResult(row);
}

// ==========================================
// 5. DISC TEST RESULTS
// ==========================================

export async function getDiscTestResultByCandidate(candidateId: string): Promise<DiscTestResult | undefined> {
  try {
    const row = await prisma.discTest.findUnique({ where: { candidateId } });
    if (!row) return undefined;
    return mapDiscTestResult(row);
  } catch {
    return undefined;
  }
}

export async function saveDiscTestResult(res: Omit<DiscTestResult, 'id'>): Promise<DiscTestResult> {
  const existing = await prisma.discTest.findUnique({
    where: { candidateId: res.candidate_id },
    select: { id: true },
  });

  if (existing) {
    throw new Error('DISC_TEST_ALREADY_COMPLETED');
  }

  const id = `dt-${Date.now()}`;

  console.log('Saving DISC result:', JSON.stringify({ ...res, id }, null, 2));

  try {
    const row = await prisma.discTest.create({
      data: {
        id,
        candidateId: res.candidate_id,
        answers: res.answers as any,
        skorD: res.skor_d,
        skorI: res.skor_i,
        skorS: res.skor_s,
        skorC: res.skor_c,
        persenD: res.persen_d,
        persenI: res.persen_i,
        persenS: res.persen_s,
        persenC: res.persen_c,
        tipePrimer: res.tipe_primer,
        tipeSekunder: res.tipe_sekunder,
        completedAt: res.completed_at,
      },
    });

    logActivity({ action: 'CREATE', table_name: 'disc_tests', record_id: id, description: `Hasil tes DISC baru untuk kandidat ${res.candidate_id} - tipe primer: ${res.tipe_primer}`, details: { candidate_id: res.candidate_id, tipe_primer: res.tipe_primer, tipe_sekunder: res.tipe_sekunder } });

    return mapDiscTestResult(row);
  } catch (error: any) {
    console.error('DISC insert error:', error);
    throw new Error(`Gagal simpan DISC: ${error.message}`);
  }
}

// ==========================================
// 7. WPT TEST RESULTS
// ==========================================

export async function getWptTestResultByCandidate(candidateId: string): Promise<WptTestResult | undefined> {
  try {
    const row = await prisma.wptTest.findUnique({ where: { candidateId } });
    if (!row) return undefined;
    return mapWptTestResult(row);
  } catch {
    return undefined;
  }
}

export async function saveWptTestResult(res: Omit<WptTestResult, 'id'>): Promise<WptTestResult> {
  const existing = await prisma.wptTest.findUnique({
    where: { candidateId: res.candidate_id },
    select: { id: true },
  });

  if (existing) {
    throw new Error('WPT_TEST_ALREADY_COMPLETED');
  }

  const id = `wpt-${Date.now()}`;

  const row = await prisma.wptTest.create({
    data: {
      id,
      candidateId: res.candidate_id,
      answers: res.answers as any,
      skor: res.skor,
      totalSoal: res.total_soal,
      persenBenar: res.persen_benar,
      kategori: res.kategori,
      profilKemampuan: res.profil_kemampuan as any,
      rekomendasiPosisi: res.rekomendasi_posisi as any,
      completedAt: res.completed_at,
    },
  });

  logActivity({ action: 'CREATE', table_name: 'wpt_tests', record_id: id, description: `Hasil tes WPT baru untuk kandidat ${res.candidate_id} - skor: ${res.skor}/50 (${res.kategori})`, details: { candidate_id: res.candidate_id, skor: res.skor, kategori: res.kategori } });

  return mapWptTestResult(row);
}

// ==========================================
// 8. KORAN TEST RESULTS (TES KORAN / PAULI / KRAEPELIN)
// ==========================================

export interface KoranTestResult {
  id: string;
  candidate_id: string;
  nama_file: string;
  foto_url: string;
  analysis_result: {
    kecepatan: string;
    ketelitian: string;
    konsistensi: string;
    ketahanan: string;
    reasoning: string;
    rekomendasi: 'Lulus' | 'Dipertimbangkan' | 'Tidak Lulus';
    total_benar?: number;
    total_salah?: number;
    kecepatan_nilai?: number;
    kecepatan_kategori?: string;
    akurasi_nilai?: number;
    akurasi_kategori?: string;
    keajegan_nilai?: number;
    keajegan_kategori?: string;
    ketahanan_nilai?: number;
    ketahanan_kategori?: string;
    pola_grafik?: string;
  };
  created_at?: string;
}

export async function getKoranTestResultByCandidate(candidateId: string): Promise<KoranTestResult | undefined> {
  try {
    const rows = await prisma.koranTest.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (rows.length === 0) return undefined;
    return mapKoranTestResult(rows[0]) as KoranTestResult;
  } catch (error) {
    console.error('getKoranTestResultByCandidate error:', error);
    return undefined;
  }
}

export async function saveKoranTestResult(res: Omit<KoranTestResult, 'id'> & { id?: string }): Promise<KoranTestResult> {
  const id = res.id || `koran-${Date.now()}`;

  let row;
  if (res.id) {
    row = await prisma.koranTest.update({
      where: { id: res.id },
      data: {
        candidateId: res.candidate_id,
        namaFile: res.nama_file,
        fotoUrl: res.foto_url,
        analysisResult: res.analysis_result as any,
      },
    });
  } else {
    row = await prisma.koranTest.create({
      data: {
        id,
        candidateId: res.candidate_id,
        namaFile: res.nama_file,
        fotoUrl: res.foto_url,
        analysisResult: res.analysis_result as any,
      },
    });
  }

  logActivity({
    action: res.id ? 'UPDATE' : 'CREATE',
    table_name: 'koran_tests',
    record_id: id,
    description: `Hasil Tes Koran ${res.id ? 'diperbarui' : 'baru'} untuk kandidat ${res.candidate_id}`,
    details: { candidate_id: res.candidate_id }
  });

  return mapKoranTestResult(row) as KoranTestResult;
}

export async function deleteKoranTestResult(id: string): Promise<void> {
  await prisma.koranTest.delete({ where: { id } });

  logActivity({
    action: 'DELETE',
    table_name: 'koran_tests',
    record_id: id,
    description: `Hasil Tes Koran ${id} dihapus`
  });
}

// ==========================================
// 9. AI ANALYSIS RESULTS
// ==========================================

export interface CandidateAiAnalysis {
  id: string;
  candidate_id: string;
  analysis: any;
  created_at?: string;
}

export async function getAiAnalysisByCandidate(candidateId: string): Promise<CandidateAiAnalysis | undefined> {
  try {
    const rows = await prisma.candidateAiAnalysis.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      candidate_id: row.candidateId,
      analysis: row.analysis,
      created_at: toDateStr(row.createdAt),
    };
  } catch (error) {
    console.error('getAiAnalysisByCandidate error:', error);
    return undefined;
  }
}

export async function saveAiAnalysis(candidateId: string, analysis: any): Promise<CandidateAiAnalysis> {
  const row = await prisma.candidateAiAnalysis.create({
    data: {
      candidateId,
      analysis,
    },
  });

  logActivity({
    action: 'CREATE',
    table_name: 'candidate_ai_analysis',
    record_id: row.id,
    description: `Hasil Analisis AI baru untuk kandidat ${candidateId}`,
    details: { candidate_id: candidateId }
  });

  return {
    id: row.id,
    candidate_id: row.candidateId,
    analysis: row.analysis,
    created_at: toDateStr(row.createdAt),
  };
}

// ==========================================
// 10. PAPIKOSTIK SESSIONS
// ==========================================

export interface PapikostikSession {
  id: string;
  candidate_id: string;
  token: string;
  status: 'PENDING' | 'COMPLETED';
  current_page: number;
  answers: Record<string, 'a' | 'b'>;
  results: any;
  created_at?: string;
  updated_at?: string;
}

export async function getPapikostikSessionByToken(token: string): Promise<PapikostikSession | undefined> {
  if (token === 'dev-preview') {
    return {
      id: 'mock-ps',
      candidate_id: 'mock-candidate',
      token: 'dev-preview',
      status: 'PENDING',
      current_page: 1,
      answers: {},
      results: null,
    } as PapikostikSession;
  }

  try {
    const row = await prisma.papikostikSession.findUnique({ where: { token } });
    if (!row) return undefined;
    return {
      id: row.id,
      candidate_id: row.candidateId,
      token: row.token,
      status: row.status as 'PENDING' | 'COMPLETED',
      current_page: row.currentPage,
      answers: row.answers as Record<string, 'a' | 'b'>,
      results: row.results,
      created_at: toDateStr(row.createdAt),
      updated_at: toDateStr(row.updatedAt),
    };
  } catch {
    return undefined;
  }
}

export async function getPapikostikSessionByCandidate(candidateId: string): Promise<PapikostikSession | undefined> {
  try {
    const rows = await prisma.papikostikSession.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      take: 1,
    });
    if (rows.length === 0) return undefined;
    const row = rows[0];
    return {
      id: row.id,
      candidate_id: row.candidateId,
      token: row.token,
      status: row.status as 'PENDING' | 'COMPLETED',
      current_page: row.currentPage,
      answers: row.answers as Record<string, 'a' | 'b'>,
      results: row.results,
      created_at: toDateStr(row.createdAt),
      updated_at: toDateStr(row.updatedAt),
    };
  } catch {
    return undefined;
  }
}

export async function createPapikostikSession(candidateId: string): Promise<PapikostikSession> {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) throw new Error("Candidate not found");
  
  const token = candidate.token;

  if (candidateId === 'mock-candidate') {
    return {
      id: 'mock-ps',
      candidate_id: 'mock-candidate',
      token: 'dev-preview',
      status: 'PENDING',
      current_page: 1,
      answers: {},
      results: null,
    } as PapikostikSession;
  }

  const existing = await getPapikostikSessionByToken(token);
  if (existing) return existing;

  const id = `ps-${Date.now()}`;

  const row = await prisma.papikostikSession.create({
    data: {
      id,
      candidateId,
      token,
      status: 'PENDING',
      currentPage: 1,
      answers: {},
    },
  });

  logActivity({
    action: 'CREATE',
    table_name: 'papikostik_sessions',
    record_id: id,
    description: `Sesi tes PAPIKOSTIK baru untuk kandidat ${candidateId}`,
    details: { candidate_id: candidateId, token }
  });

  return {
    id: row.id,
    candidate_id: row.candidateId,
    token: row.token,
    status: row.status as 'PENDING' | 'COMPLETED',
    current_page: row.currentPage,
    answers: row.answers as Record<string, 'a' | 'b'>,
    results: row.results,
    created_at: toDateStr(row.createdAt),
    updated_at: toDateStr(row.updatedAt),
  };
}

export async function updatePapikostikSession(
  id: string,
  updates: Partial<Pick<PapikostikSession, 'status' | 'current_page' | 'answers' | 'results'>>
): Promise<PapikostikSession> {
  const data: Record<string, any> = {};
  if (updates.status !== undefined) data.status = updates.status;
  if (updates.current_page !== undefined) data.currentPage = updates.current_page;
  if (updates.answers !== undefined) data.answers = updates.answers;
  if (updates.results !== undefined) data.results = updates.results;

  const row = await prisma.papikostikSession.update({
    where: { id },
    data,
  });

  return {
    id: row.id,
    candidate_id: row.candidateId,
    token: row.token,
    status: row.status as 'PENDING' | 'COMPLETED',
    current_page: row.currentPage,
    answers: row.answers as Record<string, 'a' | 'b'>,
    results: row.results,
    created_at: toDateStr(row.createdAt),
    updated_at: toDateStr(row.updatedAt),
  };
}
