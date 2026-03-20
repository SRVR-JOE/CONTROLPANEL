// ============================================================
// TelemetryService — Server-side singleton for device telemetry
// ============================================================

import fs from 'fs';
import path from 'path';
import { getAdapter } from '@/lib/device-adapters';
import type { DeviceManufacturer } from '@/types';
import type { TelemetrySnapshot, ServerSnapshot, TelemetryConfig } from '@/lib/telemetry-types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/** Minimal device descriptor needed to poll a device */
export interface TrackedDevice {
  id: string;
  name: string;
  ip: string;
  manufacturer: DeviceManufacturer;
  port?: number;
}

type SSEWriter = WritableStreamDefaultWriter<Uint8Array>;

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const MAX_SNAPSHOTS = 2880; // 24 h at 30 s interval
const DEFAULT_POLL_MS = 30_000;
const DEFAULT_RETENTION_MS = 24 * 60 * 60 * 1000; // 24 h
const PERSIST_INTERVAL_MS = 5 * 60 * 1000; // 5 min
const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'telemetry-data.json');

// ---------------------------------------------------------------------------
// TelemetryService
// ---------------------------------------------------------------------------

class TelemetryService {
  private snapshots: TelemetrySnapshot[] = [];
  private trackedDevices: TrackedDevice[] = [];
  private pollTimer: ReturnType<typeof setInterval> | null = null;
  private persistTimer: ReturnType<typeof setInterval> | null = null;
  private sseClients: Set<SSEWriter> = new Set();
  private loaded = false;

  config: TelemetryConfig = {
    pollIntervalMs: DEFAULT_POLL_MS,
    retentionMs: DEFAULT_RETENTION_MS,
  };

  // -----------------------------------------------------------------------
  // Lifecycle
  // -----------------------------------------------------------------------

  /** Start the polling loop. Safe to call multiple times (restarts). */
  start(pollIntervalMs?: number): void {
    this.stop();

    if (pollIntervalMs !== undefined) {
      this.config.pollIntervalMs = pollIntervalMs;
    }

    this.ensureLoaded();

    // Polling
    this.pollTimer = setInterval(() => {
      this.takeSnapshot().catch((err) =>
        console.error('[TelemetryService] snapshot error:', err)
      );
    }, this.config.pollIntervalMs);

    // Persistence
    this.persistTimer = setInterval(() => {
      this.persistToDisk();
    }, PERSIST_INTERVAL_MS);

    console.log(
      `[TelemetryService] started — polling ${this.trackedDevices.length} device(s) every ${this.config.pollIntervalMs}ms`
    );
  }

  /** Stop polling and persistence timers. */
  stop(): void {
    if (this.pollTimer) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
    if (this.persistTimer) {
      clearInterval(this.persistTimer);
      this.persistTimer = null;
    }
    // Final persist on stop
    this.persistToDisk();
    console.log('[TelemetryService] stopped');
  }

  /** Whether the polling loop is active. */
  get isRunning(): boolean {
    return this.pollTimer !== null;
  }

  // -----------------------------------------------------------------------
  // Device management
  // -----------------------------------------------------------------------

  /** Set the list of devices to track. */
  setDevices(devices: TrackedDevice[]): void {
    this.trackedDevices = devices;
    console.log(
      `[TelemetryService] tracking ${devices.length} device(s):`,
      devices.map((d) => d.id)
    );
  }

  /** Convenience — set devices from an array of plain device IDs + metadata. */
  setDeviceIds(
    deviceIds: string[],
    resolver: (id: string) => TrackedDevice | undefined
  ): void {
    const resolved = deviceIds
      .map(resolver)
      .filter((d): d is TrackedDevice => d !== undefined);
    this.setDevices(resolved);
  }

  getTrackedDeviceIds(): string[] {
    return this.trackedDevices.map((d) => d.id);
  }

  // -----------------------------------------------------------------------
  // Snapshot
  // -----------------------------------------------------------------------

