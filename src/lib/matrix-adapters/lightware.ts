import type { MatrixAdapter, MatrixPort, MatrixState } from './types';

/** Timeout for all HTTP requests to Lightware devices (ms). */
const REQUEST_TIMEOUT = 4000;

/** Maximum number of I/O ports to probe when auto-detecting matrix size. */
const MAX_PORT_PROBE = 128;

/**
 * Lightware LW3 REST API matrix adapter.
 *
 * The LW3 REST API exposes system and media routing controls over HTTP on
 * port 80. Input/output indices in the API are 1-based (I1, O1, …) while
 * the MatrixState contract uses 0-based indices.
 */
export class LightwareMatrixAdapter implements MatrixAdapter {
  readonly manufacturer = 'lightware';

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async queryMatrix(ip: string, _port?: number): Promise<MatrixState | null> {
    const base = this.baseUrl(ip);

    // Fetch system info — bail early if the device is unreachable.
    const sysInfo = await this.fetchSystemInfo(base);
    if (!sysInfo) return null;

    // Detect how many inputs/outputs the matrix has.
    const inputCount = await this.probePortCount(base, 'I');
    const outputCount = await this.probePortCount(base, 'O');
    if (inputCount === 0 || outputCount === 0) return null;

    // Build input and output port arrays concurrently.
    const [inputs, outputs] = await Promise.all([
      this.queryInputs(base, inputCount),
      this.queryOutputs(base, outputCount),
    ]);

    return {
      manufacturer: this.manufacturer,
      model: sysInfo.model,
      firmware: sysInfo.firmware,
      inputs,
      outputs,
      size: `${inputCount}x${outputCount}`,
    };
  }

