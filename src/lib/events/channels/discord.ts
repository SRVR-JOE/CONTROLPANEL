import type { SystemEvent } from '@/types';

export async function send(event: SystemEvent, config: Record<string, unknown>): Promise<void> {
  const webhookUrl = config.webhookUrl as string | undefined;
  if (!webhookUrl) {
    throw new Error('Discord webhook URL not configured');
  }

  const severityColors: Record<string, number> = {
    critical: 0xdc2626,
    error: 0xef4444,
    warning: 0xf59e0b,
    info: 0x3b82f6,
  };

  const payload = {
    embeds: [
      {
        title: event.title,
        description: event.message,
        color: severityColors[event.severity] || 0x6b7280,
        fields: [
          { name: 'Device', value: event.deviceName, inline: true },
          { name: 'Type', value: event.eventType.replace('_', ' '), inline: true },
          { name: 'Severity', value: event.severity.toUpperCase(), inline: true },
        ],
        timestamp: event.createdAt,
        footer: { text: 'AV Rack Control Panel' },
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
