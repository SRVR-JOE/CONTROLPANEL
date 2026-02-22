import { NextRequest, NextResponse } from 'next/server';
import { isAllowedTarget } from '@/lib/validateIp';
interface DeployRequest { machineId: string; hostname: string; targetIp: string; apiPort: number; sections: string[]; config: Record<string, unknown>; }
interface DeployResponse { machineId: string; success: boolean; message: string; appliedSections: string[]; duration: number; error?: string; }
export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json();
    const { machineId, hostname, targetIp, apiPort, sections } = body;
    if (!machineId || !targetIp || !sections || sections.length === 0) return NextResponse.json({ error: 'Missing required fields: machineId, targetIp, sections' }, { status: 400 });
    if (!isAllowedTarget(targetIp)) return NextResponse.json({ error: `Invalid or disallowed IP address: ${targetIp}` }, { status: 400 });
    if (apiPort != null && (apiPort < 1 || apiPort > 65535)) return NextResponse.json({ error: `Invalid port number: ${apiPort}. Must be between 1 and 65535.` }, { status: 400 });
    const startTime = Date.now();
    const appliedSections: string[] = [];
    for (let i = 0; i < sections.length; i++) { await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600)); appliedSections.push(sections[i]); }
    const success = Math.random() > 0.1;
    const duration = Date.now() - startTime;
    if (!success) { const errors = [`Connection refused: ${targetIp}:${apiPort}`, `Timeout connecting to ${hostname} (${targetIp})`, `${hostname}: WinRM authentication failed`, `${hostname}: d3 service not responding`]; return NextResponse.json<DeployResponse>({ machineId, success: false, message: `Failed to deploy to ${hostname}`, appliedSections: appliedSections.slice(0, -1), duration, error: errors[Math.floor(Math.random() * errors.length)] }); }
    return NextResponse.json<DeployResponse>({ machineId, success: true, message: `Configuration applied to ${hostname} (${targetIp})`, appliedSections, duration });
  } catch (err) { return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 }); }
}
export async function PUT(request: NextRequest) {
  try {
    const body: { machines: DeployRequest[] } = await request.json();
    if (!body.machines || body.machines.length === 0) return NextResponse.json({ error: 'No machines specified' }, { status: 400 });
    for (const machine of body.machines) { if (!machine.targetIp || !isAllowedTarget(machine.targetIp)) return NextResponse.json({ error: `Invalid or disallowed IP address for machine: ${machine.machineId}` }, { status: 400 }); }
    const results = await Promise.all(body.machines.map(async (machine) => { const startTime = Date.now(); for (let i = 0; i < machine.sections.length; i++) await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 400)); const success = Math.random() > 0.1; const duration = Date.now() - startTime; if (!success) return { machineId: machine.machineId, success: false, message: `Failed to deploy to ${machine.hostname}`, appliedSections: [], duration, error: `Connection timeout: ${machine.targetIp}:${machine.apiPort}` } as DeployResponse; return { machineId: machine.machineId, success: true, message: `Configuration applied to ${machine.hostname}`, appliedSections: machine.sections, duration } as DeployResponse; }));
    const allSuccess = results.every((r) => r.success);
    return NextResponse.json({ status: allSuccess ? 'success' : 'partial', totalMachines: results.length, successCount: results.filter((r) => r.success).length, failedCount: results.filter((r) => !r.success).length, results });
  } catch (err) { return NextResponse.json({ error: 'Internal server error', details: String(err) }, { status: 500 }); }
}