  /** Poll all tracked devices and record a snapshot. */
  async takeSnapshot(): Promise<TelemetrySnapshot> {
    this.ensureLoaded();

    const servers: ServerSnapshot[] = await Promise.all(
      this.trackedDevices.map(async (device) => {
        try {
          const adapter = getAdapter(device.manufacturer);
          const result = await adapter.queryHealth(device.ip, device.port);

          let status: ServerSnapshot['status'];
          if (!result.reachable) {
            status = 'offline';
          } else if (!result.health) {
            status = 'warning';
          } else if (result.health.errors.length > 0) {
            status = 'error';
          } else if (result.health.warnings.length > 0) {
            status = 'warning';
          } else {
            status = 'online';
          }

          const h = result.health;
          return {
            deviceId: device.id,
            deviceName: device.name,
            ip: device.ip,
            manufacturer: device.manufacturer,
            status,
            temperature: h?.temperature ?? 0,
            cpuUsage: h?.cpuUsage,
            memoryUsage: h?.memoryUsage,
            gpuUsage: h?.gpuUsage,
            gpuTemp: h?.gpuTemp,
            fanSpeed: h?.fanSpeed,
            powerDraw: h?.powerDraw,
            uptime: h?.uptime ?? 0,
            temperatures: h?.temperatures,
            fans: h?.fans,
            psu1: h?.psu1,
            psu2: h?.psu2,
            errors: h?.errors ?? (result.errors ?? []),
            warnings: h?.warnings ?? [],
          } satisfies ServerSnapshot;
        } catch (err) {
          return {
            deviceId: device.id,
            deviceName: device.name,
            ip: device.ip,
            manufacturer: device.manufacturer,
            status: 'offline' as const,
            temperature: 0,
            uptime: 0,
            errors: [err instanceof Error ? err.message : String(err)],
            warnings: [],
          } satisfies ServerSnapshot;
        }
      })
    );

    const snapshot: TelemetrySnapshot = {
      timestamp: Date.now(),
      servers,
    };

    // Ring buffer — push and trim
    this.snapshots.push(snapshot);
    if (this.snapshots.length > MAX_SNAPSHOTS) {
      this.snapshots = this.snapshots.slice(-MAX_SNAPSHOTS);
    }

    // Push to SSE clients
    this.broadcastSnapshot(snapshot);

    return snapshot;
  }

  // -----------------------------------------------------------------------
  // Queries
  // -----------------------------------------------------------------------

  /** Return snapshots newer than the given epoch-ms cutoff. */
  getHistory(sinceMs: number): TelemetrySnapshot[] {
    this.ensureLoaded();
    return this.snapshots.filter((s) => s.timestamp >= sinceMs);
  }

  /** Return the most recent snapshot, or null if none. */
  getLatest(): TelemetrySnapshot | null {
    this.ensureLoaded();
    return this.snapshots.length > 0
      ? this.snapshots[this.snapshots.length - 1]
      : null;
  }

  // -----------------------------------------------------------------------
  // SSE
  // -----------------------------------------------------------------------

  addSSEClient(writer: SSEWriter): void {
    this.sseClients.add(writer);
    console.log(`[TelemetryService] SSE client added (${this.sseClients.size} total)`);
  }

  removeSSEClient(writer: SSEWriter): void {
    this.sseClients.delete(writer);
    console.log(`[TelemetryService] SSE client removed (${this.sseClients.size} total)`);
  }

  private broadcastSnapshot(snapshot: TelemetrySnapshot): void {
    const payload = `data: ${JSON.stringify(snapshot)}\n\n`;
    const encoded = new TextEncoder().encode(payload);

    this.sseClients.forEach((writer) => {
      writer.write(encoded).catch(() => {
        // Client disconnected — clean up
        this.sseClients.delete(writer);
      });
    });
  }

  // -----------------------------------------------------------------------
  // Persistence
  // -----------------------------------------------------------------------

  private ensureLoaded(): void {
    if (this.loaded) return;
    this.loaded = true;
    this.loadFromDisk();
  }

  private loadFromDisk(): void {
    try {
      if (!fs.existsSync(DATA_FILE)) return;
      const raw = fs.readFileSync(DATA_FILE, 'utf-8');
      const parsed: TelemetrySnapshot[] = JSON.parse(raw);
      if (!Array.isArray(parsed)) return;

      // Prune data older than retention window
      const cutoff = Date.now() - this.config.retentionMs;
      this.snapshots = parsed.filter((s) => s.timestamp >= cutoff);
      console.log(
        `[TelemetryService] loaded ${this.snapshots.length} snapshot(s) from disk`
      );
    } catch (err) {
      console.error('[TelemetryService] failed to load persisted data:', err);
    }
  }

  private persistToDisk(): void {
    if (this.snapshots.length === 0) return;
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.snapshots), 'utf-8');
    } catch (err) {
      console.error('[TelemetryService] failed to persist data:', err);
    }
  }
}

// ---------------------------------------------------------------------------
// Singleton
// ---------------------------------------------------------------------------

const globalForTelemetry = globalThis as unknown as {
  __telemetryService?: TelemetryService;
};

export const telemetryService: TelemetryService =
  globalForTelemetry.__telemetryService ??
  (globalForTelemetry.__telemetryService = new TelemetryService());
