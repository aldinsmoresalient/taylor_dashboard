import { NextRequest, NextResponse } from 'next/server';
import {
  fetchPerClientKPIs,
  fetchConsolidatedKPIs,
  fetchPerClientKPIsWithDateRange,
  fetchConsolidatedKPIsWithDateRange,
} from '@/lib/clickhouse';
import { getPeriodConfig } from '@/lib/utils';
import type { ComparisonType, ClientName, APIResponse } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;

    const viewType = searchParams.get('view') || 'per-client'; // 'per-client' | 'consolidated'
    const client = (searchParams.get('client') || 'exeter') as ClientName;
    const month = searchParams.get('month') || new Date().toISOString().slice(0, 7);
    const excludeWestlake = searchParams.get('excludeWestlake') === 'true';

    // New period-based parameters
    const periodType = searchParams.get('periodType') as ComparisonType | null;
    const referenceDateStr = searchParams.get('referenceDate');

    let responseData: unknown;

    // Use new period-based logic if periodType is provided
    if (periodType && referenceDateStr) {
      const referenceDate = new Date(referenceDateStr);

      // Get the period config which includes current and comparison ranges
      const periodConfig = getPeriodConfig(periodType, referenceDate);

      if (viewType === 'per-client') {
        responseData = await fetchPerClientKPIsWithDateRange(
          client,
          periodConfig.currentRange,
          periodConfig.comparisonRange,
          periodType
        );
      } else {
        responseData = await fetchConsolidatedKPIsWithDateRange(
          periodConfig.currentRange,
          periodConfig.comparisonRange,
          periodType,
          excludeWestlake
        );
      }
    } else {
      // Legacy monthly logic
      if (viewType === 'per-client') {
        responseData = await fetchPerClientKPIs(client, month);
      } else {
        responseData = await fetchConsolidatedKPIs(month, excludeWestlake);
      }
    }

    const response: APIResponse<typeof responseData> = {
      success: true,
      data: responseData,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('KPI API Error:', error);

    const response: APIResponse<null> = {
      success: false,
      error: error instanceof Error ? error.message : 'An unknown error occurred',
    };

    return NextResponse.json(response, { status: 500 });
  }
}
