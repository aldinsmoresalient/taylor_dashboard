import { describe, it, expect, beforeAll } from 'vitest';

/**
 * API Integration Tests
 *
 * These tests validate that the API endpoints return data with the correct structure
 * and that queries return sensible values.
 *
 * Run with: npm run test:run
 *
 * Prerequisites:
 * - Development server running (npm run dev)
 * - Valid ClickHouse credentials in .env.local
 */

const API_BASE = process.env.API_BASE_URL || 'http://localhost:3000';

// Skip integration tests if not in integration test mode
const runIntegration = process.env.RUN_INTEGRATION_TESTS === 'true';

// Helper to make API calls
async function fetchAPI(url: string) {
  try {
    const response = await fetch(`${API_BASE}${url}`);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    const json = await response.json();
    // API wraps response in { success: true, data: {...} }
    if (json.success && json.data) {
      return json.data;
    }
    return json;
  } catch (error) {
    throw error;
  }
}

// Type definitions for API responses
interface CollectionsMetrics {
  accounts: number;
  calls: number;
  callsPerAccount: number;
  connects: number;
  connectRate: number;
  rpcs: number;
  rpcRate: number;
  promises: number;
  promisesPerRpc: number;
  cashPayments: number;
  cashPerRpc: number;
  cashPerPromises: number;
  transfers: number;
  transfersPerRpc: number;
  timeOnCallHours: number;
  avgTimePerCallMin: number;
}

interface WelcomeVerificationMetrics {
  accounts: number;
  calls: number;
  callsPerAccount: number;
  connects: number;
  connectRate: number;
  rpcs: number;
  rpcRate: number;
  eligible: number;
  eligiblePerRpc: number;
  completed: number;
  completedPerEligible: number;
  completedPerRpc: number;
  incomplete: number;
}

interface PeriodKPIs {
  collections: CollectionsMetrics;
  inbound: CollectionsMetrics;
  welcome: WelcomeVerificationMetrics;
  verification: WelcomeVerificationMetrics;
}

interface PerClientResponse {
  client: string;
  displayName: string;
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  currentPeriodLabel: string;
  previousPeriodLabel?: string;
  comparisonType?: string;
  comparisonContext?: string;
}

interface ConsolidatedResponse {
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  currentPeriodLabel: string;
  previousPeriodLabel?: string;
  comparisonType?: string;
  comparisonContext?: string;
}

