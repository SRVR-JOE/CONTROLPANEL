import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PERSISTENT_KEYS, type PersistentKey } from '@/store/constants';
import type { SystemEvent, EventQueryParams, EventQueryResult, NotificationChannelConfig, EventSettings } from '@/types';

export { PERSISTENT_KEYS, type PersistentKey };

function resolveDataDir(): string {
  if (process.env.DATA_DIR) return process.env.DATA_DIR;
  const base = process.cwd();
  return path.join(base, 'data');
}

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (_db) return _db;

  const dataDir = resolveDataDir();
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, 'controlpanel.db');
  _db = new Database(dbPath);

  _db.pragma('journal_mode = WAL');

  _db.exec(`
    CREATE TABLE IF NOT EXISTS collections (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS events (
      id            TEXT PRIMARY KEY,
      device_id     TEXT NOT NULL,
      device_name   TEXT NOT NULL,
      event_type    TEXT NOT NULL,
      severity      TEXT NOT NULL,
      title         TEXT NOT NULL,
      message       TEXT NOT NULL,
      metadata      TEXT,
      acknowledged  INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE INDEX IF NOT EXISTS idx_events_device ON events(device_id);
    CREATE INDEX IF NOT EXISTS idx_events_created ON events(created_at);
    CREATE INDEX IF NOT EXISTS idx_events_type ON events(event_type);
    CREATE INDEX IF NOT EXISTS idx_events_severity ON events(severity);

    CREATE TABLE IF NOT EXISTS notification_config (
      id            TEXT PRIMARY KEY,
      channel       TEXT NOT NULL,
      enabled       INTEGER NOT NULL DEFAULT 0,
      config        TEXT NOT NULL,
      event_types   TEXT NOT NULL,
      severities    TEXT NOT NULL,
      rate_limit_ms INTEGER NOT NULL DEFAULT 300000,
      updated_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return _db;
}

export function getCollection<T>(key: PersistentKey): T | null {
  const db = getDb();
  const row = db.prepare('SELECT value FROM collections WHERE key = ?').get(key) as
    | { value: string }
    | undefined;
  if (!row) return null;
  return JSON.parse(row.value) as T;
}

export function getAllCollections(): Record<string, unknown> {
  const db = getDb();
  const rows = db.prepare('SELECT key, value FROM collections').all() as {
    key: string;
    value: string;
  }[];
  const result: Record<string, unknown> = {};
  for (const row of rows) {
    result[row.key] = JSON.parse(row.value);
  }
  return result;
}

export function setCollections(data: Record<string, unknown>): void {
  const db = getDb();
  const upsert = db.prepare(`
    INSERT INTO collections (key, value, updated_at)
    VALUES (?, ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `);
  const tx = db.transaction((entries: [string, unknown][]) => {
    for (const [key, value] of entries) {
      upsert.run(key, JSON.stringify(value));
    }
  });
  tx(Object.entries(data));
}

// ============================================================
// Event CRUD
// ============================================================

let _lastRetentionCleanup = 0;
const RETENTION_CLEANUP_INTERVAL = 60000; // 1 minute

export function insertEvent(event: SystemEvent): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO events (id, device_id, device_name, event_type, severity, title, message, metadata, acknowledged, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    event.id,
    event.deviceId,
    event.deviceName,
    event.eventType,
    event.severity,
    event.title,
    event.message,
    JSON.stringify(event.metadata),
    event.acknowledged ? 1 : 0,
    event.createdAt
  );
}

export function queryEvents(params: EventQueryParams): EventQueryResult {
  const db = getDb();
  const conditions: string[] = [];
  const values: unknown[] = [];

  if (params.eventTypes && params.eventTypes.length > 0) {
    conditions.push(`event_type IN (${params.eventTypes.map(() => '?').join(', ')})`);
    values.push(...params.eventTypes);
  }
  if (params.severities && params.severities.length > 0) {
    conditions.push(`severity IN (${params.severities.map(() => '?').join(', ')})`);
    values.push(...params.severities);
  }
  if (params.deviceIds && params.deviceIds.length > 0) {
    conditions.push(`device_id IN (${params.deviceIds.map(() => '?').join(', ')})`);
    values.push(...params.deviceIds);
  }
  if (params.search) {
    conditions.push(`(title LIKE ? OR message LIKE ? OR device_name LIKE ?)`);
    const like = `%${params.search}%`;
    values.push(like, like, like);
  }
  if (params.startDate) {
    conditions.push(`created_at >= ?`);
    values.push(params.startDate);
  }
  if (params.endDate) {
    conditions.push(`created_at <= ?`);
    values.push(params.endDate);
  }

  const where = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  const page = Math.max(1, params.page ?? 1);
  const pageSize = Math.min(200, Math.max(1, params.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  const countRow = db.prepare(`SELECT COUNT(*) as cnt FROM events ${where}`).get(values) as { cnt: number };
  const total = countRow.cnt;

  const rows = db.prepare(
    `SELECT * FROM events ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`
  ).all([...values, pageSize, offset]) as Array<{
    id: string; device_id: string; device_name: string; event_type: string;
    severity: string; title: string; message: string; metadata: string;
    acknowledged: number; created_at: string;
  }>;

  const events: SystemEvent[] = rows.map((r) => ({
    id: r.id,
    deviceId: r.device_id,
    deviceName: r.device_name,
    eventType: r.event_type as SystemEvent['eventType'],
    severity: r.severity as SystemEvent['severity'],
    title: r.title,
    message: r.message,
    metadata: r.metadata ? JSON.parse(r.metadata) : {},
    acknowledged: r.acknowledged === 1,
    createdAt: r.created_at,
  }));

  return { events, total, page, pageSize, totalPages: Math.ceil(total / pageSize) };
}

export function acknowledgeEvents(ids: string[]): void {
  if (ids.length === 0) return;
  const db = getDb();
  const placeholders = ids.map(() => '?').join(', ');
  db.prepare(`UPDATE events SET acknowledged = 1 WHERE id IN (${placeholders})`).run(...ids);
}

export function acknowledgeAllEvents(): void {
  const db = getDb();
  db.prepare(`UPDATE events SET acknowledged = 1`).run();
}

export function deleteOldEvents(retentionDays: number): number {
  const now = Date.now();
  if (now - _lastRetentionCleanup < RETENTION_CLEANUP_INTERVAL) return 0;
  _lastRetentionCleanup = now;
  const db = getDb();
  const cutoff = new Date(Date.now() - retentionDays * 86400 * 1000).toISOString();
  const result = db.prepare('DELETE FROM events WHERE created_at < ?').run(cutoff);
  return result.changes;
}

// ============================================================
// Notification Config CRUD
// ============================================================

export function getNotificationConfigs(): NotificationChannelConfig[] {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM notification_config').all() as Array<{
    id: string; channel: string; enabled: number; config: string;
    event_types: string; severities: string; rate_limit_ms: number; updated_at: string;
  }>;
  return rows.map((r) => ({
    id: r.id,
    channel: r.channel as NotificationChannelConfig['channel'],
    enabled: r.enabled === 1,
    config: JSON.parse(r.config),
    eventTypes: JSON.parse(r.event_types),
    severities: JSON.parse(r.severities),
    rateLimitMs: r.rate_limit_ms,
  }));
}

export function upsertNotificationConfig(cfg: NotificationChannelConfig): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO notification_config (id, channel, enabled, config, event_types, severities, rate_limit_ms, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
    ON CONFLICT(id) DO UPDATE SET
      channel = excluded.channel,
      enabled = excluded.enabled,
      config = excluded.config,
      event_types = excluded.event_types,
      severities = excluded.severities,
      rate_limit_ms = excluded.rate_limit_ms,
      updated_at = excluded.updated_at
  `).run(
    cfg.id,
    cfg.channel,
    cfg.enabled ? 1 : 0,
    JSON.stringify(cfg.config),
    JSON.stringify(cfg.eventTypes),
    JSON.stringify(cfg.severities),
    cfg.rateLimitMs
  );
}

