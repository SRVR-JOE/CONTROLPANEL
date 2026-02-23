import { NextRequest, NextResponse } from 'next/server';
import { getEventSettings, setEventSettings } from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json(getEventSettings());
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getEventSettings();
    const updated = { ...current, ...body };
    setEventSettings(updated);
    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
