import { NextRequest, NextResponse } from 'next/server';
import { getAllCollections, setCollections, PERSISTENT_KEYS } from '@/lib/db';

export async function GET() {
  try {
    const data = getAllCollections();
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ hydrated: false });
    }
    return NextResponse.json({ hydrated: true, data });
  } catch (err) {
    console.error('[api/store] GET error:', err);
    return NextResponse.json({ error: 'Failed to read store' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { collections } = body as { collections: Record<string, unknown> };

    if (!collections || typeof collections !== 'object') {
      return NextResponse.json({ error: 'Missing collections object' }, { status: 400 });
    }

    const filtered: Record<string, unknown> = {};
    for (const key of PERSISTENT_KEYS) {
      if (key in collections) {
        filtered[key] = collections[key];
      }
    }

    if (Object.keys(filtered).length === 0) {
      return NextResponse.json({ error: 'No valid collections provided' }, { status: 400 });
    }

    setCollections(filtered);
    return NextResponse.json({ ok: true, written: Object.keys(filtered) });
  } catch (err) {
    console.error('[api/store] POST error:', err);
    return NextResponse.json({ error: 'Failed to write store' }, { status: 500 });
  }
}
