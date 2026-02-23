import type { SystemEvent } from '@/types';

export async function send(event: SystemEvent, config: Record<string, unknown>): Promise<void> {
  const accountSid = process.env.TWILIO_ACCOUNT_SID;
  const authToken = process.env.TWILIO_AUTH_TOKEN;
  const fromNumber = process.env.TWILIO_FROM_NUMBER;

  if (!accountSid || !authToken || !fromNumber) {
    throw new Error('SMS not configured: missing TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, or TWILIO_FROM_NUMBER');
  }

  const recipients = config.recipients as string[] | undefined;
  if (!recipients || recipients.length === 0) {
    throw new Error('No SMS recipients configured');
  }

  const twilio = await import('twilio');
  const client = twilio.default(accountSid, authToken);

  const body = `[AV CTRL] ${event.severity.toUpperCase()}: ${event.title}\n${event.message}`;

  await Promise.all(
    recipients.map((to) =>
      client.messages.create({ body, from: fromNumber, to })
    )
  );
}
