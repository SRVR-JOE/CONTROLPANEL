import { NextRequest, NextResponse } from 'next/server';
import { getMatrixAdapter } from '@/lib/matrix-adapters';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
import type { MatrixManufacturer } from '@/types';

interface SyncRouterRequest {
  id: string;
  manufacturer: MatrixManufacturer;
  ip: string;
  port?: number;
}

interface SyncRequest {
  routers: SyncRouterRequest[];
}

export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) });
}

export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);

  try {
    let body: SyncRequest;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers: corsHeaders },
      );
    }

    const { routers } = body;

    if (!Array.isArray(routers) || routers.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing or empty field: routers (expected non-empty array)' },
        { status: 400, headers: corsHeaders },
      );
    }

    // Validate every router entry before dispatching any queries
    for (const router of routers) {
      if (!router.id || typeof router.id !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Each router must include a string "id"' },
          { status: 400, headers: corsHeaders },
        );
      }
      if (!router.manufacturer || typeof router.manufacturer !== 'string') {
        return NextResponse.json(
          { success: false, error: `Router "${router.id}": missing or invalid field "manufacturer"` },
          { status: 400, headers: corsHeaders },
        );
      }
      if (!router.ip || typeof router.ip !== 'string') {
        return NextResponse.json(
          { success: false, error: `Router "${router.id}": missing or invalid field "ip"` },
          { status: 400, headers: corsHeaders },
        );
      }
      if (!isAllowedTarget(router.ip)) {
        return NextResponse.json(
          { success: false, error: `Router "${router.id}": invalid or disallowed IP address "${router.ip}"` },
          { status: 400, headers: corsHeaders },
        );
      }
      if (router.port !== undefined && (typeof router.port !== 'number' || router.port < 1 || router.port > 65535)) {
        return NextResponse.json(
          { success: false, error: `Router "${router.id}": port must be a number between 1 and 65535` },
          { status: 400, headers: corsHeaders },
        );
      }
    }

    // Query all routers in parallel
    const results = await Promise.all(
      routers.map(async (router) => {
        try {
          const adapter = getMatrixAdapter(router.manufacturer);
          if (!adapter) {
            return { id: router.id, state: null, error: `No adapter available for manufacturer "${router.manufacturer}"` };
          }

          const state = await adapter.queryMatrix(router.ip, router.port);
          if (!state) {
            return { id: router.id, state: null, error: `Device at ${router.ip} did not return matrix state` };
          }

          return { id: router.id, state };
        } catch (err) {
          const message = err instanceof Error ? err.message : String(err);
          return { id: router.id, state: null, error: message };
        }
      }),
    );

    return NextResponse.json({ results }, { headers: corsHeaders });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(err) },
      { status: 500, headers: corsHeaders },
    );
  }
}
