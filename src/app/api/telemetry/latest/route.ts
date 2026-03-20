import { NextResponse } from 'next/server';
import { telemetryService } from '@/lib/telemetry-service';

export async function GET() {
  try {
    const snapshot = telemetryService.getLatest();
    return NextResponse.json({ snapshot });
  } catch (err) {
    console.error('[Telemetry/latest]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST() {
  try {
    const snapshot = await telemetryService.takeSnapshot();
    return NextResponse.json({ snapshot });
  } catch (err) {
    console.error('[Telemetry/latest]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
