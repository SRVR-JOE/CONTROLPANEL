import { NextRequest, NextResponse } from 'next/server';
import { sendTestNotification } from '@/lib/events/dispatcher';

// In-memory rate limit: channelId -> timestamp of last test request
const testRateLimitMap = new Map<string, number>();
const TEST_RATE_LIMIT_MS = 60000; // 60 seconds

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { channelId } = body;

    if (typeof body.channelId !== 'string' || body.channelId.length > 100) {
      return NextResponse.json({ error: 'Invalid channelId' }, { status: 400 });
    }

    const now = Date.now();
    const lastTest = testRateLimitMap.get(channelId);
    if (lastTest !== undefined && now - lastTest < TEST_RATE_LIMIT_MS) {
      const retryAfterSecs = Math.ceil((TEST_RATE_LIMIT_MS - (now - lastTest)) / 1000);
      return NextResponse.json(
        { error: `Rate limit exceeded. Please wait ${retryAfterSecs} seconds before testing this channel again.` },
        { status: 429, headers: { 'Retry-After': String(retryAfterSecs) } }
      );
    }
    if (testRateLimitMap.size > 1000) testRateLimitMap.clear();
    testRateLimitMap.set(channelId, now);

    const result = await sendTestNotification(channelId);
    return NextResponse.json(result, { status: result.success ? 200 : 400 });
  } catch (err) {
    console.error('POST /api/notifications/test error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