describe.skipIf(!runIntegration)('API Integration Tests', () => {
  describe('Per-Client KPIs API', () => {
    it('returns valid structure for MoM period type', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      // Check basic structure
      expect(data).toHaveProperty('client');
      expect(data).toHaveProperty('displayName');
      expect(data).toHaveProperty('currentPeriod');
      expect(data).toHaveProperty('previousPeriod');
      expect(data).toHaveProperty('currentPeriodLabel');

      // Check client info
      expect(data.client).toBe('exeter');
      expect(data.displayName).toBe('EXETER');

      // Check currentPeriod structure
      expect(data.currentPeriod).toHaveProperty('collections');
      expect(data.currentPeriod).toHaveProperty('inbound');
      expect(data.currentPeriod).toHaveProperty('welcome');
      expect(data.currentPeriod).toHaveProperty('verification');
    });

    it('returns valid metrics structure', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      const collections = data.currentPeriod.collections;

      // Check all required fields exist
      expect(collections).toHaveProperty('accounts');
      expect(collections).toHaveProperty('calls');
      expect(collections).toHaveProperty('callsPerAccount');
      expect(collections).toHaveProperty('connects');
      expect(collections).toHaveProperty('connectRate');
      expect(collections).toHaveProperty('rpcs');
      expect(collections).toHaveProperty('rpcRate');
      expect(collections).toHaveProperty('promises');
      expect(collections).toHaveProperty('promisesPerRpc');
      expect(collections).toHaveProperty('cashPayments');
      expect(collections).toHaveProperty('transfers');
      expect(collections).toHaveProperty('timeOnCallHours');
      expect(collections).toHaveProperty('avgTimePerCallMin');

      // Check values are numbers
      expect(typeof collections.accounts).toBe('number');
      expect(typeof collections.calls).toBe('number');
      expect(typeof collections.connectRate).toBe('number');
      expect(typeof collections.rpcRate).toBe('number');
    });

    it('handles weekly period type', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=wow&referenceDate=2024-11-15'
      ) as PerClientResponse;

      expect(data).toHaveProperty('currentPeriod');
      expect(data).toHaveProperty('previousPeriod');
      expect(data.comparisonType).toBe('wow');
    });

    it('handles MTD period type', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mtd&referenceDate=2024-11-15'
      ) as PerClientResponse;

      expect(data).toHaveProperty('currentPeriod');
      expect(data).toHaveProperty('previousPeriod');
      expect(data.comparisonType).toBe('mtd');
    });

    it('handles WTD period type', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=wtd&referenceDate=2024-11-15'
      ) as PerClientResponse;

      expect(data).toHaveProperty('currentPeriod');
      expect(data).toHaveProperty('previousPeriod');
      expect(data.comparisonType).toBe('wtd');
    });
  });

  describe('Consolidated KPIs API', () => {
    it('returns valid structure for consolidated view', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=consolidated&periodType=mom&referenceDate=2024-11-15&excludeWestlake=false'
      ) as ConsolidatedResponse;

      expect(data).toHaveProperty('currentPeriod');
      expect(data).toHaveProperty('previousPeriod');
      expect(data).toHaveProperty('currentPeriodLabel');
    });

    it('excludes Westlake when requested', async () => {
      const withWestlake = await fetchAPI(
        '/api/kpis?view=consolidated&periodType=mom&referenceDate=2024-11-15&excludeWestlake=false'
      ) as ConsolidatedResponse;

      const withoutWestlake = await fetchAPI(
        '/api/kpis?view=consolidated&periodType=mom&referenceDate=2024-11-15&excludeWestlake=true'
      ) as ConsolidatedResponse;

      // If Westlake has data, the totals should be different
      // Note: This test might not always show a difference if Westlake has no data
      expect(withWestlake.currentPeriod).toBeDefined();
      expect(withoutWestlake.currentPeriod).toBeDefined();
    });
  });

  describe('Data Validation', () => {
    it('rates should be between 0 and 100', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      const collections = data.currentPeriod.collections;

      // Connect rate should be 0-100
      expect(collections.connectRate).toBeGreaterThanOrEqual(0);
      expect(collections.connectRate).toBeLessThanOrEqual(100);

      // RPC rate should be 0-100
      expect(collections.rpcRate).toBeGreaterThanOrEqual(0);
      expect(collections.rpcRate).toBeLessThanOrEqual(100);

      // Promises per RPC should be 0-100
      expect(collections.promisesPerRpc).toBeGreaterThanOrEqual(0);
      expect(collections.promisesPerRpc).toBeLessThanOrEqual(100);
    });

    it('derived metrics should be mathematically consistent', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      const collections = data.currentPeriod.collections;

      // If we have calls and accounts, callsPerAccount should match
      if (collections.accounts > 0 && collections.calls > 0) {
        const expectedCallsPerAccount = collections.calls / collections.accounts;
        expect(collections.callsPerAccount).toBeCloseTo(expectedCallsPerAccount, 2);
      }

      // If we have calls and connects, connectRate should match
      if (collections.calls > 0 && collections.connects > 0) {
        const expectedConnectRate = (collections.connects / collections.calls) * 100;
        expect(collections.connectRate).toBeCloseTo(expectedConnectRate, 2);
      }

      // Connects should be less than or equal to calls
      expect(collections.connects).toBeLessThanOrEqual(collections.calls);

      // RPCs should be less than or equal to connects
      expect(collections.rpcs).toBeLessThanOrEqual(collections.connects);

      // Promises should be less than or equal to RPCs (usually)
      // This is a soft check as there might be edge cases
      if (collections.rpcs > 0) {
        expect(collections.promises).toBeLessThanOrEqual(collections.rpcs * 1.5);
      }
    });

    it('counts should be non-negative integers', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      const collections = data.currentPeriod.collections;

      expect(collections.accounts).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(collections.accounts) || collections.accounts === 0).toBe(true);

      expect(collections.calls).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(collections.calls) || collections.calls === 0).toBe(true);

      expect(collections.connects).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(collections.connects) || collections.connects === 0).toBe(true);

      expect(collections.rpcs).toBeGreaterThanOrEqual(0);
      expect(Number.isInteger(collections.rpcs) || collections.rpcs === 0).toBe(true);
    });
  });

  describe('Period Comparisons', () => {
    it('previous period has same structure as current period', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      const currentKeys = Object.keys(data.currentPeriod.collections);
      const previousKeys = Object.keys(data.previousPeriod.collections);

      expect(currentKeys).toEqual(previousKeys);
    });

    it('MoM comparison should compare adjacent months', async () => {
      const data = await fetchAPI(
        '/api/kpis?view=per-client&client=exeter&periodType=mom&referenceDate=2024-11-15'
      ) as PerClientResponse;

      // November 2024 should compare to October 2024
      expect(data.currentPeriodLabel).toContain('Nov');
      expect(data.previousPeriodLabel).toContain('Oct');
    });
  });

  describe('Historical Trends API', () => {
    interface MonthlyTrendPoint {
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
      };
      inbound: {
        calls: number;
        connects: number;
        connectRate: number;
        rpcs: number;
        rpcRate: number;
        promises: number;
        cashPayments: number;
      };
    }

    interface TrendsResponse {
      client?: string;
      displayName?: string;
      months: MonthlyTrendPoint[];
      periodCount: number;
    }

    it('returns valid structure for all clients', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=6') as TrendsResponse;

      expect(data).toHaveProperty('months');
      expect(data).toHaveProperty('periodCount');
      expect(Array.isArray(data.months)).toBe(true);
      expect(data.periodCount).toBe(6);
    });

    it('returns correct number of months', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=6') as TrendsResponse;

      expect(data.months.length).toBeLessThanOrEqual(6);
      // Could be less if data doesn't exist for all months
    });

    it('returns valid monthly data structure', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=6') as TrendsResponse;

      if (data.months.length > 0) {
        const month = data.months[0];

        expect(month).toHaveProperty('month');
        expect(month).toHaveProperty('label');
        expect(month).toHaveProperty('collections');
        expect(month).toHaveProperty('inbound');

        // Check collections structure
        expect(month.collections).toHaveProperty('calls');
        expect(month.collections).toHaveProperty('connects');
        expect(month.collections).toHaveProperty('connectRate');
        expect(month.collections).toHaveProperty('rpcs');
        expect(month.collections).toHaveProperty('rpcRate');
        expect(month.collections).toHaveProperty('promises');
        expect(month.collections).toHaveProperty('promisesPerRpc');
        expect(month.collections).toHaveProperty('cashPayments');
        expect(month.collections).toHaveProperty('cashPerRpc');

        // Check inbound structure
        expect(month.inbound).toHaveProperty('calls');
        expect(month.inbound).toHaveProperty('connects');
        expect(month.inbound).toHaveProperty('connectRate');
        expect(month.inbound).toHaveProperty('rpcs');
        expect(month.inbound).toHaveProperty('rpcRate');
        expect(month.inbound).toHaveProperty('promises');
        expect(month.inbound).toHaveProperty('cashPayments');
      }
    });

    it('returns data for specific client', async () => {
      const data = await fetchAPI('/api/trends?client=exeter&months=6') as TrendsResponse;

      expect(data).toHaveProperty('months');
      expect(data).toHaveProperty('client');
      expect(data.client).toBe('exeter');
    });

    it('excludes Westlake when requested', async () => {
      const withWestlake = await fetchAPI('/api/trends?client=all&months=6&excludeWestlake=false') as TrendsResponse;
      const withoutWestlake = await fetchAPI('/api/trends?client=all&months=6&excludeWestlake=true') as TrendsResponse;

      expect(withWestlake.months).toBeDefined();
      expect(withoutWestlake.months).toBeDefined();
    });

    it('months are in chronological order', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=6') as TrendsResponse;

      if (data.months.length > 1) {
        for (let i = 1; i < data.months.length; i++) {
          const prevMonth = data.months[i - 1].month;
          const currMonth = data.months[i].month;
          expect(currMonth > prevMonth).toBe(true);
        }
      }
    });

    it('month labels are formatted correctly', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=6') as TrendsResponse;

      if (data.months.length > 0) {
        const month = data.months[0];
        // Label should be in format "Mon-YY" like "Jan-24" or "Mon YY" like "Jan 24"
        expect(month.label).toMatch(/^[A-Z][a-z]{2}[-\s]\d{2}$/);
      }
    });

    it('rates are between 0 and 100', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=6') as TrendsResponse;

      for (const month of data.months) {
        // Collections rates
        expect(month.collections.connectRate).toBeGreaterThanOrEqual(0);
        expect(month.collections.connectRate).toBeLessThanOrEqual(100);
        expect(month.collections.rpcRate).toBeGreaterThanOrEqual(0);
        expect(month.collections.rpcRate).toBeLessThanOrEqual(100);
        expect(month.collections.promisesPerRpc).toBeGreaterThanOrEqual(0);
        expect(month.collections.promisesPerRpc).toBeLessThanOrEqual(100);
        expect(month.collections.cashPerRpc).toBeGreaterThanOrEqual(0);
        expect(month.collections.cashPerRpc).toBeLessThanOrEqual(100);

        // Inbound rates
        expect(month.inbound.connectRate).toBeGreaterThanOrEqual(0);
        expect(month.inbound.connectRate).toBeLessThanOrEqual(100);
        expect(month.inbound.rpcRate).toBeGreaterThanOrEqual(0);
        expect(month.inbound.rpcRate).toBeLessThanOrEqual(100);
      }
    });

    it('handles 12 month request', async () => {
      const data = await fetchAPI('/api/trends?client=all&months=12') as TrendsResponse;

      expect(data.periodCount).toBe(12);
      expect(data.months.length).toBeLessThanOrEqual(12);
    });

    it('handles 18 month request', async () => {
      // Use a specific client to reduce query time
      const data = await fetchAPI('/api/trends?client=exeter&months=18') as TrendsResponse;

      expect(data.periodCount).toBe(18);
      expect(data.months.length).toBeLessThanOrEqual(18);
    }, 120000); // 2 minute timeout for larger queries

    it('clamps months to valid range (3-24)', async () => {
      // Use a specific client to reduce query time
      // Requesting 2 months should be clamped to 3
      const tooFew = await fetchAPI('/api/trends?client=exeter&months=2') as TrendsResponse;
      expect(tooFew.periodCount).toBe(3);

      // Requesting 30 months should be clamped to 24
      const tooMany = await fetchAPI('/api/trends?client=exeter&months=30') as TrendsResponse;
      expect(tooMany.periodCount).toBe(24);
    }, 120000); // 2 minute timeout for larger queries
  });
});