export function deleteNotificationConfig(id: string): void {
  const db = getDb();
  db.prepare('DELETE FROM notification_config WHERE id = ?').run(id);
}

// ============================================================
// Event Settings (stored in collections table)
// ============================================================

const DEFAULT_EVENT_SETTINGS: EventSettings = {
  retentionDays: 30,
  temperatureThresholds: { warning: 55, critical: 70 },
  gpuTemperatureThresholds: { warning: 75, critical: 90 },
  flappingCooldownMs: 60000,
};

export function getEventSettings(): EventSettings {
  const db = getDb();
  const row = db.prepare('SELECT value FROM collections WHERE key = ?').get('eventSettings') as
    | { value: string }
    | undefined;
  if (!row) return DEFAULT_EVENT_SETTINGS;
  const stored = JSON.parse(row.value) as Partial<EventSettings>;
  // FIX 4: deep-merge nested threshold objects instead of shallow spread
  return {
    ...DEFAULT_EVENT_SETTINGS,
    ...stored,
    temperatureThresholds: { ...DEFAULT_EVENT_SETTINGS.temperatureThresholds, ...(stored?.temperatureThresholds || {}) },
    gpuTemperatureThresholds: { ...DEFAULT_EVENT_SETTINGS.gpuTemperatureThresholds, ...(stored?.gpuTemperatureThresholds || {}) },
  };
}

export function setEventSettings(settings: EventSettings): void {
  const db = getDb();
  db.prepare(`
    INSERT INTO collections (key, value, updated_at)
    VALUES ('eventSettings', ?, datetime('now'))
    ON CONFLICT(key) DO UPDATE SET
      value = excluded.value,
      updated_at = excluded.updated_at
  `).run(JSON.stringify(settings));
}
