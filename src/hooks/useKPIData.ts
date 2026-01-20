'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { formatDateForQuery, getPeriodConfig } from '@/lib/utils';
import { fetchWithRetry, getErrorMessage } from '@/lib/fetchWithRetry';
import type {
  PerClientViewData,
  ConsolidatedViewData,
  ClientName,
  APIResponse,
  ComparisonType,
  AllClientsScorecardData,
} from '@/types';

// Request timeout in ms (60s for historical trends with many months)
const REQUEST_TIMEOUT = 60000;

// Hook for per-client data with flexible period types
export function usePerClientDataWithPeriod(
  client: ClientName,
  periodType: ComparisonType,
  referenceDate: Date
): {
  data: PerClientViewData | null;
  isLoading: boolean;
  error: string | null;
  periodConfig: ReturnType<typeof getPeriodConfig>;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<PerClientViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize the period config to avoid unnecessary recalculations
  const periodConfig = useMemo(
    () => getPeriodConfig(periodType, referenceDate),
    [periodType, referenceDate]
  );

  // Create a stable date string for the dependency array
  const referenceDateStr = formatDateForQuery(referenceDate);

  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const result = await fetchWithRetry<APIResponse<PerClientViewData>>(
          `/api/kpis?view=per-client&client=${client}&periodType=${periodType}&referenceDate=${referenceDateStr}`,
          {
            timeout: REQUEST_TIMEOUT,
            retries: 2,
            signal: abortControllerRef.current?.signal,
          }
        );

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch KPI data');
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('Error fetching per-client KPIs:', err);
        setError(getErrorMessage(err));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [client, periodType, referenceDateStr]);

  return { data, isLoading, error, periodConfig };
}

// Hook for consolidated data with flexible period types
export function useConsolidatedDataWithPeriod(
  periodType: ComparisonType,
  referenceDate: Date,
  excludeWestlake: boolean = false
): {
  data: ConsolidatedViewData | null;
  isLoading: boolean;
  error: string | null;
  periodConfig: ReturnType<typeof getPeriodConfig>;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<ConsolidatedViewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoize the period config
  const periodConfig = useMemo(
    () => getPeriodConfig(periodType, referenceDate),
    [periodType, referenceDate]
  );

  // Create a stable date string for the dependency array
  const referenceDateStr = formatDateForQuery(referenceDate);

  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const result = await fetchWithRetry<APIResponse<ConsolidatedViewData>>(
          `/api/kpis?view=consolidated&periodType=${periodType}&referenceDate=${referenceDateStr}&excludeWestlake=${excludeWestlake}`,
          {
            timeout: REQUEST_TIMEOUT,
            retries: 2,
            signal: abortControllerRef.current?.signal,
          }
        );

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch consolidated data');
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('Error fetching consolidated KPIs:', err);
        setError(getErrorMessage(err));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [periodType, referenceDateStr, excludeWestlake]);

  return { data, isLoading, error, periodConfig };
}

// Type for historical trend data
export interface MonthlyTrendPoint {
  month: string;
  label: string;
  collections: {
    calls: number;
    connects: number;
    connectRate: number;
    rpcs: number;
    rpcRate: number;
    promises: number;
    promisesPerRpc: number;
    cashPayments: number;
    cashPerRpc: number;
    dollarPromised: number;
    dollarCollected: number;
  };
  inbound: {
    calls: number;
    connects: number;
    connectRate: number;
    rpcs: number;
    rpcRate: number;
    promises: number;
    cashPayments: number;
    dollarPromised: number;
    dollarCollected: number;
  };
}

export interface HistoricalTrendData {
  client?: ClientName;
  displayName?: string;
  months: MonthlyTrendPoint[];
  periodCount: number;
}

// Hook for historical trend data
export function useHistoricalTrends(
  client: ClientName | 'all',
  months: number = 12,
  excludeWestlake: boolean = false
): {
  data: HistoricalTrendData | null;
  isLoading: boolean;
  error: string | null;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<HistoricalTrendData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          client,
          months: String(months),
          excludeWestlake: String(excludeWestlake),
        });

        const result = await fetchWithRetry<APIResponse<HistoricalTrendData>>(
          `/api/trends?${params.toString()}`,
          {
            timeout: REQUEST_TIMEOUT,
            retries: 2,
            signal: abortControllerRef.current?.signal,
          }
        );

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch trend data');
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('Error fetching historical trends:', err);
        setError(getErrorMessage(err));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [client, months, excludeWestlake]);

  return { data, isLoading, error };
}

// Hook for all clients scorecard data (batch API)
export function useAllClientsScorecardData(): {
  data: AllClientsScorecardData | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
} {
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState<AllClientsScorecardData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  const refetch = () => {
    setRefreshKey((prev) => prev + 1);
  };

  useEffect(() => {
    // Cancel any in-flight request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();

    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const result = await fetchWithRetry<APIResponse<AllClientsScorecardData>>(
          '/api/kpis/batch?view=scorecard',
          {
            timeout: REQUEST_TIMEOUT,
            retries: 2,
            signal: abortControllerRef.current?.signal,
          }
        );

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch scorecard data');
        }
      } catch (err) {
        // Ignore abort errors
        if (err instanceof Error && err.name === 'AbortError') return;

        console.error('Error fetching scorecard data:', err);
        setError(getErrorMessage(err));
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [refreshKey]);

  return { data, isLoading, error, refetch };
}
