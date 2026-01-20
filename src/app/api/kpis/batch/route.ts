import { NextRequest, NextResponse } from 'next/server';
import { fetchAllClientsScorecardData } from '@/lib/clickhouse';
import type { APIResponse, AllClientsScorecardData } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const view = searchParams.get('view') || 'scorecard';

    if (view !== 'scorecard') {
      const response: APIResponse<null> = {
        success: false,
        error: `Unknown view type: ${view}. Only 'scorecard' is supported.`,
      };
      return NextResponse.json(response, { status: 400 });
    }

    const data = await fetchAllClientsScorecardData();

    const response: APIResponse<AllClientsScorecardData> = {
      success: true,
      data,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Batch KPI API Error:', error);

    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
