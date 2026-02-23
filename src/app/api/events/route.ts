import { NextRequest, NextResponse } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { queryEvents, insertEvent, deleteOldEvents, getEventSettings } from '@/lib/db';
import type { EventQueryParams, SystemEvent } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;

    const params: EventQueryParams = {
      page: parseInt(searchParams.get('page') || '1', 10),
      pageSize: parseInt(searchParams.get('pageSize') || '50', 10),
    };

    const eventTypes = searchParams.get('eventTypes');
    if (eventTypes) params.eventTypes = eventTypes.split(',') as EventQueryParams['eventTypes'];

    const severities = searchParams.get('severities');
    if (severities) params.severities = severities.split(',') as EventQueryParams['severities'];

    const deviceIds = searchParams.get('deviceIds');
    if (deviceIds) params.deviceIds = deviceIds.split(',');

    const search = searchParams.get('search');
    if (search) params.search = search;

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
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const event: SystemEvent = {
      id: body.id || uuidv4(),
      deviceId: body.deviceId,
      deviceName: body.deviceName,
      eventType: body.eventType,
      severity: body.severity,
      title: body.title,
      message: body.message,
      metadata: body.metadata || {},
      acknowledged: false,
      createdAt: body.createdAt || new Date().toISOString(),
    };

    if (!event.deviceId || !event.eventType || !event.severity || !event.title) {
      return NextResponse.json({ error: 'Missing required fields: deviceId, eventType, severity, title' }, { status: 400 });
    }

    insertEvent(event);
    return NextResponse.json(event, { status: 201 });
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 });
  }
}
