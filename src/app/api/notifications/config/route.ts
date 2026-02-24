import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { getNotificationConfigs, upsertNotificationConfig, deleteNotificationConfig } from '@/lib/db';
import type { NotificationChannelConfig } from '@/types';

export async function GET() {
  try {
    return NextResponse.json(getNotificationConfigs());
  } catch (err) {
    console.error('GET /api/notifications/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

const VALID_CHANNELS = ['email', 'sms', 'slack', 'discord', 'in_app'] as const;
const VALID_EVENT_TYPES = ['status_change', 'temperature_alert', 'signal_loss', 'power_event'] as const;
const VALID_SEVERITIES = ['info', 'warning', 'error', 'critical'] as const;

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!body.channel || !VALID_CHANNELS.includes(body.channel)) {
      return NextResponse.json({ error: `Invalid or missing channel. Must be one of: ${VALID_CHANNELS.join(', ')}` }, { status: 400 });
    }

    // Validate webhook URLs to only allow known Slack/Discord hostnames
    const channelConfig: Record<string, unknown> = body.config || {};
    if (body.channel === 'slack' || body.channel === 'discord') {
      const webhookUrl = channelConfig.webhookUrl as string | undefined;
      if (webhookUrl) {
        let parsed: URL;
        try { parsed = new URL(webhookUrl); } catch { return NextResponse.json({ error: 'Invalid webhook URL format' }, { status: 400 }); }
        if (parsed.protocol !== 'https:') {
          return NextResponse.json({ error: 'Webhook URL must use HTTPS' }, { status: 400 });
        }
        const allowedHostnames = body.channel === 'slack'
          ? ['hooks.slack.com']
          : ['discord.com', 'discordapp.com'];
        if (!allowedHostnames.includes(parsed.hostname)) {
          return NextResponse.json({ error: `Invalid ${body.channel} webhook URL hostname. Must be one of: ${allowedHostnames.join(', ')}` }, { status: 400 });
        }
      }
    }

    // Filter eventTypes and severities to only valid values
    const rawEventTypes: unknown[] = Array.isArray(body.eventTypes)
      ? body.eventTypes
      : ['status_change', 'temperature_alert', 'signal_loss', 'power_event'];
    const filteredEventTypes = rawEventTypes.filter(
      (v): v is typeof VALID_EVENT_TYPES[number] => VALID_EVENT_TYPES.includes(v as typeof VALID_EVENT_TYPES[number])
    );

    const rawSeverities: unknown[] = Array.isArray(body.severities)
      ? body.severities
      : ['warning', 'error', 'critical'];
    const filteredSeverities = rawSeverities.filter(
      (v): v is typeof VALID_SEVERITIES[number] => VALID_SEVERITIES.includes(v as typeof VALID_SEVERITIES[number])
    );

    // Enforce rateLimitMs minimum of 1000ms
    const rawRateLimitMs = body.rateLimitMs ?? 300000;
    const rateLimitMs = Math.max(1000, Math.floor(typeof rawRateLimitMs === 'number' ? rawRateLimitMs : 300000));

    if (JSON.stringify(channelConfig).length > 10000) {
      return NextResponse.json({ error: 'config exceeds maximum size' }, { status: 400 });
    }

    const cfg: NotificationChannelConfig = {
      id: (typeof body.id === 'string' && body.id.length > 0 && body.id.length <= 100) ? body.id : uuidv4(),
      channel: body.channel,
      enabled: body.enabled ?? false,
      config: channelConfig,
      eventTypes: filteredEventTypes.length > 0 ? filteredEventTypes : ['status_change', 'temperature_alert', 'signal_loss', 'power_event'],
      severities: filteredSeverities.length > 0 ? filteredSeverities : ['warning', 'error', 'critical'],
      rateLimitMs,
    };

    upsertNotificationConfig(cfg);
    return NextResponse.json(cfg);
  } catch (err) {
    console.error('POST /api/notifications/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
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
    console.error('DELETE /api/notifications/config error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
