/**
 * Shared validation utilities for API routes.
 */

/**
 * Validates an IPv4 address string.
 * - Must be exactly 4 octets of digits separated by dots
 * - Each octet must be 0-255
 * - Rejects hostnames, loopback (127.x.x.x), link-local (169.254.x.x)
 * - Rejects strings containing @, /, ?, #
 */
export function validateIp(ip: string): boolean {
  // Reject dangerous characters
  if (/[@/?#]/.test(ip)) {
    return false;
  }

  // Must be only digits and dots
  if (!/^\d+\.\d+\.\d+\.\d+$/.test(ip)) {
    return false;
  }

  const parts = ip.split('.');
  if (parts.length !== 4) {
    return false;
  }

  const octets = parts.map(Number);

  // Each octet must be 0-255 and must not have leading zeros (except "0" itself)
  for (let i = 0; i < 4; i++) {
    const octet = octets[i];
    if (octet < 0 || octet > 255) {
      return false;
    }
    // Reject leading zeros (e.g. "01", "007") but allow "0"
    if (parts[i].length > 1 && parts[i][0] === '0') {
      return false;
    }
  }

  // Reject loopback (127.x.x.x)
  if (octets[0] === 127) {
    return false;
  }

  // Reject link-local (169.254.x.x)
  if (octets[0] === 169 && octets[1] === 254) {
    return false;
  }

  return true;
}

/**
 * Validates that a value is a valid port number (integer, 1-65535).
 */
export function validatePort(port: unknown): port is number {
  if (typeof port !== 'number') {
    return false;
  }
  if (!Number.isInteger(port)) {
    return false;
  }
  return port >= 1 && port <= 65535;
}

/**
 * Sanitizes a value for safe inclusion in error messages.
 * Truncates to 100 characters and strips HTML-like characters.
 */
export function sanitizeForResponse(value: unknown): string {
  const str = String(value);
  // Strip HTML-like characters: < > & " '
  const sanitized = str.replace(/[<>&"']/g, '');
  // Truncate to 100 characters
  return sanitized.slice(0, 100);
}
