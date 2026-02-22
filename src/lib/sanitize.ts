/**
 * sanitize.ts — Input sanitization for TCP protocol injection prevention.
 * The HyperDeck protocol is newline-delimited; injecting \r or \n into
 * user-supplied parameter values allows command smuggling (CWE-93).
 */

export function stripControlChars(value: string): string {
  // eslint-disable-next-line no-control-regex
  return value.replace(/[\x00-\x1f\x7f]/g, '');
}

export function sanitizeHyperDeckValue(value: string): string {
  if (typeof value !== 'string') throw new TypeError('sanitizeHyperDeckValue: expected a string');
  const sanitized = stripControlChars(value.trim());
  if (sanitized === '') throw new RangeError('sanitizeHyperDeckValue: value is empty after sanitization');
  return sanitized;
}

export function validateSlotId(slotId: unknown): number {
  const n = Number(slotId);
  if (!Number.isInteger(n) || n < 1 || n > 16) throw new RangeError(`Invalid slot ID: ${slotId}. Must be an integer between 1 and 16.`);
  return n;
}
