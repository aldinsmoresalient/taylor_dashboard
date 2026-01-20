'use client';

import { useState, useEffect, useCallback } from 'react';

/**
 * Custom hook for persisting state in localStorage with SSR support
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void] {
  // State to store our value
  // Pass initial state function to useState so logic is only executed once
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        const parsed = JSON.parse(item);
        setStoredValue(parsed);
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }
    setIsInitialized(true);
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;
        // Save state
        setStoredValue(valueToStore);
        // Save to local storage
        if (typeof window !== 'undefined') {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  return [storedValue, setValue];
}

/**
 * Dashboard-specific settings interface
 */
export interface DashboardSettings {
  view: 'consolidated' | 'client-mix' | 'per-client' | 'scorecard';
  client: string;
  periodType: 'mom' | 'wow' | 'mtd' | 'wtd';
  showCharts: boolean;
}

const DASHBOARD_SETTINGS_KEY = 'taylor-dashboard-settings';

const DEFAULT_SETTINGS: DashboardSettings = {
  view: 'per-client',
  client: 'exeter',
  periodType: 'mom',
  showCharts: true,
};

/**
 * Hook specifically for dashboard settings
 */
export function useDashboardSettings() {
  const [settings, setSettings] = useLocalStorage<DashboardSettings>(
    DASHBOARD_SETTINGS_KEY,
    DEFAULT_SETTINGS
  );

  const updateSetting = useCallback(
    <K extends keyof DashboardSettings>(key: K, value: DashboardSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
    },
    [setSettings]
  );

  return { settings, updateSetting, setSettings };
}