  async setRoute(
    ip: string,
    outputIndex: number,
    inputIndex: number,
    _port?: number
  ): Promise<boolean> {
    const base = this.baseUrl(ip);
    // API uses 1-based indices.
    const body = `I${inputIndex + 1}:O${outputIndex + 1}`;
    try {
      const res = await this.fetch(`${base}/MEDIA/VIDEO/XP/switch`, {
        method: 'POST',
        body,
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async setInputLabel(
    ip: string,
    index: number,
    label: string,
    _port?: number
  ): Promise<boolean> {
    return this.setPortLabel(this.baseUrl(ip), 'I', index, label);
  }

  async setOutputLabel(
    ip: string,
    index: number,
    label: string,
    _port?: number
  ): Promise<boolean> {
    return this.setPortLabel(this.baseUrl(ip), 'O', index, label);
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  private baseUrl(ip: string): string {
    return `http://${ip}/api`;
  }

  /**
   * Wrapper around `fetch` that enforces a request timeout via AbortSignal.
   */
  private async fetch(
    url: string,
    init?: RequestInit
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT);
    try {
      return await fetch(url, { ...init, signal: controller.signal });
    } finally {
      clearTimeout(timer);
    }
  }

  /**
   * Safely read a text body from the device. Returns the trimmed string, or
   * `null` when the request fails or returns a non-2xx status.
   */
  private async getText(url: string): Promise<string | null> {
    try {
      const res = await this.fetch(url);
      if (!res.ok) return null;
      const text = await res.text();
      return text.trim();
    } catch {
      return null;
    }
  }

  /**
   * Fetch basic system information (model name, firmware version).
   */
  private async fetchSystemInfo(
    base: string
  ): Promise<{ model: string; firmware?: string } | null> {
    try {
      const res = await this.fetch(`${base}/SYS`);
      if (!res.ok) return null;
      const text = await res.text();

      const model = this.extractProperty(text, 'ProductName') ?? 'Unknown';
      const firmware = this.extractProperty(text, 'FwVersion') ?? undefined;

      return { model, firmware };
    } catch {
      return null;
    }
  }

  /**
   * Extract a named property from a Lightware multi-line text response.
   * Lines are typically formatted as `PropertyName=Value` or similar.
   */
  private extractProperty(text: string, key: string): string | null {
    for (const line of text.split(/\r?\n/)) {
      const trimmed = line.trim();
      // Match patterns like "PropertyName=Value" or "PropertyName: Value"
      const match = trimmed.match(
        new RegExp(`^${key}\\s*[=:]\\s*(.+)$`, 'i')
      );
      if (match) return match[1].trim();
    }
    return null;
  }

  /**
   * Determine how many ports of a given direction the matrix has by probing
   * sequentially until a request fails. The API uses 1-based numbering.
   */
  private async probePortCount(
    base: string,
    direction: 'I' | 'O'
  ): Promise<number> {
    let count = 0;
    for (let n = 1; n <= MAX_PORT_PROBE; n++) {
      const res = await this.getText(
        `${base}/MEDIA/VIDEO/${direction}${n}/Name`
      );
      if (res === null) break;
      count = n;
    }
    return count;
  }

  /**
   * Build an array of MatrixPort entries for every input on the matrix.
   */
  private async queryInputs(
    base: string,
    count: number
  ): Promise<MatrixPort[]> {
    const tasks = Array.from({ length: count }, (_, i) =>
      this.queryInput(base, i)
    );
    return Promise.all(tasks);
  }

  private async queryInput(base: string, index: number): Promise<MatrixPort> {
    const n = index + 1; // 1-based API index
    const [label, signalRaw] = await Promise.all([
      this.getText(`${base}/MEDIA/VIDEO/I${n}/Name`),
      this.getText(`${base}/MEDIA/VIDEO/I${n}/SignalPresent`),
    ]);

    return {
      index,
      label: label ?? `Input ${n}`,
      signal: this.parseBool(signalRaw),
    };
  }

  /**
   * Build an array of output ports including their current crosspoint source.
   */
  private async queryOutputs(
    base: string,
    count: number
  ): Promise<(MatrixPort & { routedFrom: number })[]> {
    const tasks = Array.from({ length: count }, (_, i) =>
      this.queryOutput(base, i)
    );
    return Promise.all(tasks);
  }

  private async queryOutput(
    base: string,
    index: number
  ): Promise<MatrixPort & { routedFrom: number }> {
    const n = index + 1; // 1-based API index
    const [label, sourceRaw, signalRaw] = await Promise.all([
      this.getText(`${base}/MEDIA/VIDEO/O${n}/Name`),
      this.getText(`${base}/MEDIA/VIDEO/XP/O${n}/Source`),
      this.getText(`${base}/MEDIA/VIDEO/O${n}/SignalPresent`).catch(
        () => null
      ),
    ]);

    // Source is returned as a 1-based input number; convert to 0-based.
    const routedFrom = this.parseSourceIndex(sourceRaw);

    return {
      index,
      label: label ?? `Output ${n}`,
      signal: this.parseBool(signalRaw),
      routedFrom,
    };
  }

  /**
   * Set a port label (input or output).
   */
  private async setPortLabel(
    base: string,
    direction: 'I' | 'O',
    index: number,
    label: string
  ): Promise<boolean> {
    const n = index + 1;
    try {
      const res = await this.fetch(
        `${base}/MEDIA/VIDEO/${direction}${n}/Name`,
        { method: 'PUT', body: label }
      );
      return res.ok;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Parsing utilities
  // ---------------------------------------------------------------------------

  /**
   * Parse a Lightware boolean string ("true", "1", "yes") into a boolean.
   */
  private parseBool(value: string | null): boolean {
    if (!value) return false;
    const lower = value.toLowerCase();
    return lower === 'true' || lower === '1' || lower === 'yes';
  }

  /**
   * Parse a crosspoint source value (1-based) into a 0-based index.
   * Returns -1 when the value cannot be parsed (disconnected / unknown).
   */
  private parseSourceIndex(value: string | null): number {
    if (!value) return -1;
    // The response may be a bare number or prefixed with "I" (e.g. "I3").
    const match = value.match(/(\d+)/);
    if (!match) return -1;
    const oneBasedIndex = parseInt(match[1], 10);
    return Number.isNaN(oneBasedIndex) ? -1 : oneBasedIndex - 1;
  }
}
