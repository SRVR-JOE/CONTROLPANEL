import { NextRequest, NextResponse } from 'next/server';
import { telemetryService } from '@/lib/telemetry-service';
import type { TrackedDevice } from '@/lib/telemetry-service';
import type { DeviceManufacturer } from '@/types';

interface SetDevicesBody {
  deviceIds?: string[];
  devices?: TrackedDevice[];
}

export async function POST(request: NextRequest) {
  try {
    const body: SetDevicesBody = await request.json();

    // Accept either a full devices array (preferred) or plain deviceIds
    if (body.devices && Array.isArray(body.devices)) {
      // Full device descriptors — validate minimally
      for (const d of body.devices) {
        if (!d.id || !d.ip || !d.manufacturer) {
          return NextResponse.json(
            { error: 'Each device must include id, ip, and manufacturer' },
            { status: 400 }
          );
        }
      }
      telemetryService.setDevices(body.devices);
    } else if (body.deviceIds && Array.isArray(body.deviceIds)) {
      // Plain IDs — the caller is expected to resolve them client-side;
      // we store stubs until the next call with full device info.
      const tracked: TrackedDevice[] = body.deviceIds.map((id) => ({
        id,
        name: id,
        ip: '',
        manufacturer: 'disguise' as DeviceManufacturer,
      }));
      telemetryService.setDevices(tracked);
    } else {
      return NextResponse.json(
        { error: 'Request body must include "devices" (array of TrackedDevice) or "deviceIds" (string[])' },
        { status: 400 }
      );
    }

    // Start polling if not already running
    if (!telemetryService.isRunning) {
      telemetryService.start();
    }

    return NextResponse.json({
      ok: true,
      tracking: telemetryService.getTrackedDeviceIds(),
      running: telemetryService.isRunning,
    });
  } catch (err) {
    console.error('[Telemetry/servers]', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
