'use server';

import { redirect } from 'next/navigation';
import { 
  getPapikostikSessionByToken, 
  updatePapikostikSession, 
  createPapikostikSession,
  PapikostikSession 
} from '@/lib/db';
import { calculatePapikostik, AnswerKey } from '@/lib/papikostik-scorer';

export async function submitPapikostikPage(
  token: string,
  page: number,
  formData: FormData
) {
  // 1. Fetch Session
  const session = await getPapikostikSessionByToken(token);
  if (!session || session.status === 'COMPLETED') {
    return { error: 'Test session is invalid or already completed.' };
  }

  // 2. Extract Answers
  const newAnswers: Record<string, AnswerKey> = {};
  const startIndex = (page - 1) * 10 + 1;
  const endIndex = Math.min(page * 10, 90);

  for (let i = startIndex; i <= endIndex; i++) {
    const val = formData.get(`q_${i}`);
    if (val === 'a' || val === 'b') {
      newAnswers[i.toString()] = val;
    } else {
      return { error: `Question ${i} is missing.` };
    }
  }

  // 3. Merge Answers
  const mergedAnswers = {
    ...session.answers,
    ...newAnswers
  };

  // 4. Check if final page
  if (page >= 9) {
    // Score the test
    const results = calculatePapikostik(mergedAnswers);
    
    await updatePapikostikSession(session.id, {
      answers: mergedAnswers,
      results: results,
      status: 'COMPLETED'
    });

    redirect(`/koran/${token}`);
  } else {
    // 5. Update and go to next page
    await updatePapikostikSession(session.id, {
      answers: mergedAnswers,
      current_page: page + 1
    });

    redirect(`/papikostik/${token}`);
  }
}

export async function generatePapikostikLink(candidateId: string) {
  try {
    const session = await createPapikostikSession(candidateId);
    return { success: true, token: session.token };
  } catch (error: any) {
    return { error: error.message };
  }
}

