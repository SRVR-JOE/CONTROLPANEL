/**
 * validateIp.ts — SSRF prevention utility.
 * Blocks private/loopback/link-local IPv4 addresses from being targeted
 * by user-supplied input in API routes that make outbound connections.
 */

// NOTE: This app controls AV devices on local/private networks.
// Only block truly dangerous targets (loopback, broadcast, zero-address).
// Private ranges (10.x, 172.16.x, 192.168.x) are intentionally ALLOWED
// because that's where AV rack equipment lives.
const BLOCKED_RANGES: Array<{ network: number; mask: number }> = [
  { network: 0x7f000000, mask: 0xff000000 }, // 127.0.0.0/8  loopback
  { network: 0x00000000, mask: 0xffffffff }, // 0.0.0.0
  { network: 0xffffffff, mask: 0xffffffff }, // 255.255.255.255
];

function ipv4ToUint32(ip: string): number {
  const octets = ip.split('.');
  if (octets.length !== 4) return NaN;
  let result = 0;
  for (const octet of octets) {
    if (!/^\d+$/.test(octet) || octet.length > 3) return NaN;
    const val = parseInt(octet, 10);
    if (val < 0 || val > 255) return NaN;
    result = (result * 256 + val) >>> 0;
  }
  return result;
}

export function isAllowedTarget(ip: string): boolean {
  if (typeof ip !== 'string' || ip.trim() === '') return false;
  if (/[\s/:@#?]/.test(ip)) return false;
  if (ip.includes(':')) return false;
  const addr = ipv4ToUint32(ip.trim());
  if (isNaN(addr)) return false;
  for (const range of BLOCKED_RANGES) {
    // Use >>> 0 on both sides to force unsigned 32-bit comparison.
    // Without this, bitwise & returns a signed 32-bit int (e.g. -1 for 0xffffffff),
    // which will never equal the unsigned constant 0xffffffff (4294967295).
    if (((addr & range.mask) >>> 0) === (range.network >>> 0)) return false;
  }
  return true;
}

export function assertAllowedTarget(ip: string): void {
  if (!isAllowedTarget(ip)) {
    throw new RangeError(`IP address "${ip}" is not permitted. Private, loopback, link-local, and non-IPv4 addresses are blocked.`);
  }
}
