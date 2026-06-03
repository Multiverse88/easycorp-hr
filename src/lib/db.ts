'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { sendAssessmentInvitation } from '@/lib/email';
import crypto from 'crypto';

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
    await supabaseAdmin.from('logs').insert({
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      action: params.action,
      table_name: params.table_name,
      record_id: params.record_id,
      description: params.description,
      details: params.details || null,
      user_email: params.user_email || null,
    });
  } catch (err) {
    console.error('logActivity error:', err);
  }
}

export async function getLogs(limit: number = 100): Promise<ActivityLog[]> {
  const { data, error } = await supabaseAdmin
    .from('logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    console.error('getLogs error:', error);
    return [];
  }
  return (data || []) as ActivityLog[];
}

// ==========================================
// 1. MANPOWER REQUEST ACTIONS
// ==========================================

export async function getManpowerRequests(): Promise<ManpowerRequest[]> {
  const { data, error } = await supabaseAdmin
    .from('manpower_requests')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getManpowerRequests error:', error);
    return [];
  }
  return (data || []) as ManpowerRequest[];
}

export async function getManpowerRequestById(id: string): Promise<ManpowerRequest | undefined> {
  const { data, error } = await supabaseAdmin
    .from('manpower_requests')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return undefined;
  return data as ManpowerRequest;
}

