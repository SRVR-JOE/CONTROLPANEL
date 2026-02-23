import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeEvents } from '@/lib/db';

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    if (!id) {
      return NextResponse.json({ error: 'Missing event id' }, { status: 400 });
    }

    acknowledgeEvents([id]);
    return NextResponse.json({ success: true, id });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
