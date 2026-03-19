import type { MatrixAdapter, MatrixPort, MatrixState } from './types';

/** Timeout for all HTTP requests to AJA KUMO devices (ms). */
const REQUEST_TIMEOUT = 5000;

/** Maximum number of concurrent requests to avoid overwhelming the device. */
const MAX_CONCURRENT = 8;

/**
 * AJA KUMO REST API matrix adapter.
 *
 * The KUMO REST API is accessible at `http://{ip}/config` and uses query
 * parameters for all operations (`action=get` / `action=set`).
 *
 * - Parameter names for destinations and sources are 1-indexed.
 * - Source *values* (crosspoint assignments) are 0-indexed.
 * - All MatrixState indices returned by this adapter are 0-based.
 */
export class AjaMatrixAdapter implements MatrixAdapter {
  readonly manufacturer = 'aja';

  // ---------------------------------------------------------------------------
  // Public API
  // ---------------------------------------------------------------------------

  async queryMatrix(ip: string, _port = 80): Promise<MatrixState | null> {
    // 1. Detect matrix size and firmware in parallel.
    const [inputCountResult, outputCountResult, firmwareResult] =
      await Promise.all([
        kumoGet(ip, 'eParamID_NumberOfVideoInputs'),
        kumoGet(ip, 'eParamID_NumberOfVideoOutputs'),
        kumoGet(ip, 'eParamID_SWVersion'),
      ]);

    // If we can't determine the matrix dimensions the device is unreachable.
    if (!inputCountResult || !outputCountResult) return null;

    const inputCount = parseInt(inputCountResult.value, 10);
    const outputCount = parseInt(outputCountResult.value, 10);
    if (Number.isNaN(inputCount) || Number.isNaN(outputCount)) return null;
    if (inputCount <= 0 || outputCount <= 0) return null;

    // 2. Query all inputs and outputs with batched parallelism.
    const [inputs, outputs] = await Promise.all([
      this.queryInputs(ip, inputCount),
      this.queryOutputs(ip, outputCount),
    ]);

    return {
      manufacturer: this.manufacturer,
      model: 'KUMO',
      firmware: firmwareResult?.value ?? undefined,
      inputs,
      outputs,
      size: `${inputCount}x${outputCount}`,
    };
  }

  async setRoute(
    ip: string,
    outputIndex: number,
    inputIndex: number,
    _port = 80
  ): Promise<boolean> {
    // outputIndex is 0-based; KUMO destinations are 1-based.
    // inputIndex is 0-based; KUMO source values are already 0-based.
    const dest = outputIndex + 1;
    const url =
      `http://${ip}/config?action=set` +
      `&paramid=eParamID_XPT_Destination${dest}_Status` +
      `&value=${inputIndex}`;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
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
    _port = 80
  ): Promise<boolean> {
    const n = index + 1;
    const url =
      `http://${ip}/config?action=set` +
      `&paramid=eParamID_XPT_Source${n}_Line_1` +
      `&value=${encodeURIComponent(label)}`;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  async setOutputLabel(
    ip: string,
    index: number,
    label: string,
    _port = 80
  ): Promise<boolean> {
    const n = index + 1;
    const url =
      `http://${ip}/config?action=set` +
      `&paramid=eParamID_XPT_Destination${n}_Line_1` +
      `&value=${encodeURIComponent(label)}`;
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(REQUEST_TIMEOUT),
      });
      return res.ok;
    } catch {
      return false;
    }
  }

  // ---------------------------------------------------------------------------
  // Internal helpers
  // ---------------------------------------------------------------------------

  /**
   * Query all input ports with batched parallelism.
   */
  private async queryInputs(
    ip: string,
    count: number
  ): Promise<MatrixPort[]> {
    return batchedQuery(count, MAX_CONCURRENT, (index) =>
      this.queryInput(ip, index)
    );
  }

  /**
   * Query a single input port's label and signal status.
   */
  private async queryInput(ip: string, index: number): Promise<MatrixPort> {
    const n = index + 1; // 1-based parameter name
    const [labelResult, signalResult] = await Promise.all([
      kumoGet(ip, `eParamID_XPT_Source${n}_Line_1`),
      kumoGet(ip, `eParamID_Input${n}_SignalValid`),
    ]);

    return {
      index,
      label: labelResult?.value ?? `Input ${n}`,
      signal: parseBool(signalResult?.value ?? null),
    };
  }

  /**
   * Query all output ports with batched parallelism.
   */
  private async queryOutputs(
    ip: string,
    count: number
  ): Promise<(MatrixPort & { routedFrom: number })[]> {
    return batchedQuery(count, MAX_CONCURRENT, (index) =>
      this.queryOutput(ip, index)
    );
  }

  /**
   * Query a single output port's label, signal status, and current route.
   */
  private async queryOutput(
    ip: string,
    index: number
  ): Promise<MatrixPort & { routedFrom: number }> {
    const n = index + 1; // 1-based parameter name
    const [labelResult, routeResult] = await Promise.all([
      kumoGet(ip, `eParamID_XPT_Destination${n}_Line_1`),
      kumoGet(ip, `eParamID_XPT_Destination${n}_Status`),
    ]);

    // Route value is already a 0-based source index.
    const routedFrom = routeResult
      ? parseInt(routeResult.value, 10)
      : -1;

    return {
      index,
      label: labelResult?.value ?? `Output ${n}`,
      signal: routeResult !== null, // output is "active" if we can read its route
      routedFrom: Number.isNaN(routedFrom) ? -1 : routedFrom,
    };
  }
}

// ---------------------------------------------------------------------------
// Module-level helpers
// ---------------------------------------------------------------------------

/**
 * Fetch a single parameter value from the AJA KUMO via its REST API.
 */
async function kumoGet(
  ip: string,
  paramId: string
): Promise<{ value: string; value_name: string } | null> {
  try {
    const res = await fetch(
      `http://${ip}/config?action=get&paramid=${paramId}`,
      { signal: AbortSignal.timeout(REQUEST_TIMEOUT) }
    );
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}

/**
 * Parse a boolean-ish string ("1", "true") into a boolean.
 */
function parseBool(value: string | null): boolean {
  if (!value) return false;
  const lower = value.toLowerCase();
  return lower === '1' || lower === 'true';
}

/**
 * Execute `count` async tasks with at most `batchSize` running concurrently.
 * Preserves the original index order in the returned array.
 */
async function batchedQuery<T>(
  count: number,
  batchSize: number,
  fn: (index: number) => Promise<T>
): Promise<T[]> {
  const results: T[] = new Array(count);
  for (let start = 0; start < count; start += batchSize) {
    const end = Math.min(start + batchSize, count);
    const batch = Array.from({ length: end - start }, (_, i) =>
      fn(start + i).then((result) => {
        results[start + i] = result;
      })
    );
    await Promise.all(batch);
  }
  return results;
}