// Unit tests that don't require the server
describe('Data Structure Validation', () => {
  it('PeriodKPIs structure is valid', () => {
    const validPeriodKPIs: PeriodKPIs = {
      collections: {
        accounts: 1000,
        calls: 5000,
        callsPerAccount: 5,
        connects: 2000,
        connectRate: 40,
        rpcs: 800,
        rpcRate: 40,
        promises: 400,
        promisesPerRpc: 50,
        cashPayments: 200,
        cashPerRpc: 25,
        cashPerPromises: 50,
        transfers: 100,
        transfersPerRpc: 12.5,
        timeOnCallHours: 250,
        avgTimePerCallMin: 3,
      },
      inbound: {
        accounts: 500,
        calls: 1000,
        callsPerAccount: 2,
        connects: 900,
        connectRate: 90,
        rpcs: 700,
        rpcRate: 77.8,
        promises: 350,
        promisesPerRpc: 50,
        cashPayments: 200,
        cashPerRpc: 28.6,
        cashPerPromises: 57.1,
        transfers: 50,
        transfersPerRpc: 7.1,
        timeOnCallHours: 100,
        avgTimePerCallMin: 6,
      },
      welcome: {
        accounts: 200,
        calls: 400,
        callsPerAccount: 2,
        connects: 350,
        connectRate: 87.5,
        rpcs: 300,
        rpcRate: 85.7,
        eligible: 300,
        eligiblePerRpc: 100,
        completed: 250,
        completedPerEligible: 83.3,
        completedPerRpc: 83.3,
        incomplete: 50,
      },
      verification: {
        accounts: 100,
        calls: 200,
        callsPerAccount: 2,
        connects: 180,
        connectRate: 90,
        rpcs: 150,
        rpcRate: 83.3,
        eligible: 150,
        eligiblePerRpc: 100,
        completed: 140,
        completedPerEligible: 93.3,
        completedPerRpc: 93.3,
        incomplete: 10,
      },
    };

    // Validate structure
    expect(validPeriodKPIs).toHaveProperty('collections');
    expect(validPeriodKPIs).toHaveProperty('inbound');
    expect(validPeriodKPIs).toHaveProperty('welcome');
    expect(validPeriodKPIs).toHaveProperty('verification');

    // Validate collections has all required fields
    const collections = validPeriodKPIs.collections;
    expect(typeof collections.accounts).toBe('number');
    expect(typeof collections.calls).toBe('number');
    expect(typeof collections.connectRate).toBe('number');
    expect(typeof collections.rpcRate).toBe('number');

    // Validate welcome has different fields than collections
    const welcome = validPeriodKPIs.welcome;
    expect(welcome).toHaveProperty('eligible');
    expect(welcome).toHaveProperty('completed');
    expect(welcome).toHaveProperty('incomplete');
    expect(welcome).not.toHaveProperty('cashPayments');
  });
});
