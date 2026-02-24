import { v4 as uuidv4 } from 'uuid';
import type { SystemEvent, InAppNotification } from '@/types';

// In-memory queue of recent in-app notifications (session-scoped, not persisted)
const inAppQueue: InAppNotification[] = [];
const MAX_QUEUE_SIZE = 200;

export async function send(event: SystemEvent, _config?: Record<string, unknown>): Promise<void> {
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
  inAppQueue.unshift(notification);
  if (inAppQueue.length > MAX_QUEUE_SIZE) {
    inAppQueue.length = MAX_QUEUE_SIZE;
  }
}

export function getInAppNotifications(): InAppNotification[] {
  return [...inAppQueue];
}

export function markRead(id: string): void {
  const n = inAppQueue.find((n) => n.id === id);
  if (n) n.read = true;
}

export function markAllRead(): void {
  for (const n of inAppQueue) n.read = true;
}

export function dismissNotification(id: string): void {
  const idx = inAppQueue.findIndex((n) => n.id === id);
  if (idx >= 0) inAppQueue.splice(idx, 1);
}
