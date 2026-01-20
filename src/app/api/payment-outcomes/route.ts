import { NextRequest, NextResponse } from 'next/server';
import { fetchPaymentOutcomes } from '@/lib/clickhouse';
import type { ClientName } from '@/types';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const client = searchParams.get('client') || 'all';
  const startDate = searchParams.get('startDate');
  const endDate = searchParams.get('endDate');
  const excludeWestlake = searchParams.get('excludeWestlake') === 'true';

  if (!startDate || !endDate) {
    return NextResponse.json(
      { success: false, error: 'startDate and endDate are required' },
      { status: 400 }
    );
  }

  try {
    const data = await fetchPaymentOutcomes(
      client as ClientName | 'all',
      `${startDate} 00:00:00`,
      `${endDate} 23:59:59`,
      excludeWestlake
    );

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error fetching payment outcomes:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch payment outcomes' },
      { status: 500 }
    );
  }
}
