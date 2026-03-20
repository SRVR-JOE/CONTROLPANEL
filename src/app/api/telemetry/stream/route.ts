import { telemetryService } from '@/lib/telemetry-service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET() {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>();
  const writer = writable.getWriter();
  const encoder = new TextEncoder();

  // Register with the service so new snapshots are pushed automatically
  telemetryService.addSSEClient(writer);

  // Send an initial comment to establish the connection
  writer.write(encoder.encode(': connected\n\n')).catch(() => {
    /* swallow — client may have already disconnected */
  });

  // Send the latest snapshot immediately so the client has data right away
  const latest = telemetryService.getLatest();
  if (latest) {
    writer.write(encoder.encode(`data: ${JSON.stringify(latest)}\n\n`)).catch(() => {
      /* swallow */
    });
  }

  // Keep-alive ping every 30 s to prevent proxy/LB timeouts
  const keepAlive = setInterval(() => {
    writer.write(encoder.encode(': ping\n\n')).catch(() => {
      clearInterval(keepAlive);
      telemetryService.removeSSEClient(writer);
    });
  }, 30_000);

  // Clean up when the client disconnects (readable is cancelled)
  readable.pipeTo(new WritableStream()).catch(() => {
    /* expected when client disconnects */
  }).finally(() => {
    clearInterval(keepAlive);
    telemetryService.removeSSEClient(writer);
  });

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache, no-transform',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // nginx
    },
  });
}
