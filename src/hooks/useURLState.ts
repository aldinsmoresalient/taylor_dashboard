'use client';

import { useCallback, useEffect, useState } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { ViewType, ClientName, ComparisonType } from '@/types';

interface DashboardURLState {
  view?: ViewType;
  client?: ClientName;
  period?: ComparisonType;
  date?: string; // YYYY-MM-DD format
}

const PARAM_KEYS = {
  view: 'v',
  client: 'c',
  period: 'p',
  date: 'd',
} as const;

/**
 * Hook for syncing dashboard state with URL parameters
 * Enables sharing dashboard views via URL
 */
export function useURLState() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isInitialized, setIsInitialized] = useState(false);

  // Parse current URL state
  const getURLState = useCallback((): DashboardURLState => {
    return {
      view: (searchParams.get(PARAM_KEYS.view) as ViewType) || undefined,
      client: (searchParams.get(PARAM_KEYS.client) as ClientName) || undefined,
      period: (searchParams.get(PARAM_KEYS.period) as ComparisonType) || undefined,
      date: searchParams.get(PARAM_KEYS.date) || undefined,
    };
  }, [searchParams]);

  // Update URL with new state
  const setURLState = useCallback(
    (state: DashboardURLState, replace = false) => {
      const params = new URLSearchParams(searchParams.toString());

      // Update or remove each parameter
      Object.entries(state).forEach(([key, value]) => {
        const paramKey = PARAM_KEYS[key as keyof typeof PARAM_KEYS];
        if (value !== undefined && value !== null && value !== '') {
          params.set(paramKey, value);
        } else {
          params.delete(paramKey);
        }
      });

      const queryString = params.toString();
      const newUrl = queryString ? `${pathname}?${queryString}` : pathname;

      if (replace) {
        router.replace(newUrl, { scroll: false });
      } else {
        router.push(newUrl, { scroll: false });
      }
    },
    [pathname, router, searchParams]
  );

  // Update a single URL parameter
  const updateURLParam = useCallback(
    <K extends keyof DashboardURLState>(
      key: K,
      value: DashboardURLState[K],
      replace = true
    ) => {
      setURLState({ [key]: value } as DashboardURLState, replace);
    },
    [setURLState]
  );

  // Clear all URL state
  const clearURLState = useCallback(() => {
    router.push(pathname, { scroll: false });
  }, [pathname, router]);

  // Get shareable URL
  const getShareableURL = useCallback(
    (state: DashboardURLState): string => {
      const params = new URLSearchParams();

      Object.entries(state).forEach(([key, value]) => {
        const paramKey = PARAM_KEYS[key as keyof typeof PARAM_KEYS];
        if (value !== undefined && value !== null && value !== '') {
          params.set(paramKey, value);
        }
      });

      const queryString = params.toString();
      const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
      return queryString ? `${baseUrl}${pathname}?${queryString}` : `${baseUrl}${pathname}`;
    },
    [pathname]
  );

  // Mark as initialized after first render
  useEffect(() => {
    setIsInitialized(true);
  }, []);

  return {
    urlState: getURLState(),
    setURLState,
    updateURLParam,
    clearURLState,
    getShareableURL,
    isInitialized,
  };
}

/**
 * Format a reference date for URL
 */
export function formatDateForURL(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Parse a date from URL
 */
export function parseDateFromURL(dateStr: string): Date | null {
  const date = new Date(dateStr);
  return isNaN(date.getTime()) ? null : date;
}
