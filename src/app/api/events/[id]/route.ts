import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeEvents } from '@/lib/db';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id || typeof id !== 'string' || id.length > 100) {
      return NextResponse.json({ error: 'Invalid event id' }, { status: 400 });
    }

    acknowledgeEvents([id]);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    console.error('PATCH /api/events/[id] error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
