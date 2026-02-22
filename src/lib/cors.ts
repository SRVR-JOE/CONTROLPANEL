/**
 * cors.ts — Centralised CORS header management.
 * Default policy: same-origin only (no CORS headers).
 * To enable CORS set ALLOWED_ORIGINS env var to comma-separated origins.
 */

function parseAllowedOrigins(): Set<string> {
  const raw = process.env.ALLOWED_ORIGINS ?? '';
  if (!raw.trim()) return new Set();
  return new Set(raw.split(',').map((o) => o.trim()).filter(Boolean));
}

const ALLOWED_ORIGINS: Set<string> = parseAllowedOrigins();

export function getCorsHeaders(requestOrigin?: string | null): Record<string, string> {
  if (!requestOrigin || ALLOWED_ORIGINS.size === 0) return {};
  if (ALLOWED_ORIGINS.has(requestOrigin)) {
    return {
      'Access-Control-Allow-Origin': requestOrigin,
      'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
      'Vary': 'Origin',
    };
  }
  return {};
}

export function getCorsHeadersFromRequest(request: { headers: { get(name: string): string | null } }): Record<string, string> {
  return getCorsHeaders(request.headers.get('origin'));
}
