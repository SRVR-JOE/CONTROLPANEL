import { NextRequest, NextResponse } from 'next/server';
import { isAllowedTarget } from '@/lib/validateIp';
import { getCorsHeadersFromRequest } from '@/lib/cors';
const TIMEOUT_MS = 3000;
interface RoboRequest { ip: string; command: string; }
interface RoboResponse { success: boolean; response?: string; error?: string; }
const ALLOWED_PREFIXES = ['aw_ptz', 'aw_cam'];
function isAllowedCommand(command: string): boolean { return ALLOWED_PREFIXES.some((prefix) => command.startsWith(prefix)); }
async function proxyCgiCommand(ip: string, command: string): Promise<RoboResponse> {
  const url = `http://${ip}/cgi-bin/${command}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await fetch(url, { method: 'GET', signal: controller.signal });
    const text = await res.text().catch(() => '');
    if (!res.ok) return { success: false, error: `Camera returned HTTP ${res.status}: ${text.trim() || 'no body'}` };
    return { success: true, response: text.trim() };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    if (message.includes('abort') || message.includes('signal')) return { success: false, error: `Camera at ${ip} did not respond within ${TIMEOUT_MS / 1000}s` };
    if (message.includes('ECONNREFUSED') || message.includes('EHOSTUNREACH')) return { success: false, error: `Cannot reach camera at ${ip}` };
    return { success: false, error: message };
  } finally { clearTimeout(timer); }
}
export async function OPTIONS(request: NextRequest) { return new NextResponse(null, { status: 204, headers: getCorsHeadersFromRequest(request) }); }
export async function POST(request: NextRequest) {
  const corsHeaders = getCorsHeadersFromRequest(request);
  try {
    let body: RoboRequest;
    try { body = await request.json(); } catch { return NextResponse.json({ success: false, error: 'Invalid JSON in request body' }, { status: 400, headers: corsHeaders }); }
    const { ip, command } = body;
    if (!ip || typeof ip !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: ip' }, { status: 400, headers: corsHeaders });
    if (!isAllowedTarget(ip)) return NextResponse.json({ success: false, error: 'Invalid or disallowed IP address' }, { status: 400, headers: corsHeaders });
    if (!command || typeof command !== 'string') return NextResponse.json({ success: false, error: 'Missing or invalid field: command' }, { status: 400, headers: corsHeaders });
    if (!isAllowedCommand(command)) return NextResponse.json({ success: false, error: `Command prefix not allowed. Permitted prefixes: ${ALLOWED_PREFIXES.join(', ')}` }, { status: 400, headers: corsHeaders });
    const result = await proxyCgiCommand(ip, command);
    return NextResponse.json(result, { status: result.success ? 200 : 502, headers: corsHeaders });
  } catch (err) { return NextResponse.json({ success: false, error: 'Internal server error', details: String(err) }, { status: 500, headers: corsHeaders }); }
}
