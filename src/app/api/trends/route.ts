import { NextRequest, NextResponse } from 'next/server';
import { fetchHistoricalTrends } from '@/lib/clickhouse';
import type { ClientName, APIResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const client = (searchParams.get('client') || 'all') as ClientName | 'all';
    const months = parseInt(searchParams.get('months') || '12', 10);
    const excludeWestlake = searchParams.get('excludeWestlake') === 'true';

    // Validate months parameter
    const validMonths = Math.min(Math.max(months, 3), 24); // Between 3 and 24 months

    const trendData = await fetchHistoricalTrends(client, validMonths, excludeWestlake);

    const response: APIResponse<typeof trendData> = {
      success: true,
      data: trendData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Trends API Error:', error);

    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
