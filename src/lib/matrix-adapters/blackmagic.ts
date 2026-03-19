import type { MatrixAdapter, MatrixState, MatrixPort } from './types';
import * as net from 'net';

/* ------------------------------------------------------------------ */
/*  Internal types                                                     */
/* ------------------------------------------------------------------ */

interface ParsedDump {
  devicePresent: boolean;
  model: string;
  firmware?: string;
  videoInputs: number;
  videoOutputs: number;
  inputLabels: Map<number, string>;
  outputLabels: Map<number, string>;
  routing: Map<number, number>; // output -> input
  inputStatus: Map<number, string>; // index -> status string
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */

const CONNECT_TIMEOUT_MS = 5_000;
const READ_TIMEOUT_MS = 5_000;

/* ------------------------------------------------------------------ */
/*  Block parser                                                       */
/* ------------------------------------------------------------------ */

/**
 * Split the raw TCP dump into protocol blocks.
 *
 * Each block is separated by a blank line. A block starts with a header
 * line ending in `:` followed by zero or more data lines.
 */
function splitBlocks(raw: string): { header: string; lines: string[] }[] {
  // Normalise line endings
  const normalised = raw.replace(/\r\n/g, '\n');

  // Blocks are separated by double newlines.  We split on them, then
  // identify the header (first line) and body lines for each block.
  const chunks = normalised.split(/\n\n+/);
  const blocks: { header: string; lines: string[] }[] = [];

  for (const chunk of chunks) {
    const trimmed = chunk.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    const header = lines[0];
    // Only treat as a protocol block if the first line ends with ':'
    if (header.endsWith(':')) {
      blocks.push({ header: header.slice(0, -1), lines: lines.slice(1) });
    }
  }

  return blocks;
}

/**
 * Parse the full initial state dump into a structured object.
 */
function parseDump(raw: string): ParsedDump {
  const result: ParsedDump = {
    devicePresent: false,
    model: 'Unknown',
    videoInputs: 0,
    videoOutputs: 0,
    inputLabels: new Map(),
    outputLabels: new Map(),
    routing: new Map(),
    inputStatus: new Map(),
  };

  const blocks = splitBlocks(raw);

  for (const block of blocks) {
    switch (block.header) {
      case 'VIDEOHUB DEVICE': {
        for (const line of block.lines) {
          const colonIdx = line.indexOf(':');
          if (colonIdx === -1) continue;
          const key = line.slice(0, colonIdx).trim();
          const value = line.slice(colonIdx + 1).trim();
          switch (key) {
            case 'Device present':
              result.devicePresent = value === 'true';
              break;
            case 'Model name':
              result.model = value;
              break;
            case 'Video inputs':
              result.videoInputs = parseInt(value, 10) || 0;
              break;
            case 'Video outputs':
              result.videoOutputs = parseInt(value, 10) || 0;
              break;
            case 'Firmware':
              result.firmware = value;
              break;
          }
        }
        break;
      }

      case 'INPUT LABELS': {
        for (const line of block.lines) {
          const spaceIdx = line.indexOf(' ');
          if (spaceIdx === -1) continue;
          const idx = parseInt(line.slice(0, spaceIdx), 10);
          const label = line.slice(spaceIdx + 1);
          if (!Number.isNaN(idx)) result.inputLabels.set(idx, label);
        }
        break;
      }

      case 'OUTPUT LABELS': {
        for (const line of block.lines) {
          const spaceIdx = line.indexOf(' ');
          if (spaceIdx === -1) continue;
          const idx = parseInt(line.slice(0, spaceIdx), 10);
          const label = line.slice(spaceIdx + 1);
          if (!Number.isNaN(idx)) result.outputLabels.set(idx, label);
        }
        break;
      }

      case 'VIDEO OUTPUT ROUTING': {
        for (const line of block.lines) {
          const parts = line.trim().split(/\s+/);
          if (parts.length < 2) continue;
          const outIdx = parseInt(parts[0], 10);
          const inIdx = parseInt(parts[1], 10);
          if (!Number.isNaN(outIdx) && !Number.isNaN(inIdx)) {
            result.routing.set(outIdx, inIdx);
          }
        }
        break;
      }

      case 'VIDEO INPUT STATUS': {
        for (const line of block.lines) {
          const spaceIdx = line.indexOf(' ');
          if (spaceIdx === -1) continue;
          const idx = parseInt(line.slice(0, spaceIdx), 10);
          const status = line.slice(spaceIdx + 1).trim();
          if (!Number.isNaN(idx)) result.inputStatus.set(idx, status);
        }
        break;
      }

      // Ignore any other blocks (e.g. END PRELUDE, VIDEO OUTPUT LOCKS, etc.)
      default:
        break;
    }
  }

  return result;
}

/**
 * Convert a ParsedDump into the normalised MatrixState.
 */
function buildMatrixState(dump: ParsedDump): MatrixState {
  const inputs: MatrixPort[] = [];
  for (let i = 0; i < dump.videoInputs; i++) {
    const status = dump.inputStatus.get(i) ?? '';
    inputs.push({
      index: i,
      label: dump.inputLabels.get(i) ?? `Input ${i + 1}`,
      signal: status !== '' && status.toLowerCase() !== 'none',
      format: status && status.toLowerCase() !== 'none' ? status : undefined,
    });
  }

  const outputs: (MatrixPort & { routedFrom: number })[] = [];
  for (let i = 0; i < dump.videoOutputs; i++) {
    outputs.push({
      index: i,
      label: dump.outputLabels.get(i) ?? `Output ${i + 1}`,
      signal: true, // outputs are assumed active if the device is present
      routedFrom: dump.routing.get(i) ?? 0,
    });
  }

  return {
    manufacturer: 'blackmagic',
    model: dump.model,
    firmware: dump.firmware,
    inputs,
    outputs,
    size: `${dump.videoInputs}x${dump.videoOutputs}`,
  };
}

/* ------------------------------------------------------------------ */
/*  TCP helpers                                                        */
/* ------------------------------------------------------------------ */

/**
 * Connect to a Videohub device, read its full initial state dump, and
 * return the raw string.  The connection is closed before returning.
 */
function connectAndRead(
  ip: string,
  port: number,
): Promise<{ socket: net.Socket; raw: string }> {
  return new Promise((resolve, reject) => {
    let buffer = '';
    let settled = false;

    const socket = new net.Socket();

    // We consider the dump "complete" when we have received all five
    // expected block headers, or when data stops arriving for 500 ms.
    let idleTimer: ReturnType<typeof setTimeout> | null = null;

    const expectedHeaders = [
      'VIDEOHUB DEVICE:',
      'INPUT LABELS:',
      'OUTPUT LABELS:',
      'VIDEO OUTPUT ROUTING:',
      'VIDEO INPUT STATUS:',
    ];

    function hasAllBlocks(): boolean {
      return expectedHeaders.every((h) => buffer.includes(h));
    }

    function finish() {
      if (settled) return;
      settled = true;
      if (idleTimer) clearTimeout(idleTimer);
      resolve({ socket, raw: buffer });
    }

    function fail(err: Error) {
      if (settled) return;
      settled = true;
      if (idleTimer) clearTimeout(idleTimer);
      socket.destroy();
      reject(err);
    }

    socket.setTimeout(CONNECT_TIMEOUT_MS);

    socket.on('timeout', () => {
      // If we already have some data, treat the timeout as end-of-dump
      if (buffer.length > 0) {
        finish();
      } else {
        fail(new Error('Connection timed out'));
      }
    });

    socket.on('error', (err) => fail(err));

    socket.on('data', (chunk) => {
      buffer += chunk.toString('utf-8');

      // Check if we have received the complete dump
      if (hasAllBlocks() && buffer.endsWith('\n\n')) {
        finish();
        return;
      }

      // Reset idle timer — finish if no more data arrives for 500 ms
      if (idleTimer) clearTimeout(idleTimer);
      idleTimer = setTimeout(() => {
        finish();
      }, 500);
    });

    socket.connect(port, ip, () => {
      // Connection established — now just wait for data.
      // Set a hard upper-bound read timeout.
      socket.setTimeout(READ_TIMEOUT_MS);
    });
  });
}

/**
 * Connect, wait for the initial dump, send a command, and wait for
 * ACK or NAK.  Returns `true` on ACK, `false` on NAK or timeout.
 */
function sendCommand(
  ip: string,
  port: number,
  command: string,
): Promise<boolean> {
  return new Promise((resolve) => {
    let settled = false;

    function finish(ok: boolean, socket: net.Socket) {
      if (settled) return;
      settled = true;
      socket.destroy();
      resolve(ok);
    }

    connectAndRead(ip, port)
      .then(({ socket, raw: _raw }) => {
        // We have the initial dump — now send our command.
        let responseBuffer = '';
        let responseTimer: ReturnType<typeof setTimeout> | null = null;

        socket.on('data', (chunk) => {
          responseBuffer += chunk.toString('utf-8');

          if (responseBuffer.includes('ACK')) {
            if (responseTimer) clearTimeout(responseTimer);
            finish(true, socket);
          } else if (responseBuffer.includes('NAK')) {
            if (responseTimer) clearTimeout(responseTimer);
            finish(false, socket);
          }
        });

        socket.on('error', () => finish(false, socket));
        socket.on('timeout', () => finish(false, socket));

        // Set a timeout for the response
        socket.setTimeout(READ_TIMEOUT_MS);
        responseTimer = setTimeout(() => {
          finish(false, socket);
        }, READ_TIMEOUT_MS);

        // Send the command — must end with a blank line
        socket.write(command);
      })
      .catch(() => {
        resolve(false);
      });
  });
}

/* ------------------------------------------------------------------ */
/*  Adapter                                                            */
/* ------------------------------------------------------------------ */

export class BlackmagicMatrixAdapter implements MatrixAdapter {
  manufacturer = 'blackmagic' as const;

