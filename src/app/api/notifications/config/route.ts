import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getNotificationConfigs, upsertNotificationConfig, deleteNotificationConfig } from '@/lib/db';
import type { NotificationChannelConfig } from '@/types';

export async function GET() {
  try {
    return NextResponse.json(getNotificationConfigs());
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const cfg: NotificationChannelConfig = {
      id: body.id || uuidv4(),
      channel: body.channel,
      enabled: body.enabled ?? false,
      config: body.config || {},
      eventTypes: body.eventTypes || ['status_change', 'temperature_alert', 'signal_loss', 'power_event'],
      severities: body.severities || ['warning', 'error', 'critical'],
      rateLimitMs: body.rateLimitMs ?? 300000,
    };

    if (!cfg.channel) {
      return NextResponse.json({ error: 'Missing required field: channel' }, { status: 400 });
    }

    upsertNotificationConfig(cfg);
    return NextResponse.json(cfg);
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'Missing id parameter' }, { status: 400 });
    }
    deleteNotificationConfig(id);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
