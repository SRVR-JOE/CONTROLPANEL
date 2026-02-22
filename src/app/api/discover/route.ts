import { NextRequest, NextResponse } from 'next/server';
import { isAllowedTarget } from '@/lib/validateIp';
interface DiscoverRequest { subnet: string; rangeStart: number; rangeEnd: number; port: number; }
const MODELS = ['GX 3', 'GX 3c', 'VX 4', 'VX 4+', 'VX 2'] as const;
const GPUS = ['NVIDIA RTX A6000', 'NVIDIA RTX 4090', 'NVIDIA RTX A4500', 'NVIDIA Quadro RTX 8000'];
const PROJECTS = ['Illuminate 2026', 'Stadium Tour', 'Corporate Keynote', 'Festival Main Stage', null];
const VERSIONS = ['r27.1', 'r27.0', 'r26.4', 'r25.3'];
function generateMachine(ip: string, port: number) { const lastOctet = parseInt(ip.split('.').pop() ?? '0'); const seed = lastOctet * 13 + 7; const role = lastOctet <= 11 ? 'director' as const : lastOctet <= 19 ? 'actor' as const : 'understudy' as const; const rolePrefix = role === 'director' ? 'DIR' : role === 'actor' ? `ACT-${lastOctet - 11}` : `US-${lastOctet - 19}`; return { ip, hostname: `D3-${rolePrefix}`, model: MODELS[seed % MODELS.length], role, designerVersion: VERSIONS[seed % VERSIONS.length], apiPort: port, workgroup: 'DISGUISE', uptime: Math.floor((seed * 3571) % 864000), d3ServiceRunning: seed % 5 !== 0, gpuName: GPUS[seed % GPUS.length], currentProject: PROJECTS[seed % PROJECTS.length], discoveredAt: new Date().toISOString() }; }
export async function POST(request: NextRequest) {
  try {
    const body: DiscoverRequest = await request.json();
    const { subnet, rangeStart, rangeEnd, port } = body;
    if (!subnet || rangeStart == null || rangeEnd == null) return NextResponse.json({ error: 'Missing required fields: subnet, rangeStart, rangeEnd' }, { status: 400 });
    const subnetRegex = /^(\d{1,3}\.){2}\d{1,3}$/;
    if (!subnetRegex.test(subnet) || subnet.split('.').some((o: string) => parseInt(o) > 255)) return NextResponse.json({ error: `Invalid subnet format: ${subnet}. Expected format: "10.0.0"` }, { status: 400 });
    if (rangeStart < 0 || rangeStart > 254 || rangeEnd < 0 || rangeEnd > 254) return NextResponse.json({ error: 'Range values must be between 0 and 254' }, { status: 400 });
    if (rangeStart > rangeEnd) return NextResponse.json({ error: 'rangeStart must be less than or equal to rangeEnd' }, { status: 400 });
    if (rangeEnd - rangeStart > 254) return NextResponse.json({ error: 'Range too large, max 254 addresses per scan' }, { status: 400 });
    const scanPort = port || 80;
    if (scanPort < 1 || scanPort > 65535) return NextResponse.json({ error: `Invalid port: ${port}. Must be between 1 and 65535.` }, { status: 400 });
    const probeIp = `${subnet}.${rangeStart}`;
    if (!isAllowedTarget(probeIp)) return NextResponse.json({ error: `Subnet "${subnet}" resolves to a disallowed address range (private/loopback not permitted)` }, { status: 400 });
    const rangeSize = rangeEnd - rangeStart + 1;
    await new Promise((resolve) => setTimeout(resolve, Math.min(5000, rangeSize * 15 + 500)));
    const machines = [];
    const commonOctets = [11, 12, 13, 14, 15, 20];
    for (const octet of commonOctets) if (octet >= rangeStart && octet <= rangeEnd) machines.push(generateMachine(`${subnet}.${octet}`, port));
    const extraCount = Math.floor(Math.random() * 3);
    for (let i = 0; i < extraCount; i++) { const octet = rangeStart + Math.floor(Math.random() * rangeSize); if (!commonOctets.includes(octet) && octet >= rangeStart && octet <= rangeEnd) machines.push(generateMachine(`${subnet}.${octet}`, port)); }
    machines.sort((a, b) => parseInt(a.ip.split('.').pop() ?? '0') - parseInt(b.ip.split('.').pop() ?? '0'));
    return NextResponse.json({ subnet, rangeStart, rangeEnd, port, totalScanned: rangeSize, machinesFound: machines.length, machines, scannedAt: new Date().toISOString() });
  } catch (err) { return NextResponse.json({ error: 'Scan failed', details: String(err) }, { status: 500 }); }
}
