import { NextRequest, NextResponse } from 'next/server';
import { getEventSettings, setEventSettings } from '@/lib/db';

export async function GET() {
  try {
    return NextResponse.json(getEventSettings());
  } catch (err) {
    console.error('GET /api/events/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const current = getEventSettings();

    const updated = { ...current };
    if (typeof body.retentionDays === 'number' && body.retentionDays >= 1 && body.retentionDays <= 365) {
      updated.retentionDays = body.retentionDays;
    }
    if (typeof body.flappingCooldownMs === 'number' && Number.isFinite(body.flappingCooldownMs) && body.flappingCooldownMs >= 0 && body.flappingCooldownMs <= 86400000) {
      updated.flappingCooldownMs = body.flappingCooldownMs;
    }
    if (body.temperatureThresholds && typeof body.temperatureThresholds === 'object') {
      const t = body.temperatureThresholds;
      if (typeof t.warning === 'number' && typeof t.critical === 'number' &&
          Number.isFinite(t.warning) && Number.isFinite(t.critical) &&
          t.warning >= 0 && t.critical <= 200 && t.warning < t.critical) {
        updated.temperatureThresholds = { warning: t.warning, critical: t.critical };
      }
    }
    if (body.gpuTemperatureThresholds && typeof body.gpuTemperatureThresholds === 'object') {
      const t = body.gpuTemperatureThresholds;
      if (typeof t.warning === 'number' && typeof t.critical === 'number' &&
          Number.isFinite(t.warning) && Number.isFinite(t.critical) &&
          t.warning >= 0 && t.critical <= 200 && t.warning < t.critical) {
        updated.gpuTemperatureThresholds = { warning: t.warning, critical: t.critical };
      }
    }

    setEventSettings(updated);
    return NextResponse.json(updated);
  } catch (err) {
    console.error('POST /api/events/settings error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
