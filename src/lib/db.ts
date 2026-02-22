import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { PERSISTENT_KEYS, type PersistentKey } from '@/store/constants';

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
