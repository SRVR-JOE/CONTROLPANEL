import { NextRequest, NextResponse } from 'next/server';
import { acknowledgeEvents, acknowledgeAllEvents } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (body.all === true) {
      acknowledgeAllEvents();
      return NextResponse.json({ success: true, message: 'All events acknowledged' });
    }

    if (body.eventIds && Array.isArray(body.eventIds) && body.eventIds.length > 0) {
      acknowledgeEvents(body.eventIds);
      return NextResponse.json({ success: true, acknowledged: body.eventIds.length });
    }

    return NextResponse.json({ error: 'Provide eventIds array or { all: true }' }, { status: 400 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
