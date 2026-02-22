'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';

const PERSISTENT_KEYS = [
  'devices', 'racks', 'routers', 'bromptonStatuses',
  'pinBoards', 'matrixPresets', 'systemPresets', 'disguiseSessions',
];

export function StoreHydrator() {
  const hydrate = useStore((s) => s._hydrate);
  const isHydrated = useStore((s) => s._isHydrated);
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current || isHydrated) return;
    attempted.current = true;

    fetch('/api/store')
      .then((res) => res.json())
      .then((body) => {
        if (body.hydrated && body.data) {
          hydrate(body.data);
        } else {
          // First run: seed the database with current mock data
          const state = useStore.getState();
          const seed: Record<string, unknown> = {};
          for (const key of PERSISTENT_KEYS) {
            seed[key] = (state as unknown as Record<string, unknown>)[key];
          }
          fetch('/api/store', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ collections: seed }),
          }).catch(console.warn);
          hydrate({});
        }
      })
      .catch((err) => {
        console.warn('[StoreHydrator] Failed to load from DB, using seed data:', err);
        hydrate({});
      });
  }, [hydrate, isHydrated]);

  return null;
}
