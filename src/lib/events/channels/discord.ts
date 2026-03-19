import type { SystemEvent } from '@/types';
import { SEVERITY_COLORS } from '@/lib/constants';

export async function send(event: SystemEvent, config: Record<string, unknown>): Promise<void> {
  const webhookUrl = config.webhookUrl as string | undefined;
  if (!webhookUrl) {
    throw new Error('Discord webhook URL not configured');
  }

  // Discord embeds require integer colors. Values are derived from SEVERITY_COLORS
  // (the canonical hex source) via parseInt so they stay in sync automatically.
  const severityColors: Record<string, number> = {
    critical: parseInt(SEVERITY_COLORS.critical.slice(1), 16),
    error:    parseInt(SEVERITY_COLORS.error.slice(1),    16),
    warning:  parseInt(SEVERITY_COLORS.warning.slice(1),  16),
    info:     parseInt(SEVERITY_COLORS.info.slice(1),     16),
  };

  const payload = {
    embeds: [
      {
        title: event.title,
        description: event.message,
        color: severityColors[event.severity] ?? 0x6b7280,
        fields: [
          { name: 'Device', value: event.deviceName, inline: true },
          { name: 'Type', value: event.eventType.replace(/_/g, ' '), inline: true },
          { name: 'Severity', value: event.severity.toUpperCase(), inline: true },
        ],
        timestamp: event.createdAt,
        footer: { text: 'Virtual Rack' },
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Discord webhook returned ${res.status}: ${await res.text()}`);
  }
}
