import type { SystemEvent } from '@/types';
import { getNotificationConfigs } from '@/lib/db';
import { getChannelSender } from './channels';
import { shouldNotify } from './detector';

// Rate limit tracking per channel config
const lastSentTime = new Map<string, number>();

export async function dispatchAll(events: SystemEvent[], flappingCooldownMs: number): Promise<void> {
  if (events.length === 0) return;

  let configs;
  try {
    configs = getNotificationConfigs();
  } catch {
    return; // DB not ready or no configs
  }

  for (const event of events) {
    for (const cfg of configs) {
      if (!cfg.enabled) continue;
      if (!cfg.eventTypes.includes(event.eventType)) continue;
      if (!cfg.severities.includes(event.severity)) continue;

      // Flapping cooldown check (event always recorded in DB, but notifications suppressed)
      if (!shouldNotify(event.deviceId, event.eventType, flappingCooldownMs)) continue;

      // Per-channel rate limit
      const rateKey = cfg.id;
      const lastSent = lastSentTime.get(rateKey);
      const now = Date.now();
      if (lastSent && now - lastSent < cfg.rateLimitMs) continue;
      lastSentTime.set(rateKey, now);

      try {
        const sender = getChannelSender(cfg.channel);
        await sender.send(event, cfg.config);
      } catch (err) {
        console.error(`[Dispatcher] Failed to send ${cfg.channel} notification:`, err);
        // Notifications are best-effort — never throw
      }
    }
  }
}

export async function sendTestNotification(channelId: string): Promise<{ success: boolean; error?: string }> {
  let configs;
  try {
    configs = getNotificationConfigs();
  } catch {
    return { success: false, error: 'Failed to read notification configs' };
  }

  const cfg = configs.find((c) => c.id === channelId);
  if (!cfg) return { success: false, error: 'Channel config not found' };

  const testEvent: SystemEvent = {
    id: 'test-notification',
    deviceId: 'test-device',
    deviceName: 'Test Device',
    eventType: 'status_change',
    severity: 'info',
    title: 'Test Notification',
    message: 'This is a test notification from AV Rack Control Panel. If you receive this, the channel is configured correctly.',
    metadata: { test: true },
    acknowledged: false,
    createdAt: new Date().toISOString(),
  };

  try {
    const sender = getChannelSender(cfg.channel);
    await sender.send(testEvent, cfg.config);
    return { success: true };
  } catch (err) {
    return { success: false, error: err instanceof Error ? err.message : String(err) };
  }
}
