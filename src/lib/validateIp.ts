/**
 * validateIp.ts — SSRF prevention utility.
 * Blocks private/loopback/link-local IPv4 addresses from being targeted
 * by user-supplied input in API routes that make outbound connections.
 */

const BLOCKED_RANGES: Array<{ network: number; mask: number }> = [
  { network: 0x7f000000, mask: 0xff000000 }, // 127.0.0.0/8  loopback
  { network: 0x0a000000, mask: 0xff000000 }, // 10.0.0.0/8   private
  { network: 0xac100000, mask: 0xfff00000 }, // 172.16.0.0/12 private
  { network: 0xc0a80000, mask: 0xffff0000 }, // 192.168.0.0/16 private
  { network: 0xa9fe0000, mask: 0xffff0000 }, // 169.254.0.0/16 link-local
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
    if ((addr & range.mask) === range.network) return false;
  }
  return true;
}

export function assertAllowedTarget(ip: string): void {
  if (!isAllowedTarget(ip)) {
    throw new RangeError(`IP address "${ip}" is not permitted. Private, loopback, link-local, and non-IPv4 addresses are blocked.`);
  }
}
