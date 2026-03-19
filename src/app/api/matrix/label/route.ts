import { NextRequest, NextResponse } from 'next/server';
import { getMatrixAdapter } from '@/lib/matrix-adapters';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
import type { MatrixManufacturer } from '@/types';

interface LabelRequest {
  manufacturer: MatrixManufacturer;
  ip: string;
  type: 'input' | 'output';
  index: number;
  label: string;
  port?: number;
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);

  try {
    let body: LabelRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { manufacturer, ip, type, index, label, port } = body;

    if (!manufacturer || typeof manufacturer !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: manufacturer' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: ip' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (!isAllowedTarget(ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid or disallowed target IP address' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (type !== 'input' && type !== 'output') {
      return NextResponse.json(
        { success: false, error: 'Field "type" must be "input" or "output"' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (typeof index !== 'number' || !Number.isInteger(index) || index < 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: index (expected non-negative integer)' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (typeof label !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: label (expected string)' },
        { status: 400, headers: corsHeaders },
      );
    }
    if (port !== undefined && (typeof port !== 'number' || port < 1 || port > 65535)) {
      return NextResponse.json(
        { success: false, error: 'Field "port" must be a number between 1 and 65535' },
        { status: 400, headers: corsHeaders },
      );
    }

    const adapter = getMatrixAdapter(manufacturer);
    if (!adapter) {
      return NextResponse.json(
        { success: false, error: `No adapter available for manufacturer "${manufacturer}"` },
        { status: 400, headers: corsHeaders },
      );
    }

    try {
      let success: boolean;

      if (type === 'input') {
        if (!adapter.setInputLabel) {
          return NextResponse.json(
            { success: false, error: `Adapter for "${manufacturer}" does not support setting input labels` },
            { status: 400, headers: corsHeaders },
          );
        }
        success = await adapter.setInputLabel(ip, index, label, port);
      } else {
        if (!adapter.setOutputLabel) {
          return NextResponse.json(
            { success: false, error: `Adapter for "${manufacturer}" does not support setting output labels` },
            { status: 400, headers: corsHeaders },
          );
        }
        success = await adapter.setOutputLabel(ip, index, label, port);
      }

      if (!success) {
        return NextResponse.json(
          { success: false, error: `Device at ${ip} rejected the label change` },
          { status: 502, headers: corsHeaders },
        );
      }

      return NextResponse.json(
        { success: true },
        { headers: corsHeaders },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      return NextResponse.json(
        { success: false, error: message },
        { status: 502, headers: corsHeaders },
      );
    }
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(err) },
      { status: 500, headers: corsHeaders },
    );
  }
}
