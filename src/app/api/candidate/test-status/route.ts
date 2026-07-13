import { NextRequest, NextResponse } from 'next/server';
import {
  getDiscTestResultByCandidate,
  getWptTestResultByCandidate,
  getKoranTestResultByCandidate,
} from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const candidateId = searchParams.get('candidateId');
    if (!candidateId) {
      return NextResponse.json({ error: 'candidateId is required' }, { status: 400 });
    }

    const [disc, wpt, koran] = await Promise.all([
      getDiscTestResultByCandidate(candidateId),
      getWptTestResultByCandidate(candidateId),
      getKoranTestResultByCandidate(candidateId),
    ]);

    return NextResponse.json({
      success: true,
      hasDisc: !!disc,
      hasWpt: !!wpt,
      hasKoran: !!koran,
    });
  } catch (error) {
    console.error('Check test status error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
