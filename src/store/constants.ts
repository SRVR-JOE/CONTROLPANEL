// Single source of truth for persistent store keys.
// Imported by: src/store/index.ts, src/components/StoreHydrator.tsx, src/lib/db.ts
// Must remain free of server-only imports so it can be used in client components.

export const PERSISTENT_KEYS = [
  'devices',
  'racks',
  'routers',
  'bromptonStatuses',
  'pinBoards',
  'matrixPresets',
  'systemPresets',
  'disguiseSessions',
] as const;

export type PersistentKey = (typeof PERSISTENT_KEYS)[number];
