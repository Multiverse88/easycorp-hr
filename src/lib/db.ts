'use server';

import { supabaseAdmin } from '@/lib/supabase/admin';

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
  status: 'screening' | 'interview' | 'psikotes' | 'offering' | 'hired' | 'rejected';
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

export async function createCandidate(cand: Omit<Candidate, 'id' | 'token' | 'token_expires_at' | 'status' | 'created_at'>): Promise<Candidate> {
  const id = `cnd-${Date.now()}`;
  const token = `token-${Math.random().toString(36).substring(2, 15)}`;

  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 14);

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
      token_expires_at: expiry.toISOString().split('T')[0],
      status: 'screening',
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Gagal buat kandidat: ${error.message}`);
  return data as Candidate;
}

export async function updateCandidateStatus(id: string, status: Candidate['status']): Promise<Candidate | undefined> {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .update({ status })
    .eq('id', id)
    .select()
    .single();

  if (error) return undefined;
  return data as Candidate;
}

export async function saveCandidateBio(token: string, bio: { pendidikan: string; pengalaman: string; keahlian: string }): Promise<Candidate | undefined> {
  const { data, error } = await supabaseAdmin
    .from('candidates')
    .update({
      pendidikan: bio.pendidikan,
      pengalaman: bio.pengalaman,
      keahlian: bio.keahlian,
      status: 'psikotes',
    })
    .eq('token', token)
    .select()
    .single();

  if (error) return undefined;
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

  // Update candidate status to 'interview' if currently 'psikotes'
  const candidate = await getCandidateById(evalData.candidate_id);
  if (candidate && candidate.status === 'psikotes') {
    await supabaseAdmin
      .from('candidates')
      .update({ status: 'interview' })
      .eq('id', evalData.candidate_id);
  }

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
  // Delete existing test if any
  const { error: deleteError } = await supabaseAdmin
    .from('disc_tests')
    .delete()
    .eq('candidate_id', res.candidate_id);

  if (deleteError) {
    console.error('DISC delete error:', deleteError);
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

  // Update candidate status to 'interview'
  await supabaseAdmin
    .from('candidates')
    .update({ status: 'interview' })
    .eq('id', res.candidate_id);

  return data as DiscTestResult;
}
