import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/deploy
 *
 * Pushes configuration to a disguise server over the network.
 * Targets each machine's d3 API endpoint (d3Net IP + apiPort).
 *
 * In production, this would use the disguise REST API or WinRM
 * to apply configuration to each machine. For now, it simulates
 * the network call with realistic timing and responses.
 */

interface DeployRequest {
  machineId: string;
  hostname: string;
  targetIp: string;
  apiPort: number;
  sections: string[];
  config: Record<string, unknown>;
}

interface DeployResponse {
  machineId: string;
  success: boolean;
  message: string;
  appliedSections: string[];
  duration: number;
  error?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: DeployRequest = await request.json();
    const { machineId, hostname, targetIp, apiPort, sections } = body;

    if (!machineId || !targetIp || !sections || sections.length === 0) {
      return NextResponse.json(
        { error: 'Missing required fields: machineId, targetIp, sections' },
        { status: 400 }
      );
    }

    // Simulate network deployment with realistic timing
    const startTime = Date.now();

    // In production, this would be:
    // const response = await fetch(`http://${targetIp}:${apiPort}/api/config`, {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ sections, config }),
    //   signal: AbortSignal.timeout(10000),
    // });

    // Simulate variable latency per section
    const appliedSections: string[] = [];
    for (let i = 0; i < sections.length; i++) {
      // Simulate 200-800ms per section
      await new Promise((resolve) => setTimeout(resolve, 200 + Math.random() * 600));
      appliedSections.push(sections[i]);
    }

    // Simulate 10% failure rate for realism
    const success = Math.random() > 0.1;
    const duration = Date.now() - startTime;

    if (!success) {
      const errors = [
        `Connection refused: ${targetIp}:${apiPort}`,
        `Timeout connecting to ${hostname} (${targetIp})`,
        `${hostname}: WinRM authentication failed`,
        `${hostname}: d3 service not responding`,
      ];
      const error = errors[Math.floor(Math.random() * errors.length)];
      return NextResponse.json<DeployResponse>({
        machineId,
        success: false,
        message: `Failed to deploy to ${hostname}`,
        appliedSections: appliedSections.slice(0, -1), // Last section "failed"
        duration,
        error,
      });
    }

    return NextResponse.json<DeployResponse>({
      machineId,
      success: true,
      message: `Configuration applied to ${hostname} (${targetIp})`,
      appliedSections,
      duration,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    );
  }
}

/**
 * POST /api/deploy/batch
 *
 * Batch deploy to multiple machines. Each machine is deployed
 * concurrently for speed.
 */
export async function PUT(request: NextRequest) {
  try {
    const body: { machines: DeployRequest[] } = await request.json();

    if (!body.machines || body.machines.length === 0) {
      return NextResponse.json({ error: 'No machines specified' }, { status: 400 });
    }

    // Process all machines concurrently
    const results = await Promise.all(
      body.machines.map(async (machine) => {
        const startTime = Date.now();

        // Simulate deployment per machine
        for (let i = 0; i < machine.sections.length; i++) {
          await new Promise((resolve) => setTimeout(resolve, 150 + Math.random() * 400));
        }

        const success = Math.random() > 0.1;
        const duration = Date.now() - startTime;

        if (!success) {
          return {
            machineId: machine.machineId,
            success: false,
            message: `Failed to deploy to ${machine.hostname}`,
            appliedSections: [],
            duration,
            error: `Connection timeout: ${machine.targetIp}:${machine.apiPort}`,
          } as DeployResponse;
        }

        return {
          machineId: machine.machineId,
          success: true,
          message: `Configuration applied to ${machine.hostname}`,
          appliedSections: machine.sections,
          duration,
        } as DeployResponse;
      })
    );

    const allSuccess = results.every((r) => r.success);
    const successCount = results.filter((r) => r.success).length;

    return NextResponse.json({
      status: allSuccess ? 'success' : 'partial',
      totalMachines: results.length,
      successCount,
      failedCount: results.length - successCount,
      results,
    });
  } catch (err) {
    return NextResponse.json(
      { error: 'Internal server error', details: String(err) },
      { status: 500 }
    );
  }
}