  async queryMatrix(ip: string, port = 9990): Promise<MatrixState | null> {
    try {
      const { socket, raw } = await connectAndRead(ip, port);
      socket.destroy();

      const dump = parseDump(raw);
      if (!dump.devicePresent) return null;

      return buildMatrixState(dump);
    } catch {
      return null;
    }
  }

  async setRoute(
    ip: string,
    outputIndex: number,
    inputIndex: number,
    port = 9990,
  ): Promise<boolean> {
    try {
      const command = `VIDEO OUTPUT ROUTING:\n${outputIndex} ${inputIndex}\n\n`;
      return await sendCommand(ip, port, command);
    } catch {
      return false;
    }
  }

  async setInputLabel(
    ip: string,
    index: number,
    label: string,
    port = 9990,
  ): Promise<boolean> {
    try {
      const command = `INPUT LABELS:\n${index} ${label}\n\n`;
      return await sendCommand(ip, port, command);
    } catch {
      return false;
    }
  }

  async setOutputLabel(
    ip: string,
    index: number,
    label: string,
    port = 9990,
  ): Promise<boolean> {
    try {
      const command = `OUTPUT LABELS:\n${index} ${label}\n\n`;
      return await sendCommand(ip, port, command);
    } catch {
      return false;
    }
  }
}
