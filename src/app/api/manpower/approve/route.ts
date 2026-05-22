import { NextResponse } from 'next/server';
import { approveManpowerRequest, rejectManpowerRequest } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { id, action, role } = body;

    if (!id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (action === 'approve') {
      const result = await approveManpowerRequest(id, role || 'hrga');
      if (!result) {
        return NextResponse.json({ error: 'Gagal approve' }, { status: 500 });
      }
      return NextResponse.json(result);
    } else if (action === 'reject') {
      const result = await rejectManpowerRequest(id);
      if (!result) {
        return NextResponse.json({ error: 'Gagal reject' }, { status: 500 });
      }
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error) {
    console.error('Manpower approval error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
