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
      const ids: string[] = body.eventIds
        .filter((x: unknown) => typeof x === 'string')
        .slice(0, 500);
      if (ids.length === 0) {
        return NextResponse.json({ error: 'eventIds must contain valid string IDs' }, { status: 400 });
      }
      acknowledgeEvents(ids);
      return NextResponse.json({ success: true, acknowledged: ids.length });
    }

    return NextResponse.json({ error: 'Provide eventIds array or { all: true }' }, { status: 400 });
  } catch (err) {
    console.error('POST /api/events/acknowledge error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
