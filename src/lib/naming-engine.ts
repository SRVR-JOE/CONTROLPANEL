/**
 * Naming Engine — Pure logic module for the naming ideology system.
 * Handles template compilation, variable substitution, conflict detection,
 * and pattern validation. No React dependencies.
 */

import type { NamingTemplate, Device } from '@/types';

// ============================================================
// Template variable extraction
// ============================================================

const VARIABLE_RE = /\{(\w+)\}/g;

/** Extract variable names from a pattern string like "FOH-{type}-{number}" */
export function extractVariables(pattern: string): string[] {
  const vars: string[] = [];
  let match: RegExpExecArray | null;
  const re = new RegExp(VARIABLE_RE.source, 'g');
  while ((match = re.exec(pattern)) !== null) {
    if (!vars.includes(match[1])) {
      vars.push(match[1]);
    }
  }
  return vars;
}

// ============================================================
// Template compilation
// ============================================================

/** Compile a template pattern with variable values into a concrete name. */
export function compileName(
  pattern: string,
  variables: Record<string, string>,
): string {
  return pattern.replace(VARIABLE_RE, (_, key: string) => {
    return variables[key] ?? `{${key}}`;
  });
}

/**
 * Generate a batch of names for multiple devices using auto-incrementing numbers.
 * The {number} variable is auto-incremented starting from the provided base.
 */
export function generateBatchNames(
  pattern: string,
  baseVariables: Record<string, string>,
  count: number,
  startNumber: number = 1,
  numberPadding: number = 2,
): string[] {
  const names: string[] = [];
  for (let i = 0; i < count; i++) {
    const num = startNumber + i;
    const padded = String(num).padStart(numberPadding, '0');
    const vars = { ...baseVariables, number: padded };
    names.push(compileName(pattern, vars));
  }
  return names;
}

// ============================================================
// Conflict detection
// ============================================================

export interface NamingConflict {
  name: string;
  existingDeviceId: string;
  existingDeviceName: string;
  newDeviceId: string;
}

/**
 * Detect conflicts between proposed names and existing device names.
 * Returns an array of conflicts found (case-insensitive comparison).
 */
export function detectConflicts(
  proposedNames: { deviceId: string; name: string }[],
  existingDevices: Device[],
  excludeDeviceIds: string[] = [],
): NamingConflict[] {
  const conflicts: NamingConflict[] = [];

  const existingByName = new Map<string, Device>();
  for (const device of existingDevices) {
    if (!excludeDeviceIds.includes(device.id)) {
      existingByName.set(device.name.toUpperCase(), device);
    }
  }

  // Also check for duplicates within the proposed set
  const proposedByName = new Map<string, string>();

  for (const { deviceId, name } of proposedNames) {
    const upper = name.toUpperCase();

    // Check against existing devices
    const existing = existingByName.get(upper);
    if (existing && existing.id !== deviceId) {
      conflicts.push({
        name,
        existingDeviceId: existing.id,
        existingDeviceName: existing.name,
        newDeviceId: deviceId,
      });
    }

    // Check against other proposed names (duplicates within batch)
    const previousId = proposedByName.get(upper);
    if (previousId && previousId !== deviceId) {
      conflicts.push({
        name,
        existingDeviceId: previousId,
        existingDeviceName: name,
        newDeviceId: deviceId,
      });
    }

    proposedByName.set(upper, deviceId);
  }

  return conflicts;
}

// ============================================================
// Pattern validation
// ============================================================

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/** Validate a naming template pattern. */
export function validatePattern(pattern: string): ValidationResult {
  const errors: string[] = [];

  if (!pattern || pattern.trim().length === 0) {
    errors.push('Pattern cannot be empty');
    return { valid: false, errors };
  }

  if (pattern.length > 64) {
    errors.push('Pattern must be 64 characters or fewer');
  }

  // Check for unmatched braces
  const openCount = (pattern.match(/\{/g) || []).length;
  const closeCount = (pattern.match(/\}/g) || []).length;
  if (openCount !== closeCount) {
    errors.push('Unmatched braces in pattern');
  }

  // Check for empty variable names
  if (/\{\s*\}/.test(pattern)) {
    errors.push('Variable names cannot be empty');
  }

  // Check for invalid characters in variable names
  const invalidVars = pattern.match(/\{[^}]*[^a-zA-Z0-9_}][^}]*\}/g);
  if (invalidVars) {
    errors.push('Variable names can only contain letters, numbers, and underscores');
  }

  // Check that compiled name would be valid (no special chars outside braces)
  const withoutVars = pattern.replace(VARIABLE_RE, 'X');
  if (/[^a-zA-Z0-9\-_. ]/.test(withoutVars)) {
    errors.push('Pattern contains invalid characters (allowed: letters, numbers, hyphens, underscores, dots, spaces)');
  }

  return { valid: errors.length === 0, errors };
}

/** Validate a complete template. */
export function validateTemplate(template: Pick<NamingTemplate, 'name' | 'pattern' | 'variables'>): ValidationResult {
  const errors: string[] = [];

  if (!template.name || template.name.trim().length === 0) {
    errors.push('Template name is required');
  }

  const patternResult = validatePattern(template.pattern);
  errors.push(...patternResult.errors);

  // Check that all variables in the pattern have defaults
  const vars = extractVariables(template.pattern);
  for (const v of vars) {
    if (!template.variables[v]) {
      errors.push(`Variable "{${v}}" needs a default value`);
    }
  }

  return { valid: errors.length === 0, errors };
}
