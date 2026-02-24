import type { SystemEvent } from '@/types';

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

export async function send(event: SystemEvent, config: Record<string, unknown>): Promise<void> {
  // Dynamic import to avoid build issues when nodemailer isn't configured
  const nodemailer = await import('nodemailer');

  const host = process.env.SMTP_HOST;
  const port = parseInt(process.env.SMTP_PORT || '587', 10);
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user;

  if (!host || !user || !pass) {
    throw new Error('Email not configured: missing SMTP_HOST, SMTP_USER, or SMTP_PASS');
  }

  const recipients = config.recipients as string[] | undefined;
  if (!recipients || recipients.length === 0) {
    throw new Error('No email recipients configured');
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });

  const severityColors: Record<string, string> = {
    critical: '#dc2626',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
  };

  await transporter.sendMail({
    from,
    to: recipients.join(', '),
    subject: `[AV CTRL] [${event.severity.toUpperCase()}] ${event.title}`,
    html: `
      <div style="font-family: sans-serif; max-width: 600px;">
        <div style="background: ${severityColors[event.severity] || '#6b7280'}; color: white; padding: 12px 16px; border-radius: 8px 8px 0 0;">
          <strong>${escapeHtml(event.severity.toUpperCase())}</strong> — ${escapeHtml(event.eventType.replace(/_/g, ' '))}
        </div>
        <div style="border: 1px solid #e5e7eb; border-top: none; padding: 16px; border-radius: 0 0 8px 8px;">
          <h2 style="margin: 0 0 8px 0;">${escapeHtml(event.title)}</h2>
          <p style="color: #6b7280; margin: 0 0 12px 0;">${escapeHtml(event.message)}</p>
          <table style="font-size: 14px; color: #374151;">
            <tr><td style="padding: 2px 12px 2px 0; color: #9ca3af;">Device</td><td>${escapeHtml(event.deviceName)}</td></tr>
            <tr><td style="padding: 2px 12px 2px 0; color: #9ca3af;">Time</td><td>${new Date(event.createdAt).toLocaleString()}</td></tr>
          </table>
        </div>
      </div>
    `,
  });
}
