import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/discover
 *
 * Scans a subnet range for disguise servers by probing each IP
 * on the specified port for a d3 API response.
 *
 * In production this would:
 *  1. For each IP in range, attempt HTTP GET to http://{ip}:{port}/api/session/status
 *  2. Parse the d3 API response for hostname, role, version, etc.
 *  3. Optionally use mDNS/SSDP for zero-config discovery
 *
 * Currently simulates discovery with realistic machine data.
 */

interface DiscoverRequest {
  subnet: string;       // e.g. "10.0.0"
  rangeStart: number;   // e.g. 1
  rangeEnd: number;     // e.g. 254
  port: number;         // e.g. 80
}

const MODELS = ['GX 3', 'GX 3c', 'VX 4', 'VX 4+', 'VX 2'] as const;
const GPUS = ['NVIDIA RTX A6000', 'NVIDIA RTX 4090', 'NVIDIA RTX A4500', 'NVIDIA Quadro RTX 8000'];
const PROJECTS = ['Illuminate 2026', 'Stadium Tour', 'Corporate Keynote', 'Festival Main Stage', null];
const VERSIONS = ['r27.1', 'r27.0', 'r26.4', 'r25.3'];

function generateMachine(ip: string, port: number) {
  const lastOctet = parseInt(ip.split('.').pop() ?? '0');
  const seed = lastOctet * 13 + 7; // deterministic pseudo-random

  // Role based on IP convention: .11 = director, .12-.19 = actors, .20+ = understudies
  const role = lastOctet <= 11 ? 'director' as const :
               lastOctet <= 19 ? 'actor' as const :
               'understudy' as const;

  const rolePrefix = role === 'director' ? 'DIR' :
                     role === 'actor' ? `ACT-${lastOctet - 11}` :
                     `US-${lastOctet - 19}`;

  return {
    ip,
    hostname: `D3-${rolePrefix}`,
    model: MODELS[seed % MODELS.length],
    role,
    designerVersion: VERSIONS[seed % VERSIONS.length],
    apiPort: port,
    workgroup: 'DISGUISE',
    uptime: Math.floor((seed * 3571) % 864000),
    d3ServiceRunning: seed % 5 !== 0, // ~80% have d3 running
    gpuName: GPUS[seed % GPUS.length],
    currentProject: PROJECTS[seed % PROJECTS.length],
    discoveredAt: new Date().toISOString(),
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: DiscoverRequest = await request.json();
    const { subnet, rangeStart, rangeEnd, port } = body;

    if (!subnet || rangeStart == null || rangeEnd == null) {
      return NextResponse.json(
        { error: 'Missing required fields: subnet, rangeStart, rangeEnd' },
        { status: 400 }
      );
    }

    // Validate subnet format (e.g. "10.0.0" or "192.168.1")
    const subnetRegex = /^(\d{1,3}\.){2}\d{1,3}$/;
    if (!subnetRegex.test(subnet) || subnet.split('.').some((o: string) => parseInt(o) > 255)) {
      return NextResponse.json(
        { error: `Invalid subnet format: ${subnet}. Expected format: "10.0.0"` },
        { status: 400 }
      );
    }

    // Validate range values
    if (rangeStart < 0 || rangeStart > 254 || rangeEnd < 0 || rangeEnd > 254) {
      return NextResponse.json(
        { error: 'Range values must be between 0 and 254' },
        { status: 400 }
      );
    }

    if (rangeStart > rangeEnd) {
      return NextResponse.json(
        { error: 'rangeStart must be less than or equal to rangeEnd' },
        { status: 400 }
      );
    }

    if (rangeEnd - rangeStart > 254) {
      return NextResponse.json(
        { error: 'Range too large, max 254 addresses per scan' },
        { status: 400 }
      );
    }

    // Validate port
    const scanPort = port || 80;
    if (scanPort < 1 || scanPort > 65535) {
      return NextResponse.json(
        { error: `Invalid port: ${port}. Must be between 1 and 65535.` },
        { status: 400 }
      );
    }

    // Simulate network scan delay (scales with range size)
    const rangeSize = rangeEnd - rangeStart + 1;
    const scanDelay = Math.min(5000, rangeSize * 15 + 500);
    await new Promise((resolve) => setTimeout(resolve, scanDelay));

    // In production:
    // const machines = [];
    // for (let i = rangeStart; i <= rangeEnd; i++) {
    //   const ip = `${subnet}.${i}`;
    //   try {
    //     const res = await fetch(`http://${ip}:${port}/api/session/status`, {
    //       signal: AbortSignal.timeout(2000),
    //     });
    //     if (res.ok) {
    //       const data = await res.json();
    //       machines.push(parseD3Response(ip, port, data));
    //     }
    //   } catch { /* host not responding */ }
    // }

    // Simulate: pick some IPs in the range that "respond"
    const machines = [];
    // Always find machines at common disguise IPs
    const commonOctets = [11, 12, 13, 14, 15, 20];
    for (const octet of commonOctets) {
      if (octet >= rangeStart && octet <= rangeEnd) {
        machines.push(generateMachine(`${subnet}.${octet}`, port));
      }
    }

    // Randomly find 0-2 extra machines
    const extraCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < extraCount; i++) {
      const octet = rangeStart + Math.floor(Math.random() * rangeSize);
      if (!commonOctets.includes(octet) && octet >= rangeStart && octet <= rangeEnd) {
        machines.push(generateMachine(`${subnet}.${octet}`, port));
      }
    }

    // Sort by IP
    machines.sort((a, b) => {
      const aOctet = parseInt(a.ip.split('.').pop() ?? '0');
      const bOctet = parseInt(b.ip.split('.').pop() ?? '0');
      return aOctet - bOctet;
    });

    return NextResponse.json({
      subnet,
      rangeStart,
      rangeEnd,
      port,
      totalScanned: rangeSize,
      machinesFound: machines.length,
      machines,
      scannedAt: new Date().toISOString(),
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Scan failed', details: String(err) },
      { status: 500 }
    );
  }
}
