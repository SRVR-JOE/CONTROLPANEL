/**
 * Shared utility functions for the Luminex Configurator.
 *
 * Centralises helpers that were previously duplicated across 5+ files.
 */

/**
 * Format a duration in seconds to a human-readable uptime string.
 *
 * Examples:
 *   formatUptime(0)       → "0h 0m"
 *   formatUptime(3600)    → "1h 0m"
 *   formatUptime(90061)   → "1d 1h"
 */
export function formatUptime(seconds: number): string {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  if (days > 0) return `${days}d ${hours}h`;
  const mins = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${mins}m`;
}

/**
 * Fetch a URL with an AbortController-based timeout.
 *
 * Throws if the request times out or if the network request fails.
 * Callers are responsible for catching errors.
 *
 * @param url       - Full URL to fetch
 * @param timeoutMs - Abort timeout in milliseconds (default: 3000)
 * @param init      - Optional RequestInit options (method, headers, body, etc.)
 */
export async function fetchWithTimeout(
  url: string,
  timeoutMs: number = 3000,
  init: Omit<RequestInit, 'signal'> = {}
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal });
    return response;
  } finally {
    clearTimeout(timer);
  }
}
