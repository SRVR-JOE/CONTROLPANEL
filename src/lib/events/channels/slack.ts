import type { SystemEvent } from '@/types';

export async function send(event: SystemEvent, config: Record<string, unknown>): Promise<void> {
  const webhookUrl = config.webhookUrl as string | undefined;
  if (!webhookUrl) {
    throw new Error('Slack webhook URL not configured');
  }

  const severityEmoji: Record<string, string> = {
    critical: ':rotating_light:',
    error: ':x:',
    warning: ':warning:',
    info: ':information_source:',
  };

  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  const payload = {
    attachments: [
      {
        color: severityColors[event.severity] || '#6b7280',
        blocks: [
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `${severityEmoji[event.severity] || ''} *${event.title}*\n${event.message}`,
            },
          },
          {
            type: 'context',
            elements: [
              { type: 'mrkdwn', text: `*Device:* ${event.deviceName}` },
              { type: 'mrkdwn', text: `*Type:* ${event.eventType.replace('_', ' ')}` },
              { type: 'mrkdwn', text: `*Time:* ${new Date(event.createdAt).toLocaleString()}` },
            ],
          },
        ],
      },
    ],
  };

  const res = await fetch(webhookUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`Slack webhook returned ${res.status}: ${await res.text()}`);
  }
}
