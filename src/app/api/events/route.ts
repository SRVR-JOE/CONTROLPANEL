import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { queryEvents, insertEvent, deleteOldEvents, getEventSettings } from '@/lib/db';
import type { EventQueryParams, SystemEvent } from '@/types';

const VALID_EVENT_TYPES = ['status_change', 'temperature_alert', 'signal_loss', 'power_event'];
const VALID_SEVERITIES = ['info', 'warning', 'error', 'critical'];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const rawPage = parseInt(searchParams.get('page') || '1', 10);
    const rawPageSize = parseInt(searchParams.get('pageSize') || '50', 10);

    const params: EventQueryParams = {
      page: Math.max(1, isNaN(rawPage) ? 1 : rawPage),
      pageSize: Math.min(200, Math.max(1, isNaN(rawPageSize) ? 50 : rawPageSize)),
    };

    const eventTypes = searchParams.get('eventTypes');
    if (eventTypes) params.eventTypes = eventTypes.split(',').filter(v => VALID_EVENT_TYPES.includes(v)) as EventQueryParams['eventTypes'];

    const severities = searchParams.get('severities');
    if (severities) params.severities = severities.split(',').filter(v => VALID_SEVERITIES.includes(v)) as EventQueryParams['severities'];

    const deviceIds = searchParams.get('deviceIds');
    if (deviceIds) params.deviceIds = deviceIds.split(',').slice(0, 100);

    const search = searchParams.get('search');
    if (search) params.search = search.slice(0, 200);

    const startDate = searchParams.get('startDate');
    if (startDate) params.startDate = startDate;

    const endDate = searchParams.get('endDate');
    if (endDate) params.endDate = endDate;

    // Trigger retention cleanup on read
    const settings = getEventSettings();
    deleteOldEvents(settings.retentionDays);

    const result = queryEvents(params);
    return NextResponse.json(result);
  } catch (err) {
    console.error('GET /api/events error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    if (!VALID_EVENT_TYPES.includes(body.eventType)) {
      return NextResponse.json({ error: `Invalid eventType. Must be one of: ${VALID_EVENT_TYPES.join(', ')}` }, { status: 400 });
    }
    if (!VALID_SEVERITIES.includes(body.severity)) {
      return NextResponse.json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` }, { status: 400 });
    }

    if (typeof body.deviceId !== 'string' || body.deviceId.length === 0 || body.deviceId.length > 500) {
      return NextResponse.json({ error: 'deviceId must be a string with length between 1 and 500' }, { status: 400 });
    }
    if (typeof body.title !== 'string' || body.title.length === 0 || body.title.length > 500) {
      return NextResponse.json({ error: 'title must be a string with length between 1 and 500' }, { status: 400 });
    }
    if (typeof body.message !== 'string' || body.message.length === 0 || body.message.length > 500) {
      return NextResponse.json({ error: 'message must be a string with length between 1 and 500' }, { status: 400 });
    }
    if (body.deviceName !== undefined) {
      if (typeof body.deviceName !== 'string' || body.deviceName.length > 200) {
        return NextResponse.json({ error: 'deviceName must be a string with length <= 200' }, { status: 400 });
      }
    }
    if (body.metadata !== undefined) {
      if (typeof body.metadata !== 'object' || body.metadata === null || Array.isArray(body.metadata)) {
        return NextResponse.json({ error: 'metadata must be an object' }, { status: 400 });
      }
      if (JSON.stringify(body.metadata).length > 10000) {
        return NextResponse.json({ error: 'metadata exceeds maximum allowed size of 10000 characters' }, { status: 400 });
      }
    }

    const event: SystemEvent = {
      id: uuidv4(),
      deviceId: body.deviceId,
      deviceName: body.deviceName || body.deviceId,
      eventType: body.eventType,
      severity: body.severity,
      title: body.title,
      message: body.message,
      metadata: body.metadata || {},
      acknowledged: false,
      createdAt: new Date().toISOString(),
    };

    insertEvent(event);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    console.error('POST /api/events error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
