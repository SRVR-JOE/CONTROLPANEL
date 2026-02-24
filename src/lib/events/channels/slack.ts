import type { SystemEvent } from '@/types';
import { SEVERITY_COLORS } from '@/lib/constants';

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

  const payload = {
    // Top-level text is a brief fallback for notifications; detail lives in the attachment
    text: `[${event.severity.toUpperCase()}] ${event.title}`,
    attachments: [
      {
        color: SEVERITY_COLORS[event.severity] || '#6b7280',
        fallback: `[${event.severity.toUpperCase()}] ${event.title}`,
        text: `${severityEmoji[event.severity] || ''} *${event.title}*\n${event.message}`,
        mrkdwn_in: ['text'],
        fields: [
          { title: 'Device', value: event.deviceName, short: true },
          { title: 'Type', value: event.eventType.replace(/_/g, ' '), short: true },
          { title: 'Time', value: new Date(event.createdAt).toLocaleString(), short: true },
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
