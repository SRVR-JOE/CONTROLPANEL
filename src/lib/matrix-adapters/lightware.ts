import type { MatrixAdapter, MatrixPort, MatrixState } from './types';
import { lw3Query, parseGetAll } from '../device-adapters/lightware';

const LW3_PORT = 6107;

/**
 * Lightware LW3 TCP matrix adapter.
 *
 * Connects to the device on TCP port 6107 and uses the LW3 text protocol
 * for crosspoint queries, routing, and label management.
 *
 * Input/output indices in the LW3 protocol are 1-based (I1, O1, ...)
 * while the MatrixState contract uses 0-based indices.
 */
export class LightwareMatrixAdapter implements MatrixAdapter {
  readonly manufacturer = 'lightware';

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async queryMatrix(ip: string, _port?: number): Promise<MatrixState | null> {
    try {
      const raw = await lw3Query(ip, LW3_PORT, [
        'GETALL /MANAGEMENT/UID',
        'GETALL /MEDIA/XP/VIDEO',
        'GETALL /MEDIA/NAMES/VIDEO',
      ]);

      const props = parseGetAll(raw);
      if (Object.keys(props).length === 0) return null;

      const model = props['ProductName'] ?? 'Unknown';
      const firmware = props['FirmwareVersion'] ?? undefined;

      // --- Parse routing map from DestinationConnectionStatus ---------------
      // DestinationConnectionStatusN = source index (1-based) for output N
      // or DestinationConnection lines
      const outputs: (MatrixPort & { routedFrom: number })[] = [];
      const inputs: MatrixPort[] = [];

      // Collect destination connection lines to figure out output count & routing
      const destEntries: { index: number; source: number }[] = [];
      for (const [key, value] of Object.entries(props)) {
        // Match DestinationConnectionStatus1, DestinationConnectionStatus2, etc.
        const destMatch = key.match(/^DestinationConnectionStatus(\d+)$/);
        if (destMatch) {
          const outIdx = parseInt(destMatch[1], 10); // 1-based
          // Value is the 1-based input index, or 0 for disconnected
          const srcIdx = parseInt(value, 10);
          destEntries.push({ index: outIdx, source: srcIdx });
        }
      }

      // Sort by index
      destEntries.sort((a, b) => a.index - b.index);

      const outputCount = destEntries.length;

      // Determine input count from SourceConnectionStatus or InputName entries
      let inputCount = 0;
      for (const key of Object.keys(props)) {
        const srcMatch = key.match(/^SourceConnectionStatus(\d+)$/);
        if (srcMatch) {
          const idx = parseInt(srcMatch[1], 10);
          if (idx > inputCount) inputCount = idx;
        }
      }
      // Fallback: try counting InputName entries
      if (inputCount === 0) {
        for (const key of Object.keys(props)) {
          const nameMatch = key.match(/^InputName(\d+)$/);
          if (nameMatch) {
            const idx = parseInt(nameMatch[1], 10);
            if (idx > inputCount) inputCount = idx;
          }
        }
      }
      // Fallback: derive from output count if still 0
      if (inputCount === 0 && outputCount > 0) {
        inputCount = outputCount;
      }

      if (inputCount === 0 || outputCount === 0) return null;

      // --- Build input ports -----------------------------------------------
      for (let n = 1; n <= inputCount; n++) {
        const label = props[`InputName${n}`] ?? `Input ${n}`;
        inputs.push({
          index: n - 1,
          label,
          signal: true, // signal detection requires per-port query; default true
        });
      }

      // --- Build output ports ----------------------------------------------
      for (const dest of destEntries) {
        const n = dest.index;
        const label = props[`OutputName${n}`] ?? `Output ${n}`;
        outputs.push({
          index: n - 1,
          label,
          signal: true,
          routedFrom: dest.source > 0 ? dest.source - 1 : -1,
        });
      }

      return {
        manufacturer: this.manufacturer,
        model,
        firmware,
        inputs,
        outputs,
        size: `${inputCount}x${outputCount}`,
      };
    } catch {
      return null;
    }
  }

  async setRoute(
    ip: string,
    outputIndex: number,
    inputIndex: number,
    _port?: number,
  ): Promise<boolean> {
    // LW3 uses 1-based indices.
    const inN = inputIndex + 1;
    const outN = outputIndex + 1;
    try {
      const raw = await lw3Query(ip, LW3_PORT, [
        `CALL /MEDIA/XP/VIDEO:switch(I${inN}:O${outN})`,
      ]);
      // A successful switch echoes back the command or returns "m" (method result).
      // Check that we didn't get an error.
      return !raw.includes('ERR');
    } catch {
      return false;
    }
  }

  async setInputLabel(
    ip: string,
    index: number,
    label: string,
    _port?: number,
  ): Promise<boolean> {
    const n = index + 1;
    try {
      const raw = await lw3Query(ip, LW3_PORT, [
        `SET /MEDIA/NAMES/VIDEO.InputName${n}=${label}`,
      ]);
      return !raw.includes('ERR');
    } catch {
      return false;
    }
  }

  async setOutputLabel(
    ip: string,
    index: number,
    label: string,
    _port?: number,
  ): Promise<boolean> {
    const n = index + 1;
    try {
      const raw = await lw3Query(ip, LW3_PORT, [
        `SET /MEDIA/NAMES/VIDEO.OutputName${n}=${label}`,
      ]);
      return !raw.includes('ERR');
    } catch {
      return false;
    }
  }
}
