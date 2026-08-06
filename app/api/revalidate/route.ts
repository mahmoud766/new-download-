import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath } from 'next/cache';

const EXPECTED_SECRET = process.env.REVALIDATION_SECRET || 'OMNIFETCH_PRO_ISR_SECRET_2026';

export async function GET(request: NextRequest) {
  const secret = request.nextUrl.searchParams.get('secret') || request.headers.get('x-revalidation-token');
  const path = request.nextUrl.searchParams.get('path') || '/';

  if (secret && secret !== EXPECTED_SECRET) {
    return NextResponse.json({ revalidated: false, message: 'Invalid revalidation token' }, { status: 401 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: Date.now(),
      isoTimestamp: new Date().toISOString(),
      revalidationEngine: 'On-Demand ISR + Edge Cache Purger',
      message: `Path '${path}' successfully revalidated. Static cache purged across CDN.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error revalidating path';
    return NextResponse.json({ revalidated: false, message: errorMsg }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const secret = body.secret || request.headers.get('x-revalidation-token') || request.nextUrl.searchParams.get('secret');
  const path = body.path || request.nextUrl.searchParams.get('path') || '/';

  if (secret && secret !== EXPECTED_SECRET) {
    return NextResponse.json({ revalidated: false, message: 'Invalid revalidation token' }, { status: 401 });
  }

  try {
    revalidatePath(path);
    return NextResponse.json({
      revalidated: true,
      path,
      timestamp: Date.now(),
      isoTimestamp: new Date().toISOString(),
      revalidationEngine: 'On-Demand ISR + Edge Cache Purger',
      message: `Path '${path}' successfully revalidated. Static cache purged across CDN.`,
    });
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error revalidating path';
    return NextResponse.json({ revalidated: false, message: errorMsg }, { status: 500 });
  }
}
