import { NextRequest, NextResponse } from 'next/server';
import { checkRateLimit, getUsageStats } from '@/lib/rate-limiter';

export const dynamic = 'force-dynamic';

function extractIp(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }
  return 'anonymous';
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const ip = extractIp(request);

  const rateLimit = checkRateLimit(ip, 'usage');
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Rate limit exceeded.' },
      { status: 429, headers: rateLimit.headers },
    );
  }

  try {
    const stats = getUsageStats(ip);
    return NextResponse.json(stats, { status: 200, headers: rateLimit.headers });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve usage stats.';
    return NextResponse.json(
      { error: message },
      { status: 500, headers: rateLimit.headers },
    );
  }
}
