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

  // Truncate to stay within SMS segment limits
  const MAX_SMS_BODY = 1550;
  const rawBody = `[LUMINEX] ${event.severity.toUpperCase()}: ${event.title}\n${event.message}`;
  const body = rawBody.length > MAX_SMS_BODY ? rawBody.slice(0, MAX_SMS_BODY) + '...' : rawBody;

  const results = await Promise.allSettled(
    recipients.map((to) =>
      client.messages.create({ body, from: fromNumber, to })
    )
  );

  // Throw when all deliveries fail; warn on partial failures
  const failures = results.filter((r) => r.status === 'rejected') as PromiseRejectedResult[];
  if (failures.length === recipients.length) {
    throw new Error(`All SMS deliveries failed: ${failures.map(f => String(f.reason)).join('; ')}`);
  }
  if (failures.length > 0) {
    console.error(`[SMS] ${failures.length}/${recipients.length} failed: ${failures.map(f => String(f.reason)).join('; ')}`);
  }
}
