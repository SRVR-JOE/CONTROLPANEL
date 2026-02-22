'use client';

import { useEffect, useRef } from 'react';
import { useStore } from '@/store';
import { PERSISTENT_KEYS } from '@/store/constants';

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
          // Migration: add column field to slots and rackColumn to devices
          if (body.data.racks) {
            for (const rack of body.data.racks) {
              if (rack.slots && rack.slots.length > 0 && rack.slots[0].column === undefined) {
                rack.slots = rack.slots.map((s: { ru: number; deviceId?: string }) => ({ ...s, column: 0 }));
                // Multi-column racks need additional empty slots for new columns
                const width = rack.width ?? 1;
                if (width > 1) {
                  for (let col = 1; col < width; col++) {
                    for (let ru = 1; ru <= rack.totalRU; ru++) {
                      rack.slots.push({ ru, column: col });
                    }
                  }
                }
              }
            }
          }
          if (body.data.devices) {
            for (const device of body.data.devices) {
              if (device.rackId && device.rackColumn === undefined) {
                device.rackColumn = 0;
              }
            }
          }
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
