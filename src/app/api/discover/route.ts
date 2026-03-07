import { NextRequest, NextResponse } from 'next/server';
import { isAllowedTarget } from '@/lib/validateIp';
import type { DiscoveredDevice } from '@/types';

interface DiscoverRequest { subnet: string; rangeStart: number; rangeEnd: number; port?: number; }

const PROBE_TIMEOUT_MS = 2000;
const PROBE_PORTS = [80, 443, 5253, 9990];

/**
 * Attempt an HTTP GET to the given URL with a short timeout.
 * Returns the response text on success, null on failure.
 */
async function probeHttp(url: string): Promise<{ ok: boolean; body: string } | null> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), PROBE_TIMEOUT_MS);
  try {
    const res = await fetch(url, { signal: controller.signal, method: 'GET' });
    const body = await res.text().catch(() => '');
    return { ok: res.ok, body };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Try to identify a device from its HTTP response body and headers.
 */
function identifyDevice(_ip: string, port: number, body: string): Partial<DiscoveredDevice> {
  const lowerBody = body.toLowerCase();

  // AJA Kumo
  if (lowerBody.includes('eparamid_') || lowerBody.includes('aja') || lowerBody.includes('kumo')) {
    return { manufacturer: 'aja', model: 'KUMO', category: 'matrix-switcher', httpSignature: 'AJA Kumo REST API' };
  }

  // Ross OpenGear / DashBoard
  if (lowerBody.includes('opengear') || lowerBody.includes('ross') || lowerBody.includes('dashboard') || port === 5253) {
    return { manufacturer: 'ross', model: 'openGear Frame', category: 'opengear-frame', httpSignature: 'Ross openGear' };
  }

  // Brainstorm
  if (lowerBody.includes('brainstorm') || lowerBody.includes('timecode') || lowerBody.includes('dxd') || lowerBody.includes('sr-112')) {
    const isDXD = lowerBody.includes('dxd');
    return {
      manufacturer: 'brainstorm',
      model: isDXD ? 'DXD-8' : 'SR-112',
      category: isDXD ? 'master-clock' : 'timecode-analyzer',
      httpSignature: 'Brainstorm Electronics',
    };
  }

  // Barco ImagePro
  if (lowerBody.includes('barco') || lowerBody.includes('imagepro') || lowerBody.includes('image pro')) {
    return { manufacturer: 'barco', model: 'ImagePro 4K', category: 'video-processor', httpSignature: 'Barco ImagePro' };
  }

  // Blackmagic
  if (lowerBody.includes('blackmagic') || lowerBody.includes('videohub') || port === 9990) {
    return { manufacturer: 'blackmagic', model: 'Videohub', category: 'matrix-switcher', httpSignature: 'Blackmagic Design' };
  }

  // disguise
  if (lowerBody.includes('disguise') || lowerBody.includes('d3net')) {
    return { manufacturer: 'disguise', model: 'd3 Server', category: 'media-server', httpSignature: 'disguise' };
  }

  // Brompton
  if (lowerBody.includes('brompton') || lowerBody.includes('tessera')) {
    return { manufacturer: 'brompton', model: 'Tessera', category: 'led-processor', httpSignature: 'Brompton Technology' };
  }

  return {};
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoverRequest = await request.json();
    const { subnet, rangeStart, rangeEnd } = body;

    if (!subnet || rangeStart == null || rangeEnd == null) {
      return NextResponse.json({ error: 'Missing required fields: subnet, rangeStart, rangeEnd' }, { status: 400 });
    }

    const subnetRegex = /^(\d{1,3}\.){2}\d{1,3}$/;
    if (!subnetRegex.test(subnet) || subnet.split('.').some((o: string) => parseInt(o) > 255)) {
      return NextResponse.json({ error: `Invalid subnet format: ${subnet}. Expected format: "10.0.0"` }, { status: 400 });
    }
    if (rangeStart < 0 || rangeStart > 254 || rangeEnd < 0 || rangeEnd > 254) {
      return NextResponse.json({ error: 'Range values must be between 0 and 254' }, { status: 400 });
    }
    if (rangeStart > rangeEnd) {
      return NextResponse.json({ error: 'rangeStart must be less than or equal to rangeEnd' }, { status: 400 });
    }
    if (rangeEnd - rangeStart > 254) {
      return NextResponse.json({ error: 'Range too large, max 254 addresses per scan' }, { status: 400 });
    }

    const probeIp = `${subnet}.${rangeStart}`;
    if (!isAllowedTarget(probeIp)) {
      return NextResponse.json({ error: `Subnet "${subnet}" resolves to a disallowed address range` }, { status: 400 });
    }

    const rangeSize = rangeEnd - rangeStart + 1;
    const devices: DiscoveredDevice[] = [];

    // Probe all IPs in range concurrently, each IP across all probe ports
    const probePromises: Promise<void>[] = [];

    for (let octet = rangeStart; octet <= rangeEnd; octet++) {
      const ip = `${subnet}.${octet}`;
      if (!isAllowedTarget(ip)) continue;

      probePromises.push(
        (async () => {
          const openPorts: number[] = [];
          let bestMatch: Partial<DiscoveredDevice> = {};
          let responded = false;

          // Probe each port in parallel for this IP
          const portResults = await Promise.all(
            PROBE_PORTS.map(async (port) => {
              const url = port === 443 ? `https://${ip}/` : `http://${ip}:${port}/`;
              const result = await probeHttp(url);
              return { port, result };
            })
          );

          for (const { port, result } of portResults) {
            if (result) {
              openPorts.push(port);
              responded = true;
              // Use the first successful identification
              if (!bestMatch.manufacturer && result.body) {
                bestMatch = identifyDevice(ip, port, result.body);
              }
            }
          }

          if (responded) {
            devices.push({
              ip,
              openPorts,
              discoveredAt: new Date().toISOString(),
              ...bestMatch,
            });
          }
        })()
      );
    }

    await Promise.all(probePromises);

    // Sort by IP (last octet)
    devices.sort((a, b) => {
      const aOctet = parseInt(a.ip.split('.').pop() ?? '0');
      const bOctet = parseInt(b.ip.split('.').pop() ?? '0');
      return aOctet - bOctet;
    });

    return NextResponse.json({
      subnet,
      rangeStart,
      rangeEnd,
      totalScanned: rangeSize,
      devicesFound: devices.length,
      devices,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json({ error: 'Scan failed', details: String(err) }, { status: 500 });
  }
}