export async function saveManpowerRequest(req: Omit<ManpowerRequest, 'id' | 'no_request' | 'status'> & { id?: string }): Promise<ManpowerRequest> {
  if (req.id) {
    // Update existing
    const { data, error } = await supabaseAdmin
      .from('manpower_requests')
      .update({
        tanggal: req.tanggal,
        divisi: req.divisi,
        pemohon: req.pemohon,
        jabatan_pemohon: req.jabatan_pemohon,
        atasan_pemohon: req.atasan_pemohon,
        posisi: req.posisi,
        jumlah: req.jumlah,
        lokasi: req.lokasi,
        tanggal_dibutuhkan: req.tanggal_dibutuhkan,
        jenis_kebutuhan: req.jenis_kebutuhan,
        replacement_name: req.replacement_name || null,
        status_karyawan: req.status_karyawan,
        urgensi: req.urgensi,
        alasan: req.alasan,
        jobdesk: req.jobdesk,
        kualifikasi: req.kualifikasi,
        range_gaji: req.range_gaji,
        benefit: req.benefit,
      })
      .eq('id', req.id)
      .select()
      .single();

    if (error) throw new Error(`Gagal update: ${error.message}`);
    logActivity({ action: 'UPDATE', table_name: 'manpower_requests', record_id: req.id!, description: `Manpower request ${req.id} diperbarui - posisi: ${req.posisi}`, details: { posisi: req.posisi, divisi: req.divisi, jumlah: req.jumlah } });
    return data as ManpowerRequest;
  }

  // Create new
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const year = now.getFullYear();

  // Get count for sequence number
  const { count } = await supabaseAdmin
    .from('manpower_requests')
    .select('*', { count: 'exact', head: true });

  const seq = String((count || 0) + 1).padStart(3, '0');
  const no_request = `MR/${month}/${year}/${seq}`;
  const id = `mr-${Date.now()}`;

  const { data, error } = await supabaseAdmin
    .from('manpower_requests')
    .insert({
      id,
      no_request,
      tanggal: req.tanggal,
      divisi: req.divisi,
      pemohon: req.pemohon,
      jabatan_pemohon: req.jabatan_pemohon,
      atasan_pemohon: req.atasan_pemohon,
      posisi: req.posisi,
      jumlah: req.jumlah,
      lokasi: req.lokasi,
      tanggal_dibutuhkan: req.tanggal_dibutuhkan,
      jenis_kebutuhan: req.jenis_kebutuhan,
      replacement_name: req.replacement_name || null,
      status_karyawan: req.status_karyawan,
      urgensi: req.urgensi,
      alasan: req.alasan,
      jobdesk: req.jobdesk,
      kualifikasi: req.kualifikasi,
      range_gaji: req.range_gaji,
      benefit: req.benefit,
      status: 'submitted',
      approval_user_at: now.toISOString().split('T')[0],
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal simpan: ${error.message}`);
  logActivity({ action: 'CREATE', table_name: 'manpower_requests', record_id: id, description: `Manpower request baru ${no_request} dibuat - posisi: ${req.posisi} oleh ${req.pemohon}`, details: { no_request, posisi: req.posisi, divisi: req.divisi, pemohon: req.pemohon } });
  return data as ManpowerRequest;
}

export async function approveManpowerRequest(id: string, role: 'hrga' | 'management'): Promise<ManpowerRequest | undefined> {
  const nowStr = new Date().toISOString().split('T')[0];

  const update: Record<string, string> = {};
  if (role === 'hrga') {
    update.status = 'verified';
    update.approval_hrga_at = nowStr;
  } else if (role === 'management') {
    update.status = 'approved';
    update.approval_management_at = nowStr;
  }

  console.log('approveManpowerRequest called:', { id, role, update });

  const { data, error } = await supabaseAdmin
    .from('manpower_requests')
    .update(update)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('approveManpowerRequest error:', JSON.stringify(error, null, 2));
    return undefined;
  }
  console.log('approveManpowerRequest success:', data);
  logActivity({ action: 'UPDATE', table_name: 'manpower_requests', record_id: id, description: `Manpower request ${id} disetujui oleh ${role === 'hrga' ? 'HRGA' : 'Management'} - status: ${update.status}`, details: { role, new_status: update.status } });
  return data as ManpowerRequest;
}

export async function rejectManpowerRequest(id: string): Promise<ManpowerRequest | undefined> {
  const { data, error } = await supabaseAdmin
    .from('manpower_requests')
    .update({ status: 'rejected' })
    .eq('id', id)
    .select()
    .single();

  if (error) return undefined;
  logActivity({ action: 'UPDATE', table_name: 'manpower_requests', record_id: id, description: `Manpower request ${id} ditolak`, details: { new_status: 'rejected' } });
  return data as ManpowerRequest;
}

// ==========================================
// 2. CANDIDATE ACTIONS
// ==========================================

export async function getCandidates(): Promise<Candidate[]> {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('getCandidates error:', JSON.stringify(error, null, 2));
    return [];
  }
  console.log(`getCandidates: ${data?.length || 0} records`);
  return (data || []) as Candidate[];
}

export async function getCandidateById(id: string): Promise<Candidate | undefined> {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return undefined;
  return data as Candidate;
}

export async function getCandidateByToken(token: string): Promise<Candidate | undefined> {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .select('*')
    .eq('token', token)
    .single();

  if (error) return undefined;
  return data as Candidate;
}

export async function createCandidate(
  cand: Omit<Candidate, 'id' | 'token' | 'token_expires_at' | 'status' | 'created_at'>,
  options?: { sendEmail?: boolean; origin?: string }
): Promise<Candidate & { emailSent?: boolean; emailError?: string }> {
  const id = `cnd-${Date.now()}`;
  const token = `token-${Math.random().toString(36).substring(2, 15)}`;

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 14);
  const token_expires_at = expiry.toISOString().split('T')[0];

  const { data, error } = await supabaseAdmin
    .from('candidates')
    .insert({
      id,
      nama: cand.nama,
      email: cand.email,
      telepon: cand.telepon,
      posisi_dilamar: cand.posisi_dilamar,
      manpower_request_id: cand.manpower_request_id || null,
      token,
      token_expires_at,
      status: 'interview_user',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal buat kandidat: ${error.message}`);
  
  logActivity({ 
    action: 'CREATE', 
    table_name: 'candidates', 
    record_id: id, 
    description: `Kandidat baru "${cand.nama}" dibuat untuk posisi ${cand.posisi_dilamar}`, 
    details: { nama: cand.nama, email: cand.email, posisi_dilamar: cand.posisi_dilamar } 
  });

  const result = data as Candidate & { emailSent?: boolean; emailError?: string };

  if (options?.sendEmail && cand.email) {
    const origin = options.origin || 'http://localhost:3000';
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
  
  const link = `${origin}/disc/${candidate.token}`;
  
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
  // Ambil data sebelum update untuk logging
  const { data: current, error: fetchError } = await supabaseAdmin
    .from('candidates')
    .select('status, nama, email')
    .eq('id', id)
    .single();

  if (fetchError) {
    console.error('updateCandidateStatus: gagal ambil data kandidat:', fetchError.message);
  }

  const { data, error } = await supabaseAdmin
    .from('candidates')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('updateCandidateStatus: gagal update:', error.message);
    return undefined;
  }

  logActivity({ action: 'UPDATE', table_name: 'candidates', record_id: id, description: `Status kandidat ${current?.nama || id}: "${current?.status}" diubah menjadi "${status}"`, details: { old_status: current?.status, new_status: status, nama: current?.nama }, user_email: current?.email });
  return data as Candidate;
}

export async function saveCandidateBio(token: string, bio: { pendidikan: string; pengalaman: string; keahlian: string }): Promise<Candidate | undefined> {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .update({
      pendidikan: bio.pendidikan,
      pengalaman: bio.pengalaman,
      keahlian: bio.keahlian,
    })
    .eq('token', token)
    .select()
    .single();

  if (error) return undefined;
  logActivity({ action: 'UPDATE', table_name: 'candidates', record_id: data?.id || token, description: `Bio kandidat ${data?.nama || token} diperbarui`, details: { pendidikan: bio.pendidikan, pengalaman: bio.pengalaman }, user_email: data?.email });
  return data as Candidate;
}

// ==========================================
// 3. INTERVIEW EVALUATIONS (FR-HRGA-001.03)
// ==========================================

export async function getInterviewEvaluationByCandidate(candidateId: string): Promise<InterviewEvaluation | undefined> {
  const { data, error } = await supabaseAdmin
    .from('interview_evaluations')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();

  if (error) return undefined;
  return data as InterviewEvaluation;
}

export async function saveInterviewEvaluation(evalData: Omit<InterviewEvaluation, 'id'> & { id?: string }): Promise<InterviewEvaluation> {
  const payload: Record<string, unknown> = {
    candidate_id: evalData.candidate_id,
    tanggal: evalData.tanggal,
    tahap: evalData.tahap,
    interviewer: evalData.interviewer,
    metode: evalData.metode,
    ekspektasi_gaji: evalData.ekspektasi_gaji || null,
    ketersediaan_bergabung: evalData.ketersediaan_bergabung || null,
    penilaian: evalData.penilaian,
    total_skor: evalData.total_skor,
    kelebihan: evalData.kelebihan || null,
    area_digali: evalData.area_digali || null,
    catatan: evalData.catatan || null,
    rekomendasi: evalData.rekomendasi,
  };

  let query;
  if (evalData.id) {
    payload.id = evalData.id;
    query = supabaseAdmin.from('interview_evaluations').update(payload).eq('id', evalData.id);
  } else {
    payload.id = `ie-${Date.now()}`;
    query = supabaseAdmin.from('interview_evaluations').insert(payload);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Interview eval error:', JSON.stringify(error, null, 2));
    throw new Error(`Gagal simpan evaluasi: ${error.message}`);
  }

  const evalAction = evalData.id ? 'UPDATE' : 'CREATE';
  logActivity({ action: evalAction, table_name: 'interview_evaluations', record_id: data.id, description: `${evalAction === 'CREATE' ? 'Evaluasi interview baru' : 'Evaluasi interview diperbarui'} - tahap ${evalData.tahap} untuk kandidat ${evalData.candidate_id}`, details: { candidate_id: evalData.candidate_id, tahap: evalData.tahap, rekomendasi: evalData.rekomendasi, total_skor: evalData.total_skor } });
  return data as InterviewEvaluation;
}

// ==========================================
// 4. SELECTION TEST RESULTS (FR-HRGA-001.02)
// ==========================================

export async function getSelectionTestResultByCandidate(candidateId: string): Promise<SelectionTestResult | undefined> {
  const { data, error } = await supabaseAdmin
    .from('selection_test_results')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();

  if (error) return undefined;
  return data as SelectionTestResult;
}

export async function saveSelectionTestResult(resultData: Omit<SelectionTestResult, 'id'> & { id?: string }): Promise<SelectionTestResult> {
  const payload: Record<string, unknown> = {
    candidate_id: resultData.candidate_id,
    tanggal_tes: resultData.tanggal_tes,
    penyelenggara: resultData.penyelenggara,
    komponen: resultData.komponen,
    kesimpulan: resultData.kesimpulan,
    catatan_akhir: resultData.catatan_akhir || null,
  };

  let query;
  if (resultData.id) {
    payload.id = resultData.id;
    query = supabaseAdmin.from('selection_test_results').update(payload).eq('id', resultData.id);
  } else {
    payload.id = `st-${Date.now()}`;
    query = supabaseAdmin.from('selection_test_results').insert(payload);
  }

  const { data, error } = await query.select().single();

  if (error) {
    console.error('Selection test error:', JSON.stringify(error, null, 2));
    throw new Error(`Gagal simpan tes seleksi: ${error.message}`);
  }
  const testAction = resultData.id ? 'UPDATE' : 'CREATE';
  logActivity({ action: testAction, table_name: 'selection_test_results', record_id: data.id, description: `${testAction === 'CREATE' ? 'Hasil tes seleksi baru' : 'Hasil tes seleksi diperbarui'} - kandidat ${resultData.candidate_id}`, details: { candidate_id: resultData.candidate_id, kesimpulan: resultData.kesimpulan, penyelenggara: resultData.penyelenggara } });
  return data as SelectionTestResult;
}

// ==========================================
// 5. DISC TEST RESULTS
// ==========================================

export async function getDiscTestResultByCandidate(candidateId: string): Promise<DiscTestResult | undefined> {
  const { data, error } = await supabaseAdmin
    .from('disc_tests')
    .select('*')
    .eq('candidate_id', candidateId)
    .single();

  if (error) return undefined;
  return data as DiscTestResult;
}

export async function saveDiscTestResult(res: Omit<DiscTestResult, 'id'>): Promise<DiscTestResult> {
  // Check if DISC test already exists for this candidate
  const { data: existing } = await supabaseAdmin
    .from('disc_tests')
    .select('id')
    .eq('candidate_id', res.candidate_id)
    .maybeSingle();

  if (existing) {
    throw new Error('DISC_TEST_ALREADY_COMPLETED');
  }

  const id = `dt-${Date.now()}`;

  const payload = {
    id,
    candidate_id: res.candidate_id,
    answers: res.answers,
    skor_d: res.skor_d,
    skor_i: res.skor_i,
    skor_s: res.skor_s,
    skor_c: res.skor_c,
    persen_d: res.persen_d,
    persen_i: res.persen_i,
    persen_s: res.persen_s,
    persen_c: res.persen_c,
    tipe_primer: res.tipe_primer,
    tipe_sekunder: res.tipe_sekunder,
    completed_at: res.completed_at,
  };

  console.log('Saving DISC result:', JSON.stringify(payload, null, 2));

  const { data, error } = await supabaseAdmin
    .from('disc_tests')
    .insert(payload)
    .select()
    .single();

  if (error) {
    console.error('DISC insert error:', JSON.stringify(error, null, 2));
    throw new Error(`Gagal simpan DISC: ${error.message} (code: ${error.code})`);
  }

  logActivity({ action: 'CREATE', table_name: 'disc_tests', record_id: id, description: `Hasil tes DISC baru untuk kandidat ${res.candidate_id} - tipe primer: ${res.tipe_primer}`, details: { candidate_id: res.candidate_id, tipe_primer: res.tipe_primer, tipe_sekunder: res.tipe_sekunder } });
  return data as DiscTestResult;
}

// ==========================================
// 7. WPT TEST RESULTS
// ==========================================

export async function getWptTestResultByCandidate(candidateId: string): Promise<WptTestResult | undefined> {
  const { data, error } = await supabaseAdmin
    .from('wpt_tests')
    .select('*')
    .eq('candidate_id', candidateId)
    .maybeSingle();

  if (error) return undefined;
  return data as WptTestResult;
}

export async function saveWptTestResult(res: Omit<WptTestResult, 'id'>): Promise<WptTestResult> {
  const { data: existing } = await supabaseAdmin
    .from('wpt_tests')
    .select('id')
    .eq('candidate_id', res.candidate_id)
    .maybeSingle();

  if (existing) {
    throw new Error('WPT_TEST_ALREADY_COMPLETED');
  }

  const id = `wpt-${Date.now()}`;

  const payload = {
    id,
    candidate_id: res.candidate_id,
    answers: res.answers,
    skor: res.skor,
    total_soal: res.total_soal,
    persen_benar: res.persen_benar,
    kategori: res.kategori,
    profil_kemampuan: res.profil_kemampuan,
    rekomendasi_posisi: res.rekomendasi_posisi,
    completed_at: res.completed_at,
  };

  const { data, error } = await supabaseAdmin
    .from('wpt_tests')
    .insert(payload)
    .select()
    .single();

  if (error) {
    throw new Error(`Gagal simpan WPT: ${error.message}`);
  }

  logActivity({ action: 'CREATE', table_name: 'wpt_tests', record_id: id, description: `Hasil tes WPT baru untuk kandidat ${res.candidate_id} - skor: ${res.skor}/50 (${res.kategori})`, details: { candidate_id: res.candidate_id, skor: res.skor, kategori: res.kategori } });
  return data as WptTestResult;
}

function base64UrlEncode(str: string | Buffer): string {
  const base64 = typeof str === 'string' 
    ? Buffer.from(str).toString('base64') 
    : str.toString('base64');
  return base64
    .replace(/=/g, '')
    .replace(/\+/g, '-')
    .replace(/\//g, '_');
}

function signJWT(payload: object, secret: string): string {
  const header = { alg: 'HS256', typ: 'JWT' };
  const encodedHeader = base64UrlEncode(JSON.stringify(header));
  const encodedPayload = base64UrlEncode(JSON.stringify(payload));
  const tokenInput = `${encodedHeader}.${encodedPayload}`;
  const signature = crypto
    .createHmac('sha256', secret)
    .update(tokenInput)
    .digest();
  const encodedSignature = base64UrlEncode(signature);
  return `${tokenInput}.${encodedSignature}`;
}

export async function sendWhatsAppInvitation(
  candidateId: string,
  origin: string
): Promise<{ success: boolean; error?: string }> {
  const candidate = await getCandidateById(candidateId);
  if (!candidate) {
    return { success: false, error: 'KANDIDAT_TIDAK_DITEMUKAN' };
  }

  const webhookUrl = process.env.N8N_WHATSAPP_WEBHOOK_URL;
  if (!webhookUrl || webhookUrl.trim() === '') {
    return { success: false, error: 'WHATSAPP_WEBHOOK_NOT_CONFIGURED' };
  }

  const link = `${origin}/disc/${candidate.token}`;
  
  const message = `Halo ${candidate.nama},

Anda diundang untuk mengikuti tahapan asesmen di EasyLegal untuk posisi ${candidate.posisi_dilamar || 'Kandidat'}.

Silakan akses tautan berikut untuk memulai:
${link}

Atau Anda juga dapat masuk melalui halaman utama menggunakan Token Asesmen Anda:
Token: ${candidate.token}

Terima kasih,
Tim HR EasyLegal`;

  // Set up request headers
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  // Sign JWT if JWT Secret is configured
  const jwtSecret = process.env.N8N_JWT_SECRET;
  if (jwtSecret && jwtSecret.trim() !== '') {
    const now = Math.floor(Date.now() / 1000);
    const token = signJWT(
      {
        iss: 'easylegal-recruitment',
        iat: now,
        exp: now + 300, // Valid for 5 minutes
      },
      jwtSecret
    );
    headers['Authorization'] = `Bearer ${token}`;
  }

  try {
    const res = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        candidateId: candidate.id,
        candidateName: candidate.nama,
        candidatePhone: candidate.telepon || '',
        candidateEmail: candidate.email || '',
        position: candidate.posisi_dilamar || '',
        token: candidate.token,
        link,
        message,
      }),
    });

    if (!res.ok) {
      throw new Error(`n8n Webhook returned status ${res.status}`);
    }

    logActivity({
      action: 'UPDATE',
      table_name: 'candidates',
      record_id: candidateId,
      description: `Undangan WhatsApp dikirim via n8n ke "${candidate.nama}" (${candidate.telepon || 'tidak ada telepon'})`,
      details: { telepon: candidate.telepon || '' },
    });

    return { success: true };
  } catch (err) {
    console.error('Error in sendWhatsAppInvitation:', err);
    return { success: false, error: err instanceof Error ? err.message : 'WEBHOOK_FAILED' };
  }
}

