import { NextRequest, NextResponse } from 'next/server';

const TIMEOUT_MS = 3000;

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

// ---------------------------------------------------------------------------
// Request / response shapes
// ---------------------------------------------------------------------------

interface RoboRequest {
  ip: string;
  command: string; // e.g. "aw_ptz?cmd=%23PTS5050S10&res=1"
}

interface RoboResponse {
  success: boolean;
  response?: string;
  error?: string;
}

// ---------------------------------------------------------------------------
// Validation helpers
// ---------------------------------------------------------------------------

/**
 * Basic IP address validation — accepts IPv4 dotted-decimal only.
 * Rejects anything that looks like a URL or contains path traversal characters.
 */
function isValidIp(ip: string): boolean {
  return /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/.test(ip);
}

/**
 * Allowlist of Panasonic CGI path prefixes that this proxy will forward.
 * Prevents arbitrary SSRF by limiting which CGI endpoints can be targeted.
 */
const ALLOWED_PREFIXES = ['aw_ptz', 'aw_cam'];

function isAllowedCommand(command: string): boolean {
  return ALLOWED_PREFIXES.some((prefix) => command.startsWith(prefix));
}

// ---------------------------------------------------------------------------
// Core proxy
// ---------------------------------------------------------------------------

async function proxyCgiCommand(ip: string, command: string): Promise<RoboResponse> {
  const url = `http://${ip}/cgi-bin/${command}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const res = await fetch(url, {
      method: 'GET',
      signal: controller.signal,
    });

    const text = await res.text().catch(() => '');

    if (!res.ok) {
      return {
        success: false,
        error: `Camera returned HTTP ${res.status}: ${text.trim() || 'no body'}`,
      };
    }

    return { success: true, response: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('abort') || message.includes('signal')) {
      return {
        success: false,
        error: `Camera at ${ip} did not respond within ${TIMEOUT_MS / 1000}s — check network`,
      };
    }
    if (message.includes('ECONNREFUSED') || message.includes('EHOSTUNREACH')) {
      return {
        success: false,
        error: `Cannot reach camera at ${ip} — verify IP and network connectivity`,
      };
    }
    return { success: false, error: message };
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
// Route handlers
// ---------------------------------------------------------------------------

export async function OPTIONS() {
  return new NextResponse(null, { status: 204, headers: CORS_HEADERS });
}

/**
 * POST /api/robo
 *
 * Body: { ip: string, command: string }
 *   command is the CGI path after /cgi-bin/ — e.g. "aw_ptz?cmd=%23PTS5050S10&res=1"
 *
 * Returns: { success: boolean, response?: string, error?: string }
 */
export async function POST(request: NextRequest) {
  try {
    let body: RoboRequest;

    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON in request body' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const { ip, command } = body;

    // --- Input validation ---

    if (!ip || typeof ip !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: ip' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!isValidIp(ip)) {
      return NextResponse.json(
        { success: false, error: 'Invalid IP address format' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!command || typeof command !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Missing or invalid field: command' },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    if (!isAllowedCommand(command)) {
      return NextResponse.json(
        {
          success: false,
          error: `Command prefix not allowed. Permitted prefixes: ${ALLOWED_PREFIXES.join(', ')}`,
        },
        { status: 400, headers: CORS_HEADERS }
      );
    }

    const result = await proxyCgiCommand(ip, command);

    return NextResponse.json(result, {
      status: result.success ? 200 : 502,
      headers: CORS_HEADERS,
    });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: 'Internal server error', details: String(err) },
      { status: 500, headers: CORS_HEADERS }
    );
  }
}
