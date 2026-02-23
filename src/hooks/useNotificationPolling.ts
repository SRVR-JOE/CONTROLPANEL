'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '@/store';
import { triggerToast } from '@/components/notifications/ToastContainer';
import type { SystemEvent, InAppNotification } from '@/types';
import { v4 as uuidv4 } from 'uuid';

const POLL_INTERVAL = 10000; // 10 seconds

export function useNotificationPolling(enabled = true) {
  const addNotification = useStore((s) => s.addNotification);
  const addNotificationRef = useRef(addNotification);
  addNotificationRef.current = addNotification;

  const seenEventIds = useRef(new Set<string>());
  const lastPollTime = useRef<string>(new Date().toISOString());
  const isPollingRef = useRef(false);

  const poll = useCallback(async () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    try {
      const res = await fetch(`/api/events?pageSize=20&startDate=${encodeURIComponent(lastPollTime.current)}`);
      if (!res.ok) return;

      const data = await res.json();
      const events: SystemEvent[] = data.events || [];

      lastPollTime.current = new Date().toISOString();

      for (const event of events) {
        if (seenEventIds.current.has(event.id)) continue;
        seenEventIds.current.add(event.id);

        // Add to store as InAppNotification
        const notification: InAppNotification = {
          id: uuidv4(),
          eventId: event.id,
          title: event.title,
          message: event.message,
          severity: event.severity,
          deviceId: event.deviceId,
          deviceName: event.deviceName,
          read: false,
          createdAt: event.createdAt,
        };
        addNotificationRef.current(notification);

        // Trigger toast
        triggerToast({
          title: event.title,
          message: event.message,
          severity: event.severity,
        });
      }

      // Keep seen set bounded
      if (seenEventIds.current.size > 1000) {
        const arr = Array.from(seenEventIds.current);
        seenEventIds.current = new Set(arr.slice(-500));
      }
    } catch {
      // Silently ignore polling errors
    } finally {
      isPollingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!enabled) return;

    // Initial poll after short delay to let the app initialize
    const initialTimer = setTimeout(poll, 2000);

    const interval = setInterval(poll, POLL_INTERVAL);
    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, [enabled, poll]);
}
