import { NextRequest, NextResponse } from 'next/server';
import { telemetryService } from '@/lib/telemetry-service';

interface ConfigBody {
  pollIntervalMs?: number;
  retentionMs?: number;
}

export async function GET() {
  try {
    return NextResponse.json({ config: telemetryService.config });
  } catch (err) {
    console.error('[Telemetry/config]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body: ConfigBody = await request.json();

    if (body.pollIntervalMs !== undefined) {
      if (typeof body.pollIntervalMs !== 'number' || body.pollIntervalMs < 1000) {
        return NextResponse.json(
          { error: 'pollIntervalMs must be a number >= 1000' },
          { status: 400 }
        );
      }
      telemetryService.config.pollIntervalMs = body.pollIntervalMs;
    }

    if (body.retentionMs !== undefined) {
      if (typeof body.retentionMs !== 'number' || body.retentionMs < 60_000) {
        return NextResponse.json(
          { error: 'retentionMs must be a number >= 60000' },
          { status: 400 }
        );
      }
      telemetryService.config.retentionMs = body.retentionMs;
    }

    // Restart polling with new interval if currently running
    if (telemetryService.isRunning) {
      telemetryService.start(telemetryService.config.pollIntervalMs);
    }

    return NextResponse.json({ ok: true, config: telemetryService.config });
  } catch (err) {
    console.error('[Telemetry/config]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
