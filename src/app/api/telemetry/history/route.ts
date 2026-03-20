import { NextRequest, NextResponse } from 'next/server';
import { telemetryService } from '@/lib/telemetry-service';
import type { TimeRange } from '@/lib/telemetry-types';

const RANGE_TO_MS: Record<TimeRange, number> = {
  '5m': 5 * 60 * 1000,
  '15m': 15 * 60 * 1000,
  '1h': 60 * 60 * 1000,
  '6h': 6 * 60 * 60 * 1000,
  '24h': 24 * 60 * 60 * 1000,
};

const VALID_RANGES = Object.keys(RANGE_TO_MS);

export async function GET(request: NextRequest) {
  try {
    const range = (request.nextUrl.searchParams.get('range') ?? '1h') as TimeRange;

    if (!VALID_RANGES.includes(range)) {
      return NextResponse.json(
        { error: `Invalid range "${range}". Must be one of: ${VALID_RANGES.join(', ')}` },
        { status: 400 }
      );
    }

    const sinceMs = Date.now() - RANGE_TO_MS[range];
    const snapshots = telemetryService.getHistory(sinceMs);

    return NextResponse.json({ range, snapshots });
  } catch (err) {
    console.error('[Telemetry/history]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
