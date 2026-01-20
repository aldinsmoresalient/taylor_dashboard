import { createClient, ClickHouseClient } from '@clickhouse/client';
import { 
  ALL_CLIENTS,
  TEST_ACCOUNTS,
  TEST_PHONE_NUMBERS,
  type CollectionsMetrics,
  type WelcomeVerificationMetrics,
  type PeriodKPIs,
  type PerClientViewData,
  type ConsolidatedViewData,
  type ClientColumnData,
  type ClientName,
} from '@/types';
import {
  formatMonthYear,
  getClientDisplayName,
  formatDateRange,
  formatDateForQuery,
  getPeriodConfig,
  getWeeklyAverageRange,
  getWeekRange,
  getRolling7DayRange,
} from './utils';
import type { ComparisonType, DateRange } from '@/types';

// Create ClickHouse client with timeout settings
const getClickHouseClient = (): ClickHouseClient => {
  return createClient({
    url: process.env.CLICKHOUSE_HOST || 'http://localhost:8123',
    username: process.env.CLICKHOUSE_USER || 'default',
    password: process.env.CLICKHOUSE_PASSWORD || '',
    database: process.env.CLICKHOUSE_DATABASE || 'default',
    request_timeout: 90000, // 90 second request timeout
    clickhouse_settings: {
      max_execution_time: 60, // 60 second query execution limit
    },
  });
};

// ============================================
// RESULT CODE DEFINITIONS
// ============================================

// Non-connect results (calls that didn't connect to a person)
// - NOA: No answer / voicemail not set up, mailbox full
// - ANX: Answering machine / voicemail
// - VML: Voicemail left
// - DEADAIR: Connected but no voice activity
// - BADNO: Not in service / technical dial errors
// - BLOCKED: Blocked by pre-call API, TCPA checks
// Client-specific: DAI (Westlake DEADAIR), DIS (Westlake BADNO)
const NON_CONNECT_RESULTS = [
  'NOA', 'ANX', 'VML', 'DEADAIR', 'BADNO', 'BLOCKED',
  'DAI', 'DIS', // Westlake mappings
  'BGN', 'DIALING', 'ATTEMPTING', // Legacy/other
];

// Non-RPC results - NOAUTH (connected but not authenticated/RPC)
// - TPI: Third party / non-authenticated
// - WRONGNO: Explicit "wrong number" 
// - XCSN: Transfer before verification
// Client-specific: WRN (Westlake WRONGNO), CHECKNO (ACA WRONGNO)
const NON_RPC_RESULTS = [
  'TPI', 'WRONGNO', 'XCSN',
  'WRN', 'CHECKNO', // Client mappings
  'NID', // Legacy
];

// Transfer results (escalations)
// - XCSV: Transfer after verification
// - XCSN: Transfer before verification  
// - XCSP: Transfer after POP was made
// Client-specific: XCS, XCSR (CPS mappings)
const TRANSFER_RESULTS = [
  'XCSV', 'XCSN', 'XCSP', 'XCS', 'XCSR',
  'TDNC', 'SARI', // Legacy
];

// PTP (Promise to Pay) results
// Formula: PTP = (POP + FCC-F + PHO-F + XCSP) + (FCC + PHO)
// - POP: Payment promised (with amount and date) but not secured
// - FCC: Future payment scheduled successfully  
// - FCC-F: Future payment API hit but failed
// - PHO: Successful payment today
// - PHO-F: Payment API hit but failed
// - XCSP: Transfer after POP was made
const PTP_RESULTS = ['POP', 'FCC', 'FCC-F', 'PHO', 'PHO-F', 'XCSP'];

// Cash/Payment results (successful payments only)
// - PHO: Successful payment today
// - FCC: Future payment scheduled successfully
const CASH_RESULTS = ['PHO', 'FCC'];

// Additional payment-related (partial/authenticated but not collected)
// - TTB: Authenticated but didn't collect full payment details
// - CBR: Customer requested callback without promise
const OTHER_PAYMENT_RESULTS = ['TTB', 'CBR', 'POP'];

// Empty metrics helpers
function emptyCollectionsMetrics(): CollectionsMetrics {
  return {
    accounts: 0,
    calls: 0,
    callsPerAccount: 0,
    connects: 0,
    connectRate: 0,
    rpcs: 0,
    rpcRate: 0,
    promises: 0,
    promisesPerRpc: 0,
    cashPayments: 0,
    cashPerRpc: 0,
    cashPerPromises: 0,
    transfers: 0,
    transfersPerRpc: 0,
    timeOnCallHours: 0,
    avgTimePerCallMin: 0,
    // Dollar metrics
    dollarPromised: 0,
    dollarCollected: 0,
    avgPaymentAmount: 0,
    dollarPerRpc: 0,
  };
}

function emptyWelcomeVerificationMetrics(): WelcomeVerificationMetrics {
  return {
    accounts: 0,
    calls: 0,
    callsPerAccount: 0,
    connects: 0,
    connectRate: 0,
    rpcs: 0,
    rpcRate: 0,
    eligible: 0,
    eligiblePerRpc: 0,
    completed: 0,
    completedPerEligible: 0,
    completedPerRpc: 0,
    incomplete: 0,
  };
}

function emptyPeriodKPIs(): PeriodKPIs {
  return {
    collections: emptyCollectionsMetrics(),
    inbound: emptyCollectionsMetrics(),
    welcome: emptyWelcomeVerificationMetrics(),
    verification: emptyWelcomeVerificationMetrics(),
  };
}

// Safe division helper
function safeDivide(numerator: number, denominator: number): number {
  if (denominator === 0) return 0;
  return numerator / denominator;
}

// Calculate derived metrics for collections
function calculateDerivedCollectionsMetrics(raw: {
  accounts: number;
  calls: number;
  connects: number;
  rpcs: number;
  promises: number;
  cashPayments: number;
  transfers: number;
  durationMinutes: number;
  dollarPromised: number;
  dollarCollected: number;
}): CollectionsMetrics {
  return {
    accounts: raw.accounts,
    calls: raw.calls,
    callsPerAccount: safeDivide(raw.calls, raw.accounts),
    connects: raw.connects,
    connectRate: safeDivide(raw.connects, raw.calls) * 100,
    rpcs: raw.rpcs,
    rpcRate: safeDivide(raw.rpcs, raw.connects) * 100,
    promises: raw.promises,
    promisesPerRpc: safeDivide(raw.promises, raw.rpcs) * 100,
    cashPayments: raw.cashPayments,
    cashPerRpc: safeDivide(raw.cashPayments, raw.rpcs) * 100,
    cashPerPromises: safeDivide(raw.cashPayments, raw.promises) * 100,
    transfers: raw.transfers,
    transfersPerRpc: safeDivide(raw.transfers, raw.rpcs) * 100,
    timeOnCallHours: raw.durationMinutes / 60,
    avgTimePerCallMin: safeDivide(raw.durationMinutes, raw.calls),
    // Dollar metrics
    dollarPromised: raw.dollarPromised,
    dollarCollected: raw.dollarCollected,
    avgPaymentAmount: safeDivide(raw.dollarCollected, raw.cashPayments),
    dollarPerRpc: safeDivide(raw.dollarCollected, raw.rpcs),
  };
}

// Calculate derived metrics for welcome/verification
function calculateDerivedWelcomeMetrics(raw: {
  accounts: number;
  calls: number;
  connects: number;
  rpcs: number;
  eligible: number;
  completed: number;
}): WelcomeVerificationMetrics {
  return {
    accounts: raw.accounts,
    calls: raw.calls,
    callsPerAccount: safeDivide(raw.calls, raw.accounts),
    connects: raw.connects,
    connectRate: safeDivide(raw.connects, raw.calls) * 100,
    rpcs: raw.rpcs,
    rpcRate: safeDivide(raw.rpcs, raw.connects) * 100,
    eligible: raw.eligible,
    eligiblePerRpc: safeDivide(raw.eligible, raw.rpcs) * 100,
    completed: raw.completed,
    completedPerEligible: safeDivide(raw.completed, raw.eligible) * 100,
    completedPerRpc: safeDivide(raw.completed, raw.rpcs) * 100,
    incomplete: raw.eligible - raw.completed,
  };
}

// Build the query for a single client
function buildClientKPIQuery(
  client: string,
  startDate: string,
  endDate: string
): string {
  const testAccountsList = TEST_ACCOUNTS.map(a => `'${a}'`).join(', ');
  const testPhonesList = TEST_PHONE_NUMBERS.map(p => `'${p}'`).join(', ');
  const nonConnectList = NON_CONNECT_RESULTS.map(r => `'${r}'`).join(', ');
  const nonRpcList = [...NON_CONNECT_RESULTS, ...NON_RPC_RESULTS].map(r => `'${r}'`).join(', ');
  const transferList = TRANSFER_RESULTS.map(r => `'${r}'`).join(', ');
  const ptpList = PTP_RESULTS.map(r => `'${r}'`).join(', ');
  const cashList = CASH_RESULTS.map(r => `'${r}'`).join(', ');

  return `
    SELECT
      c.model as model,
      c.direction as direction,
      count(DISTINCT c.account_number) as accounts,
      count(*) as calls,
      countIf(c.result NOT IN (${nonConnectList})) as connects,
      countIf(c.result NOT IN (${nonRpcList})) as rpcs,
      countIf(c.result IN (${ptpList}) OR c.notated_promise_to_pay = 1) as promises,
      countIf(c.result IN (${cashList})) as cash_payments,
      countIf(c.result IN (${transferList})) as transfers,
      sum(coalesce(c.duration, 0)) / 60.0 as duration_minutes,
      countIf(i.is_resolved = 1) as completed_verifications,
      sum(coalesce(c.amount, 0)) as dollar_promised,
      sum(coalesce(c.payment_amount, 0)) as dollar_collected,
      countIf(c.result IN ('PHO', 'FCC', 'PHO-F', 'FCC-F')) as payment_attempts,
      countIf(c.payment_successful = 1) as payment_successful,
      countIf(c.payment_declined = 1) as payment_declined,
      countIf(c.payment_api_failed = 1) as payment_api_failed
    FROM supabase.call_${client} c
    LEFT JOIN (
      SELECT call_id, is_resolved
      FROM supabase.insight
      WHERE tenant = '${client}'
    ) i ON i.call_id = c.id
    WHERE c.start_time >= toDateTime('${startDate}', 'UTC')
      AND c.start_time < toDateTime('${endDate}', 'UTC')
      AND coalesce(c.account_number, '') NOT IN (${testAccountsList}, '')
      AND NOT has([${testPhonesList}], coalesce(c.phone_number, ''))
      AND c.result IS NOT NULL
    GROUP BY c.model, c.direction
  `;
}

// Parse query results into PeriodKPIs
interface RawKPIRow {
  model: string;
  direction: string;
  accounts: string;
  calls: string;
  connects: string;
  rpcs: string;
  promises: string;
  cash_payments: string;
  transfers: string;
  duration_minutes: string;
  completed_verifications: string;
  dollar_promised: string;
  dollar_collected: string;
  payment_attempts: string;
  payment_successful: string;
  payment_declined: string;
  payment_api_failed: string;
}

function parseKPIResults(rows: RawKPIRow[]): PeriodKPIs {
  const kpis = emptyPeriodKPIs();

  // Accumulators for raw metrics
  const collectionsRaw = { accounts: 0, calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0, transfers: 0, durationMinutes: 0, dollarPromised: 0, dollarCollected: 0 };
  const inboundRaw = { accounts: 0, calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0, transfers: 0, durationMinutes: 0, dollarPromised: 0, dollarCollected: 0 };
  const welcomeRaw = { accounts: 0, calls: 0, connects: 0, rpcs: 0, eligible: 0, completed: 0 };
  const verificationRaw = { accounts: 0, calls: 0, connects: 0, rpcs: 0, eligible: 0, completed: 0 };

  for (const row of rows) {
    const model = row.model?.toLowerCase() || '';
    const direction = row.direction?.toLowerCase() || '';

    const accounts = parseInt(row.accounts) || 0;
    const calls = parseInt(row.calls) || 0;
    const connects = parseInt(row.connects) || 0;
    const rpcs = parseInt(row.rpcs) || 0;
    const promises = parseInt(row.promises) || 0;
    const cashPayments = parseInt(row.cash_payments) || 0;
    const transfers = parseInt(row.transfers) || 0;
    const durationMinutes = parseFloat(row.duration_minutes) || 0;
    const completedVerifications = parseInt(row.completed_verifications) || 0;
    const dollarPromised = parseFloat(row.dollar_promised) || 0;
    const dollarCollected = parseFloat(row.dollar_collected) || 0;

    if (model === 'collections') {
      if (direction === 'inbound') {
        inboundRaw.accounts += accounts;
        inboundRaw.calls += calls;
        inboundRaw.connects += connects;
        inboundRaw.rpcs += rpcs;
        inboundRaw.promises += promises;
        inboundRaw.cashPayments += cashPayments;
        inboundRaw.transfers += transfers;
        inboundRaw.durationMinutes += durationMinutes;
        inboundRaw.dollarPromised += dollarPromised;
        inboundRaw.dollarCollected += dollarCollected;
      } else {
        // Outbound collections
        collectionsRaw.accounts += accounts;
        collectionsRaw.calls += calls;
        collectionsRaw.connects += connects;
        collectionsRaw.rpcs += rpcs;
        collectionsRaw.promises += promises;
        collectionsRaw.cashPayments += cashPayments;
        collectionsRaw.transfers += transfers;
        collectionsRaw.durationMinutes += durationMinutes;
        collectionsRaw.dollarPromised += dollarPromised;
        collectionsRaw.dollarCollected += dollarCollected;
      }
    } else if (model === 'welcome') {
      welcomeRaw.accounts += accounts;
      welcomeRaw.calls += calls;
      welcomeRaw.connects += connects;
      welcomeRaw.rpcs += rpcs;
      welcomeRaw.eligible += rpcs; // All RPCs are eligible for welcome
      welcomeRaw.completed += completedVerifications;
    } else if (model === 'verification') {
      verificationRaw.accounts += accounts;
      verificationRaw.calls += calls;
      verificationRaw.connects += connects;
      verificationRaw.rpcs += rpcs;
      verificationRaw.eligible += rpcs; // All RPCs are eligible for verification
      verificationRaw.completed += completedVerifications;
    } else if (model === 'inbound') {
      // Some clients use 'inbound' as model name
      inboundRaw.accounts += accounts;
      inboundRaw.calls += calls;
      inboundRaw.connects += connects;
      inboundRaw.rpcs += rpcs;
      inboundRaw.promises += promises;
      inboundRaw.cashPayments += cashPayments;
      inboundRaw.transfers += transfers;
      inboundRaw.durationMinutes += durationMinutes;
      inboundRaw.dollarPromised += dollarPromised;
      inboundRaw.dollarCollected += dollarCollected;
    }
  }

  // Calculate derived metrics
  kpis.collections = calculateDerivedCollectionsMetrics(collectionsRaw);
  kpis.inbound = calculateDerivedCollectionsMetrics(inboundRaw);
  kpis.welcome = calculateDerivedWelcomeMetrics(welcomeRaw);
  kpis.verification = calculateDerivedWelcomeMetrics(verificationRaw);

  return kpis;
}

// Helper to calculate next month from YYYY-MM format
function getNextMonth(yearMonth: string): string {
  const [year, monthNum] = yearMonth.split('-').map(Number);
  if (monthNum === 12) {
    return `${year + 1}-01`;
  }
  return `${year}-${String(monthNum + 1).padStart(2, '0')}`;
}

// Helper to calculate previous month from YYYY-MM format
function getPrevMonth(yearMonth: string): string {
  const [year, monthNum] = yearMonth.split('-').map(Number);
  if (monthNum === 1) {
    return `${year - 1}-12`;
  }
  return `${year}-${String(monthNum - 1).padStart(2, '0')}`;
}

// Fetch Per-Client KPI data (legacy monthly version)
export async function fetchPerClientKPIs(
  client: ClientName,
  month: string // format: YYYY-MM
): Promise<PerClientViewData> {
  const clickhouse = getClickHouseClient();

  try {
    const [year, monthNum] = month.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const prevMonthStr = getPrevMonth(month);
    const [prevYear, prevMonthNum] = prevMonthStr.split('-').map(Number);
    const prevDate = new Date(Date.UTC(prevYear, prevMonthNum - 1, 1));

    const currentStart = `${month}-01 00:00:00`;
    const nextMonthStr = getNextMonth(month);
    const currentEnd = `${nextMonthStr}-01 00:00:00`;


    const prevStart = `${prevMonthStr}-01 00:00:00`;
    const prevEnd = `${month}-01 00:00:00`;

    // Query current and previous period in parallel
    const [currentResult, prevResult] = await Promise.all([
      clickhouse.query({
        query: buildClientKPIQuery(client, currentStart, currentEnd),
        format: 'JSONEachRow',
      }),
      clickhouse.query({
        query: buildClientKPIQuery(client, prevStart, prevEnd),
        format: 'JSONEachRow',
      }),
    ]);

    const currentRows = await currentResult.json() as RawKPIRow[];
    const prevRows = await prevResult.json() as RawKPIRow[];

    return {
      client,
      displayName: getClientDisplayName(client),
      currentPeriod: parseKPIResults(currentRows),
      previousPeriod: parseKPIResults(prevRows),
      currentPeriodLabel: formatMonthYear(currentDate),
      previousPeriodLabel: formatMonthYear(prevDate),
    };
  } finally {
    await clickhouse.close();
  }
}

// Helper to format date to ClickHouse datetime string
function formatDateTimeForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 00:00:00`;
}

function formatDateTimeEndForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day} 23:59:59`;
}

// Fetch Per-Client KPI data with flexible date ranges
export async function fetchPerClientKPIsWithDateRange(
  client: ClientName,
  currentRange: DateRange,
  comparisonRange: DateRange,
  comparisonType: ComparisonType
): Promise<PerClientViewData> {
  const clickhouse = getClickHouseClient();

  try {
    const currentStart = formatDateTimeForQuery(currentRange.start);
    const currentEnd = formatDateTimeEndForQuery(currentRange.end);
    const compStart = formatDateTimeForQuery(comparisonRange.start);
    const compEnd = formatDateTimeEndForQuery(comparisonRange.end);

    // Query current and comparison period in parallel
    const [currentResult, compResult] = await Promise.all([
      clickhouse.query({
        query: buildClientKPIQuery(client, currentStart, currentEnd),
        format: 'JSONEachRow',
      }),
      clickhouse.query({
        query: buildClientKPIQuery(client, compStart, compEnd),
        format: 'JSONEachRow',
      }),
    ]);

    const currentRows = await currentResult.json() as RawKPIRow[];
    const compRows = await compResult.json() as RawKPIRow[];

    return {
      client,
      displayName: getClientDisplayName(client),
      currentPeriod: parseKPIResults(currentRows),
      previousPeriod: parseKPIResults(compRows),
      currentPeriodLabel: currentRange.label,
      previousPeriodLabel: comparisonRange.label,
      comparisonType,
      comparisonContext: `vs ${comparisonRange.label}`,
    };
  } finally {
    await clickhouse.close();
  }
}

// Fetch weekly average KPIs for WTD comparison
export async function fetchWeeklyAverageKPIs(
  client: ClientName,
  referenceDate: Date,
  weeks: number = 4
): Promise<PeriodKPIs> {
  const clickhouse = getClickHouseClient();

  try {
    // Get the ranges for each of the past N weeks
    const weeklyKPIs: PeriodKPIs[] = [];

    for (let i = 1; i <= weeks; i++) {
      const weekDate = new Date(referenceDate);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const weekRange = getWeekRange(weekDate);

      const startStr = formatDateTimeForQuery(weekRange.start);
      const endStr = formatDateTimeEndForQuery(weekRange.end);

      const result = await clickhouse.query({
        query: buildClientKPIQuery(client, startStr, endStr),
        format: 'JSONEachRow',
      });

      const rows = await result.json() as RawKPIRow[];
      weeklyKPIs.push(parseKPIResults(rows));
    }

    // Calculate average across all weeks
    if (weeklyKPIs.length === 0) {
      return emptyPeriodKPIs();
    }

    // Sum all weekly KPIs
    let total = emptyPeriodKPIs();
    for (const kpi of weeklyKPIs) {
      total = sumPeriodKPIs(total, kpi);
    }

    // Divide by number of weeks to get average
    const divisor = weeklyKPIs.length;
    total = {
      collections: {
        accounts: total.collections.accounts / divisor,
        calls: total.collections.calls / divisor,
        callsPerAccount: 0,
        connects: total.collections.connects / divisor,
        connectRate: 0,
        rpcs: total.collections.rpcs / divisor,
        rpcRate: 0,
        promises: total.collections.promises / divisor,
        promisesPerRpc: 0,
        cashPayments: total.collections.cashPayments / divisor,
        cashPerRpc: 0,
        cashPerPromises: 0,
        transfers: total.collections.transfers / divisor,
        transfersPerRpc: 0,
        timeOnCallHours: total.collections.timeOnCallHours / divisor,
        avgTimePerCallMin: 0,
        dollarPromised: total.collections.dollarPromised / divisor,
        dollarCollected: total.collections.dollarCollected / divisor,
        avgPaymentAmount: 0,
        dollarPerRpc: 0,
      },
      inbound: {
        accounts: total.inbound.accounts / divisor,
        calls: total.inbound.calls / divisor,
        callsPerAccount: 0,
        connects: total.inbound.connects / divisor,
        connectRate: 0,
        rpcs: total.inbound.rpcs / divisor,
        rpcRate: 0,
        promises: total.inbound.promises / divisor,
        promisesPerRpc: 0,
        cashPayments: total.inbound.cashPayments / divisor,
        cashPerRpc: 0,
        cashPerPromises: 0,
        transfers: total.inbound.transfers / divisor,
        transfersPerRpc: 0,
        timeOnCallHours: total.inbound.timeOnCallHours / divisor,
        avgTimePerCallMin: 0,
        dollarPromised: total.inbound.dollarPromised / divisor,
        dollarCollected: total.inbound.dollarCollected / divisor,
        avgPaymentAmount: 0,
        dollarPerRpc: 0,
      },
      welcome: {
        accounts: total.welcome.accounts / divisor,
        calls: total.welcome.calls / divisor,
        callsPerAccount: 0,
        connects: total.welcome.connects / divisor,
        connectRate: 0,
        rpcs: total.welcome.rpcs / divisor,
        rpcRate: 0,
        eligible: total.welcome.eligible / divisor,
        eligiblePerRpc: 0,
        completed: total.welcome.completed / divisor,
        completedPerEligible: 0,
        completedPerRpc: 0,
        incomplete: total.welcome.incomplete / divisor,
      },
      verification: {
        accounts: total.verification.accounts / divisor,
        calls: total.verification.calls / divisor,
        callsPerAccount: 0,
        connects: total.verification.connects / divisor,
        connectRate: 0,
        rpcs: total.verification.rpcs / divisor,
        rpcRate: 0,
        eligible: total.verification.eligible / divisor,
        eligiblePerRpc: 0,
        completed: total.verification.completed / divisor,
        completedPerEligible: 0,
        completedPerRpc: 0,
        incomplete: total.verification.incomplete / divisor,
      },
    };

    // Recalculate derived metrics
    return recalculateDerivedMetrics(total);
  } finally {
    await clickhouse.close();
  }
}

// Calculate percent of total for each metric
function calculatePercentOfTotal(
  clientKPIs: PeriodKPIs,
  totalKPIs: PeriodKPIs
): PeriodKPIs {
  const calcPct = (val: number, total: number) => total > 0 ? (val / total) * 100 : 0;

  return {
    collections: {
      accounts: calcPct(clientKPIs.collections.accounts, totalKPIs.collections.accounts),
      calls: calcPct(clientKPIs.collections.calls, totalKPIs.collections.calls),
      callsPerAccount: 0,
      connects: calcPct(clientKPIs.collections.connects, totalKPIs.collections.connects),
      connectRate: 0,
      rpcs: calcPct(clientKPIs.collections.rpcs, totalKPIs.collections.rpcs),
      rpcRate: 0,
      promises: calcPct(clientKPIs.collections.promises, totalKPIs.collections.promises),
      promisesPerRpc: 0,
      cashPayments: calcPct(clientKPIs.collections.cashPayments, totalKPIs.collections.cashPayments),
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: calcPct(clientKPIs.collections.transfers, totalKPIs.collections.transfers),
      transfersPerRpc: 0,
      timeOnCallHours: calcPct(clientKPIs.collections.timeOnCallHours, totalKPIs.collections.timeOnCallHours),
      avgTimePerCallMin: 0,
      dollarPromised: calcPct(clientKPIs.collections.dollarPromised, totalKPIs.collections.dollarPromised),
      dollarCollected: calcPct(clientKPIs.collections.dollarCollected, totalKPIs.collections.dollarCollected),
      avgPaymentAmount: 0,
      dollarPerRpc: 0,
    },
    inbound: {
      accounts: calcPct(clientKPIs.inbound.accounts, totalKPIs.inbound.accounts),
      calls: calcPct(clientKPIs.inbound.calls, totalKPIs.inbound.calls),
      callsPerAccount: 0,
      connects: calcPct(clientKPIs.inbound.connects, totalKPIs.inbound.connects),
      connectRate: 0,
      rpcs: calcPct(clientKPIs.inbound.rpcs, totalKPIs.inbound.rpcs),
      rpcRate: 0,
      promises: calcPct(clientKPIs.inbound.promises, totalKPIs.inbound.promises),
      promisesPerRpc: 0,
      cashPayments: calcPct(clientKPIs.inbound.cashPayments, totalKPIs.inbound.cashPayments),
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: calcPct(clientKPIs.inbound.transfers, totalKPIs.inbound.transfers),
      transfersPerRpc: 0,
      timeOnCallHours: calcPct(clientKPIs.inbound.timeOnCallHours, totalKPIs.inbound.timeOnCallHours),
      avgTimePerCallMin: 0,
      dollarPromised: calcPct(clientKPIs.inbound.dollarPromised, totalKPIs.inbound.dollarPromised),
      dollarCollected: calcPct(clientKPIs.inbound.dollarCollected, totalKPIs.inbound.dollarCollected),
      avgPaymentAmount: 0,
      dollarPerRpc: 0,
    },
    welcome: {
      accounts: calcPct(clientKPIs.welcome.accounts, totalKPIs.welcome.accounts),
      calls: calcPct(clientKPIs.welcome.calls, totalKPIs.welcome.calls),
      callsPerAccount: 0,
      connects: calcPct(clientKPIs.welcome.connects, totalKPIs.welcome.connects),
      connectRate: 0,
      rpcs: calcPct(clientKPIs.welcome.rpcs, totalKPIs.welcome.rpcs),
      rpcRate: 0,
      eligible: calcPct(clientKPIs.welcome.eligible, totalKPIs.welcome.eligible),
      eligiblePerRpc: 0,
      completed: calcPct(clientKPIs.welcome.completed, totalKPIs.welcome.completed),
      completedPerEligible: 0,
      completedPerRpc: 0,
      incomplete: calcPct(clientKPIs.welcome.incomplete, totalKPIs.welcome.incomplete),
    },
    verification: {
      accounts: calcPct(clientKPIs.verification.accounts, totalKPIs.verification.accounts),
      calls: calcPct(clientKPIs.verification.calls, totalKPIs.verification.calls),
      callsPerAccount: 0,
      connects: calcPct(clientKPIs.verification.connects, totalKPIs.verification.connects),
      connectRate: 0,
      rpcs: calcPct(clientKPIs.verification.rpcs, totalKPIs.verification.rpcs),
      rpcRate: 0,
      eligible: calcPct(clientKPIs.verification.eligible, totalKPIs.verification.eligible),
      eligiblePerRpc: 0,
      completed: calcPct(clientKPIs.verification.completed, totalKPIs.verification.completed),
      completedPerEligible: 0,
      completedPerRpc: 0,
      incomplete: calcPct(clientKPIs.verification.incomplete, totalKPIs.verification.incomplete),
    },
  };
}

// Sum two PeriodKPIs together
function sumPeriodKPIs(a: PeriodKPIs, b: PeriodKPIs): PeriodKPIs {
  return {
    collections: {
      accounts: a.collections.accounts + b.collections.accounts,
      calls: a.collections.calls + b.collections.calls,
      callsPerAccount: 0, // Will be recalculated
      connects: a.collections.connects + b.collections.connects,
      connectRate: 0,
      rpcs: a.collections.rpcs + b.collections.rpcs,
      rpcRate: 0,
      promises: a.collections.promises + b.collections.promises,
      promisesPerRpc: 0,
      cashPayments: a.collections.cashPayments + b.collections.cashPayments,
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: a.collections.transfers + b.collections.transfers,
      transfersPerRpc: 0,
      timeOnCallHours: a.collections.timeOnCallHours + b.collections.timeOnCallHours,
      avgTimePerCallMin: 0,
      dollarPromised: a.collections.dollarPromised + b.collections.dollarPromised,
      dollarCollected: a.collections.dollarCollected + b.collections.dollarCollected,
      avgPaymentAmount: 0,
      dollarPerRpc: 0,
    },
    inbound: {
      accounts: a.inbound.accounts + b.inbound.accounts,
      calls: a.inbound.calls + b.inbound.calls,
      callsPerAccount: 0,
      connects: a.inbound.connects + b.inbound.connects,
      connectRate: 0,
      rpcs: a.inbound.rpcs + b.inbound.rpcs,
      rpcRate: 0,
      promises: a.inbound.promises + b.inbound.promises,
      promisesPerRpc: 0,
      cashPayments: a.inbound.cashPayments + b.inbound.cashPayments,
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: a.inbound.transfers + b.inbound.transfers,
      transfersPerRpc: 0,
      timeOnCallHours: a.inbound.timeOnCallHours + b.inbound.timeOnCallHours,
      avgTimePerCallMin: 0,
      dollarPromised: a.inbound.dollarPromised + b.inbound.dollarPromised,
      dollarCollected: a.inbound.dollarCollected + b.inbound.dollarCollected,
      avgPaymentAmount: 0,
      dollarPerRpc: 0,
    },
    welcome: {
      accounts: a.welcome.accounts + b.welcome.accounts,
      calls: a.welcome.calls + b.welcome.calls,
      callsPerAccount: 0,
      connects: a.welcome.connects + b.welcome.connects,
      connectRate: 0,
      rpcs: a.welcome.rpcs + b.welcome.rpcs,
      rpcRate: 0,
      eligible: a.welcome.eligible + b.welcome.eligible,
      eligiblePerRpc: 0,
      completed: a.welcome.completed + b.welcome.completed,
      completedPerEligible: 0,
      completedPerRpc: 0,
      incomplete: a.welcome.incomplete + b.welcome.incomplete,
    },
    verification: {
      accounts: a.verification.accounts + b.verification.accounts,
      calls: a.verification.calls + b.verification.calls,
      callsPerAccount: 0,
      connects: a.verification.connects + b.verification.connects,
      connectRate: 0,
      rpcs: a.verification.rpcs + b.verification.rpcs,
      rpcRate: 0,
      eligible: a.verification.eligible + b.verification.eligible,
      eligiblePerRpc: 0,
      completed: a.verification.completed + b.verification.completed,
      completedPerEligible: 0,
      completedPerRpc: 0,
      incomplete: a.verification.incomplete + b.verification.incomplete,
    },
  };
}

// Recalculate derived metrics for totals
function recalculateDerivedMetrics(kpis: PeriodKPIs): PeriodKPIs {
  return {
    collections: calculateDerivedCollectionsMetrics({
      accounts: kpis.collections.accounts,
      calls: kpis.collections.calls,
      connects: kpis.collections.connects,
      rpcs: kpis.collections.rpcs,
      promises: kpis.collections.promises,
      cashPayments: kpis.collections.cashPayments,
      transfers: kpis.collections.transfers,
      durationMinutes: kpis.collections.timeOnCallHours * 60,
      dollarPromised: kpis.collections.dollarPromised,
      dollarCollected: kpis.collections.dollarCollected,
    }),
    inbound: calculateDerivedCollectionsMetrics({
      accounts: kpis.inbound.accounts,
      calls: kpis.inbound.calls,
      connects: kpis.inbound.connects,
      rpcs: kpis.inbound.rpcs,
      promises: kpis.inbound.promises,
      cashPayments: kpis.inbound.cashPayments,
      transfers: kpis.inbound.transfers,
      durationMinutes: kpis.inbound.timeOnCallHours * 60,
      dollarPromised: kpis.inbound.dollarPromised,
      dollarCollected: kpis.inbound.dollarCollected,
    }),
    welcome: calculateDerivedWelcomeMetrics({
      accounts: kpis.welcome.accounts,
      calls: kpis.welcome.calls,
      connects: kpis.welcome.connects,
      rpcs: kpis.welcome.rpcs,
      eligible: kpis.welcome.eligible,
      completed: kpis.welcome.completed,
    }),
    verification: calculateDerivedWelcomeMetrics({
      accounts: kpis.verification.accounts,
      calls: kpis.verification.calls,
      connects: kpis.verification.connects,
      rpcs: kpis.verification.rpcs,
      eligible: kpis.verification.eligible,
      completed: kpis.verification.completed,
    }),
  };
}

// Cache for available clients (5 minute TTL)
let availableClientsCache: { clients: string[]; timestamp: number } | null = null;
const AVAILABLE_CLIENTS_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

// Get list of clients that have call tables in ClickHouse (with caching)
async function getAvailableClients(clickhouse: ClickHouseClient): Promise<string[]> {
  // Return cached result if still valid
  if (availableClientsCache && Date.now() - availableClientsCache.timestamp < AVAILABLE_CLIENTS_CACHE_TTL) {
    return availableClientsCache.clients;
  }

  const result = await clickhouse.query({
    query: `
      SELECT DISTINCT replaceRegexpOne(name, '^call_', '') as client
      FROM system.tables
      WHERE database = 'supabase'
        AND name LIKE 'call_%'
        AND name NOT LIKE 'call_%_agent%'
        AND name NOT LIKE 'call_%_customer%'
        AND name NOT LIKE 'call_%_dedup%'
        AND name NOT LIKE 'call_%_extras%'
        AND name NOT LIKE 'call_combined%'
        AND name NOT LIKE 'call_metrics%'
        AND name NOT LIKE 'call_auxiliary%'
    `,
    format: 'JSONEachRow',
  });

  const rows = await result.json() as { client: string }[];
  // Filter to only include clients from ALL_CLIENTS
  const clients = rows
    .map(r => r.client)
    .filter(c => ALL_CLIENTS.includes(c as ClientName));

  // Update cache
  availableClientsCache = { clients, timestamp: Date.now() };

  return clients;
}

// Fetch Consolidated KPI data (aggregated totals for all clients)
export async function fetchConsolidatedKPIs(
  month: string,
  excludeWestlake: boolean = false
): Promise<ConsolidatedViewData> {
  const clickhouse = getClickHouseClient();
  
  try {
    // Parse month and calculate date ranges
    const [year, monthNum] = month.split('-').map(Number);
    const currentDate = new Date(Date.UTC(year, monthNum - 1, 1));
    const prevMonthStr = getPrevMonth(month);
    const [prevYear, prevMonthNum] = prevMonthStr.split('-').map(Number);
    const prevDate = new Date(Date.UTC(prevYear, prevMonthNum - 1, 1));
    
    const currentStart = `${month}-01 00:00:00`;
    const currentEnd = `${getNextMonth(month)}-01 00:00:00`;
    const prevStart = `${prevMonthStr}-01 00:00:00`;
    const prevEnd = `${month}-01 00:00:00`;
    
    // Get available clients
    const availableClients = await getAvailableClients(clickhouse);
    const clients = excludeWestlake 
      ? availableClients.filter(c => c !== 'westlake')
      : availableClients;
    
    // Fetch both current and previous period for all clients
    const fetchClientData = async (client: string, startDate: string, endDate: string): Promise<PeriodKPIs> => {
      try {
        const result = await clickhouse.query({
          query: buildClientKPIQuery(client, startDate, endDate),
          format: 'JSONEachRow',
        });
        const rows = await result.json() as RawKPIRow[];
        return parseKPIResults(rows);
      } catch (error) {
        console.error(`Error fetching KPIs for ${client}:`, error);
        return emptyPeriodKPIs();
      }
    };
    
    // Fetch all clients data in batches of 5
    let currentTotal = emptyPeriodKPIs();
    let previousTotal = emptyPeriodKPIs();
    
    for (let i = 0; i < clients.length; i += 5) {
      const batch = clients.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.flatMap((client) => [
          fetchClientData(client, currentStart, currentEnd).then(kpis => ({ period: 'current', kpis })),
          fetchClientData(client, prevStart, prevEnd).then(kpis => ({ period: 'previous', kpis })),
        ])
      );
      
      for (const { period, kpis } of batchResults) {
        if (period === 'current') {
          currentTotal = sumPeriodKPIs(currentTotal, kpis);
        } else {
          previousTotal = sumPeriodKPIs(previousTotal, kpis);
        }
      }
    }
    
    // Recalculate derived metrics for totals
    currentTotal = recalculateDerivedMetrics(currentTotal);
    previousTotal = recalculateDerivedMetrics(previousTotal);
    
    return {
      currentPeriod: currentTotal,
      previousPeriod: previousTotal,
      currentPeriodLabel: formatMonthYear(currentDate),
      previousPeriodLabel: formatMonthYear(prevDate),
    };
  } finally {
    await clickhouse.close();
  }
}

// Fetch Consolidated KPI data with flexible date ranges
export async function fetchConsolidatedKPIsWithDateRange(
  currentRange: DateRange,
  comparisonRange: DateRange,
  comparisonType: ComparisonType,
  excludeWestlake: boolean = false
): Promise<ConsolidatedViewData> {
  const clickhouse = getClickHouseClient();

  try {
    const currentStart = formatDateTimeForQuery(currentRange.start);
    const currentEnd = formatDateTimeEndForQuery(currentRange.end);
    const compStart = formatDateTimeForQuery(comparisonRange.start);
    const compEnd = formatDateTimeEndForQuery(comparisonRange.end);

    // Get available clients
    const availableClients = await getAvailableClients(clickhouse);
    const clients = excludeWestlake
      ? availableClients.filter(c => c !== 'westlake')
      : availableClients;

    // Fetch client data for a date range
    const fetchClientData = async (client: string, startDate: string, endDate: string): Promise<PeriodKPIs> => {
      try {
        const result = await clickhouse.query({
          query: buildClientKPIQuery(client, startDate, endDate),
          format: 'JSONEachRow',
        });
        const rows = await result.json() as RawKPIRow[];
        return parseKPIResults(rows);
      } catch (error) {
        console.error(`Error fetching KPIs for ${client}:`, error);
        return emptyPeriodKPIs();
      }
    };

    // Fetch all clients data in batches of 5
    let currentTotal = emptyPeriodKPIs();
    let comparisonTotal = emptyPeriodKPIs();

    for (let i = 0; i < clients.length; i += 5) {
      const batch = clients.slice(i, i + 5);
      const batchResults = await Promise.all(
        batch.flatMap((client) => [
          fetchClientData(client, currentStart, currentEnd).then(kpis => ({ period: 'current', kpis })),
          fetchClientData(client, compStart, compEnd).then(kpis => ({ period: 'comparison', kpis })),
        ])
      );

      for (const { period, kpis } of batchResults) {
        if (period === 'current') {
          currentTotal = sumPeriodKPIs(currentTotal, kpis);
        } else {
          comparisonTotal = sumPeriodKPIs(comparisonTotal, kpis);
        }
      }
    }

    // Recalculate derived metrics for totals
    currentTotal = recalculateDerivedMetrics(currentTotal);
    comparisonTotal = recalculateDerivedMetrics(comparisonTotal);

    return {
      currentPeriod: currentTotal,
      previousPeriod: comparisonTotal,
      currentPeriodLabel: currentRange.label,
      previousPeriodLabel: comparisonRange.label,
      comparisonType,
      comparisonContext: `vs ${comparisonRange.label}`,
    };
  } finally {
    await clickhouse.close();
  }
}

// Fetch consolidated weekly average KPIs for WTD comparison
export async function fetchConsolidatedWeeklyAverageKPIs(
  referenceDate: Date,
  weeks: number = 4,
  excludeWestlake: boolean = false
): Promise<PeriodKPIs> {
  const clickhouse = getClickHouseClient();

  try {
    // Get available clients
    const availableClients = await getAvailableClients(clickhouse);
    const clients = excludeWestlake
      ? availableClients.filter(c => c !== 'westlake')
      : availableClients;

    // Get the ranges for each of the past N weeks
    const weeklyTotals: PeriodKPIs[] = [];

    for (let i = 1; i <= weeks; i++) {
      const weekDate = new Date(referenceDate);
      weekDate.setDate(weekDate.getDate() - (i * 7));
      const weekRange = getWeekRange(weekDate);

      const startStr = formatDateTimeForQuery(weekRange.start);
      const endStr = formatDateTimeEndForQuery(weekRange.end);

      // Fetch all clients for this week
      let weekTotal = emptyPeriodKPIs();

      for (let j = 0; j < clients.length; j += 5) {
        const batch = clients.slice(j, j + 5);
        const batchResults = await Promise.all(
          batch.map(async (client) => {
            try {
              const result = await clickhouse.query({
                query: buildClientKPIQuery(client, startStr, endStr),
                format: 'JSONEachRow',
              });
              const rows = await result.json() as RawKPIRow[];
              return parseKPIResults(rows);
            } catch {
              return emptyPeriodKPIs();
            }
          })
        );

        for (const kpis of batchResults) {
          weekTotal = sumPeriodKPIs(weekTotal, kpis);
        }
      }

      weeklyTotals.push(recalculateDerivedMetrics(weekTotal));
    }

    // Calculate average across all weeks
    if (weeklyTotals.length === 0) {
      return emptyPeriodKPIs();
    }

    // Sum all weekly KPIs
    let total = emptyPeriodKPIs();
    for (const kpi of weeklyTotals) {
      total = sumPeriodKPIs(total, kpi);
    }

    // Divide by number of weeks to get average
    const divisor = weeklyTotals.length;
    total = {
      collections: {
        accounts: total.collections.accounts / divisor,
        calls: total.collections.calls / divisor,
        callsPerAccount: 0,
        connects: total.collections.connects / divisor,
        connectRate: 0,
        rpcs: total.collections.rpcs / divisor,
        rpcRate: 0,
        promises: total.collections.promises / divisor,
        promisesPerRpc: 0,
        cashPayments: total.collections.cashPayments / divisor,
        cashPerRpc: 0,
        cashPerPromises: 0,
        transfers: total.collections.transfers / divisor,
        transfersPerRpc: 0,
        timeOnCallHours: total.collections.timeOnCallHours / divisor,
        avgTimePerCallMin: 0,
        dollarPromised: total.collections.dollarPromised / divisor,
        dollarCollected: total.collections.dollarCollected / divisor,
        avgPaymentAmount: 0,
        dollarPerRpc: 0,
      },
      inbound: {
        accounts: total.inbound.accounts / divisor,
        calls: total.inbound.calls / divisor,
        callsPerAccount: 0,
        connects: total.inbound.connects / divisor,
        connectRate: 0,
        rpcs: total.inbound.rpcs / divisor,
        rpcRate: 0,
        promises: total.inbound.promises / divisor,
        promisesPerRpc: 0,
        cashPayments: total.inbound.cashPayments / divisor,
        cashPerRpc: 0,
        cashPerPromises: 0,
        transfers: total.inbound.transfers / divisor,
        transfersPerRpc: 0,
        timeOnCallHours: total.inbound.timeOnCallHours / divisor,
        avgTimePerCallMin: 0,
        dollarPromised: total.inbound.dollarPromised / divisor,
        dollarCollected: total.inbound.dollarCollected / divisor,
        avgPaymentAmount: 0,
        dollarPerRpc: 0,
      },
      welcome: {
        accounts: total.welcome.accounts / divisor,
        calls: total.welcome.calls / divisor,
        callsPerAccount: 0,
        connects: total.welcome.connects / divisor,
        connectRate: 0,
        rpcs: total.welcome.rpcs / divisor,
        rpcRate: 0,
        eligible: total.welcome.eligible / divisor,
        eligiblePerRpc: 0,
        completed: total.welcome.completed / divisor,
        completedPerEligible: 0,
        completedPerRpc: 0,
        incomplete: total.welcome.incomplete / divisor,
      },
      verification: {
        accounts: total.verification.accounts / divisor,
        calls: total.verification.calls / divisor,
        callsPerAccount: 0,
        connects: total.verification.connects / divisor,
        connectRate: 0,
        rpcs: total.verification.rpcs / divisor,
        rpcRate: 0,
        eligible: total.verification.eligible / divisor,
        eligiblePerRpc: 0,
        completed: total.verification.completed / divisor,
        completedPerEligible: 0,
        completedPerRpc: 0,
        incomplete: total.verification.incomplete / divisor,
      },
    };

    // Recalculate derived metrics
    return recalculateDerivedMetrics(total);
  } finally {
    await clickhouse.close();
  }
}

// ============================================
// HISTORICAL TREND DATA
// ============================================

export interface MonthlyTrendPoint {
  month: string; // YYYY-MM
  label: string; // e.g., "Nov-24"
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

// Fetch historical monthly data for trends
export async function fetchHistoricalTrends(
  client: ClientName | 'all',
  months: number = 12,
  excludeWestlake: boolean = false
): Promise<HistoricalTrendData> {
  const clickhouse = getClickHouseClient();

  try {
    const monthlyData: MonthlyTrendPoint[] = [];
    const now = new Date();

    // Generate list of months to fetch (from oldest to newest)
    const monthsToFetch: { year: number; month: number; label: string; value: string }[] = [];
    for (let i = months - 1; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = date.getMonth() + 1;
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      monthsToFetch.push({
        year,
        month,
        label: `${monthNames[month - 1]}-${String(year).slice(-2)}`,
        value: `${year}-${String(month).padStart(2, '0')}`,
      });
    }

    // Pre-fetch available clients once if needed (for 'all' client mode)
    const availableClients = client === 'all' ? await getAvailableClients(clickhouse) : [];
    const clientsToFetch = client === 'all'
      ? (excludeWestlake ? availableClients.filter(c => c !== 'westlake') : availableClients)
      : [];

    // Helper function to fetch data for a single month
    const fetchMonthData = async (monthInfo: { year: number; month: number; label: string; value: string }): Promise<MonthlyTrendPoint> => {
      const startDate = `${monthInfo.value}-01 00:00:00`;
      const nextMonth = monthInfo.month === 12
        ? `${monthInfo.year + 1}-01`
        : `${monthInfo.year}-${String(monthInfo.month + 1).padStart(2, '0')}`;
      const endDate = `${nextMonth}-01 00:00:00`;

      let monthKPIs: PeriodKPIs;

      if (client === 'all') {
        // Fetch all clients in parallel for this month
        const allClientResults = await Promise.all(
          clientsToFetch.map(async (c) => {
            try {
              const result = await clickhouse.query({
                query: buildClientKPIQuery(c, startDate, endDate),
                format: 'JSONEachRow',
              });
              const rows = await result.json() as RawKPIRow[];
              return parseKPIResults(rows);
            } catch {
              return emptyPeriodKPIs();
            }
          })
        );

        let total = emptyPeriodKPIs();
        for (const kpis of allClientResults) {
          total = sumPeriodKPIs(total, kpis);
        }
        monthKPIs = recalculateDerivedMetrics(total);
      } else {
        // Fetch single client data
        try {
          const result = await clickhouse.query({
            query: buildClientKPIQuery(client, startDate, endDate),
            format: 'JSONEachRow',
          });
          const rows = await result.json() as RawKPIRow[];
          monthKPIs = parseKPIResults(rows);
        } catch {
          monthKPIs = emptyPeriodKPIs();
        }
      }

      return {
        month: monthInfo.value,
        label: monthInfo.label,
        collections: {
          calls: monthKPIs.collections.calls,
          connects: monthKPIs.collections.connects,
          connectRate: monthKPIs.collections.connectRate,
          rpcs: monthKPIs.collections.rpcs,
          rpcRate: monthKPIs.collections.rpcRate,
          promises: monthKPIs.collections.promises,
          promisesPerRpc: monthKPIs.collections.promisesPerRpc,
          cashPayments: monthKPIs.collections.cashPayments,
          cashPerRpc: monthKPIs.collections.cashPerRpc,
          dollarPromised: monthKPIs.collections.dollarPromised,
          dollarCollected: monthKPIs.collections.dollarCollected,
        },
        inbound: {
          calls: monthKPIs.inbound.calls,
          connects: monthKPIs.inbound.connects,
          connectRate: monthKPIs.inbound.connectRate,
          rpcs: monthKPIs.inbound.rpcs,
          rpcRate: monthKPIs.inbound.rpcRate,
          promises: monthKPIs.inbound.promises,
          cashPayments: monthKPIs.inbound.cashPayments,
          dollarPromised: monthKPIs.inbound.dollarPromised,
          dollarCollected: monthKPIs.inbound.dollarCollected,
        },
      };
    };

    // Fetch all months in parallel (batched to avoid overwhelming the DB)
    const MONTH_BATCH_SIZE = 4; // Process 4 months at a time
    for (let i = 0; i < monthsToFetch.length; i += MONTH_BATCH_SIZE) {
      const monthBatch = monthsToFetch.slice(i, i + MONTH_BATCH_SIZE);
      const batchResults = await Promise.all(monthBatch.map(fetchMonthData));
      monthlyData.push(...batchResults);
    }

    return {
      client: client === 'all' ? undefined : client,
      displayName: client === 'all'
        ? (excludeWestlake ? 'All Clients (Excl. Westlake)' : 'All Clients')
        : getClientDisplayName(client),
      months: monthlyData,
      periodCount: months,
    };
  } finally {
    await clickhouse.close();
  }
}

// ============================================
// PAYMENT OUTCOME DATA
// ============================================

export interface PaymentOutcomeData {
  totalAttempts: number;
  successful: number;
  declined: number;
  apiFailed: number;
  successRate: number;
  declineRate: number;
  apiFailureRate: number;
}

// Build query for payment outcome breakdown
function buildPaymentOutcomeQuery(
  client: string,
  startDate: string,
  endDate: string
): string {
  const testAccountsList = TEST_ACCOUNTS.map(a => `'${a}'`).join(', ');
  const testPhonesList = TEST_PHONE_NUMBERS.map(p => `'${p}'`).join(', ');

  return `
    SELECT
      countIf(c.result IN ('PHO', 'FCC', 'PHO-F', 'FCC-F')) as total_attempts,
      countIf(c.payment_successful = 1) as successful,
      countIf(c.payment_declined = 1) as declined,
      countIf(c.payment_api_failed = 1) as api_failed
    FROM supabase.call_${client} c
    WHERE c.start_time >= toDateTime('${startDate}', 'UTC')
      AND c.start_time < toDateTime('${endDate}', 'UTC')
      AND coalesce(c.account_number, '') NOT IN (${testAccountsList}, '')
      AND NOT has([${testPhonesList}], coalesce(c.phone_number, ''))
      AND c.result IS NOT NULL
  `;
}

// Fetch payment outcome data for a client or all clients
export async function fetchPaymentOutcomes(
  client: ClientName | 'all',
  startDate: string,
  endDate: string,
  excludeWestlake: boolean = false
): Promise<PaymentOutcomeData> {
  const clickhouse = getClickHouseClient();

  try {
    let totalAttempts = 0;
    let successful = 0;
    let declined = 0;
    let apiFailed = 0;

    if (client === 'all') {
      const availableClients = await getAvailableClients(clickhouse);
      const clients = excludeWestlake
        ? availableClients.filter(c => c !== 'westlake')
        : availableClients;

      for (let i = 0; i < clients.length; i += 5) {
        const batch = clients.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map(async (c) => {
            try {
              const result = await clickhouse.query({
                query: buildPaymentOutcomeQuery(c, startDate, endDate),
                format: 'JSONEachRow',
              });
              const rows = await result.json() as { total_attempts: string; successful: string; declined: string; api_failed: string }[];
              return rows[0] || { total_attempts: '0', successful: '0', declined: '0', api_failed: '0' };
            } catch {
              return { total_attempts: '0', successful: '0', declined: '0', api_failed: '0' };
            }
          })
        );

        for (const row of batchResults) {
          totalAttempts += parseInt(row.total_attempts) || 0;
          successful += parseInt(row.successful) || 0;
          declined += parseInt(row.declined) || 0;
          apiFailed += parseInt(row.api_failed) || 0;
        }
      }
    } else {
      const result = await clickhouse.query({
        query: buildPaymentOutcomeQuery(client, startDate, endDate),
        format: 'JSONEachRow',
      });
      const rows = await result.json() as { total_attempts: string; successful: string; declined: string; api_failed: string }[];
      const row = rows[0] || { total_attempts: '0', successful: '0', declined: '0', api_failed: '0' };
      totalAttempts = parseInt(row.total_attempts) || 0;
      successful = parseInt(row.successful) || 0;
      declined = parseInt(row.declined) || 0;
      apiFailed = parseInt(row.api_failed) || 0;
    }

    return {
      totalAttempts,
      successful,
      declined,
      apiFailed,
      successRate: totalAttempts > 0 ? (successful / totalAttempts) * 100 : 0,
      declineRate: totalAttempts > 0 ? (declined / totalAttempts) * 100 : 0,
      apiFailureRate: totalAttempts > 0 ? (apiFailed / totalAttempts) * 100 : 0,
    };
  } finally {
    await clickhouse.close();
  }
}

// ============================================
// DELINQUENCY SEGMENTATION DATA
// ============================================

export interface DelinquencyBucketData {
  bucket: string;
  bucketLabel: string;
  accounts: number;
  calls: number;
  connects: number;
  connectRate: number;
  rpcs: number;
  rpcRate: number;
  promises: number;
  promisesPerRpc: number;
  cashPayments: number;
  cashPerRpc: number;
  dollarCollected: number;
  dollarPerRpc: number;
}

export interface DelinquencyBreakdownData {
  buckets: DelinquencyBucketData[];
  total: {
    accounts: number;
    calls: number;
    rpcs: number;
    promises: number;
    cashPayments: number;
    dollarCollected: number;
  };
}

// Build query for delinquency breakdown
function buildDelinquencyQuery(
  client: string,
  startDate: string,
  endDate: string
): string {
  const testAccountsList = TEST_ACCOUNTS.map(a => `'${a}'`).join(', ');
  const testPhonesList = TEST_PHONE_NUMBERS.map(p => `'${p}'`).join(', ');
  const nonConnectList = NON_CONNECT_RESULTS.map(r => `'${r}'`).join(', ');
  const nonRpcList = [...NON_CONNECT_RESULTS, ...NON_RPC_RESULTS].map(r => `'${r}'`).join(', ');
  const ptpList = PTP_RESULTS.map(r => `'${r}'`).join(', ');
  const cashList = CASH_RESULTS.map(r => `'${r}'`).join(', ');

  return `
    SELECT
      CASE
        WHEN coalesce(c.dlq_days, 0) <= 30 THEN '1-30'
        WHEN coalesce(c.dlq_days, 0) <= 60 THEN '31-60'
        WHEN coalesce(c.dlq_days, 0) <= 90 THEN '61-90'
        ELSE '90+'
      END as dlq_bucket,
      count(DISTINCT c.account_number) as accounts,
      count(*) as calls,
      countIf(c.result NOT IN (${nonConnectList})) as connects,
      countIf(c.result NOT IN (${nonRpcList})) as rpcs,
      countIf(c.result IN (${ptpList}) OR c.notated_promise_to_pay = 1) as promises,
      countIf(c.result IN (${cashList})) as cash_payments,
      sum(coalesce(c.payment_amount, 0)) as dollar_collected
    FROM supabase.call_${client} c
    WHERE c.start_time >= toDateTime('${startDate}', 'UTC')
      AND c.start_time < toDateTime('${endDate}', 'UTC')
      AND coalesce(c.account_number, '') NOT IN (${testAccountsList}, '')
      AND NOT has([${testPhonesList}], coalesce(c.phone_number, ''))
      AND c.result IS NOT NULL
      AND c.model = 'collections'
    GROUP BY dlq_bucket
    ORDER BY dlq_bucket
  `;
}

// Fetch delinquency breakdown data
export async function fetchDelinquencyBreakdown(
  client: ClientName | 'all',
  startDate: string,
  endDate: string,
  excludeWestlake: boolean = false
): Promise<DelinquencyBreakdownData> {
  const clickhouse = getClickHouseClient();

  const bucketLabels: Record<string, string> = {
    '1-30': '1-30 Days',
    '31-60': '31-60 Days',
    '61-90': '61-90 Days',
    '90+': '90+ Days',
  };

  const emptyBuckets = (): Record<string, { accounts: number; calls: number; connects: number; rpcs: number; promises: number; cashPayments: number; dollarCollected: number }> => ({
    '1-30': { accounts: 0, calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0, dollarCollected: 0 },
    '31-60': { accounts: 0, calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0, dollarCollected: 0 },
    '61-90': { accounts: 0, calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0, dollarCollected: 0 },
    '90+': { accounts: 0, calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0, dollarCollected: 0 },
  });

  try {
    const bucketData = emptyBuckets();

    if (client === 'all') {
      const availableClients = await getAvailableClients(clickhouse);
      const clients = excludeWestlake
        ? availableClients.filter(c => c !== 'westlake')
        : availableClients;

      for (let i = 0; i < clients.length; i += 5) {
        const batch = clients.slice(i, i + 5);
        const batchResults = await Promise.all(
          batch.map(async (c) => {
            try {
              const result = await clickhouse.query({
                query: buildDelinquencyQuery(c, startDate, endDate),
                format: 'JSONEachRow',
              });
              return await result.json() as {
                dlq_bucket: string;
                accounts: string;
                calls: string;
                connects: string;
                rpcs: string;
                promises: string;
                cash_payments: string;
                dollar_collected: string;
              }[];
            } catch {
              return [];
            }
          })
        );

        for (const rows of batchResults) {
          for (const row of rows) {
            const bucket = row.dlq_bucket;
            if (bucketData[bucket]) {
              bucketData[bucket].accounts += parseInt(row.accounts) || 0;
              bucketData[bucket].calls += parseInt(row.calls) || 0;
              bucketData[bucket].connects += parseInt(row.connects) || 0;
              bucketData[bucket].rpcs += parseInt(row.rpcs) || 0;
              bucketData[bucket].promises += parseInt(row.promises) || 0;
              bucketData[bucket].cashPayments += parseInt(row.cash_payments) || 0;
              bucketData[bucket].dollarCollected += parseFloat(row.dollar_collected) || 0;
            }
          }
        }
      }
    } else {
      try {
        const result = await clickhouse.query({
          query: buildDelinquencyQuery(client, startDate, endDate),
          format: 'JSONEachRow',
        });
        const rows = await result.json() as {
          dlq_bucket: string;
          accounts: string;
          calls: string;
          connects: string;
          rpcs: string;
          promises: string;
          cash_payments: string;
          dollar_collected: string;
        }[];

        for (const row of rows) {
          const bucket = row.dlq_bucket;
          if (bucketData[bucket]) {
            bucketData[bucket].accounts = parseInt(row.accounts) || 0;
            bucketData[bucket].calls = parseInt(row.calls) || 0;
            bucketData[bucket].connects = parseInt(row.connects) || 0;
            bucketData[bucket].rpcs = parseInt(row.rpcs) || 0;
            bucketData[bucket].promises = parseInt(row.promises) || 0;
            bucketData[bucket].cashPayments = parseInt(row.cash_payments) || 0;
            bucketData[bucket].dollarCollected = parseFloat(row.dollar_collected) || 0;
          }
        }
      } catch (error) {
        console.error(`Error fetching delinquency data for ${client}:`, error);
      }
    }

    // Convert to array format with calculated rates
    const buckets: DelinquencyBucketData[] = Object.entries(bucketData).map(([bucket, data]) => ({
      bucket,
      bucketLabel: bucketLabels[bucket] || bucket,
      accounts: data.accounts,
      calls: data.calls,
      connects: data.connects,
      connectRate: data.calls > 0 ? (data.connects / data.calls) * 100 : 0,
      rpcs: data.rpcs,
      rpcRate: data.connects > 0 ? (data.rpcs / data.connects) * 100 : 0,
      promises: data.promises,
      promisesPerRpc: data.rpcs > 0 ? (data.promises / data.rpcs) * 100 : 0,
      cashPayments: data.cashPayments,
      cashPerRpc: data.rpcs > 0 ? (data.cashPayments / data.rpcs) * 100 : 0,
      dollarCollected: data.dollarCollected,
      dollarPerRpc: data.rpcs > 0 ? data.dollarCollected / data.rpcs : 0,
    }));

    // Calculate totals
    const total = {
      accounts: Object.values(bucketData).reduce((sum, b) => sum + b.accounts, 0),
      calls: Object.values(bucketData).reduce((sum, b) => sum + b.calls, 0),
      rpcs: Object.values(bucketData).reduce((sum, b) => sum + b.rpcs, 0),
      promises: Object.values(bucketData).reduce((sum, b) => sum + b.promises, 0),
      cashPayments: Object.values(bucketData).reduce((sum, b) => sum + b.cashPayments, 0),
      dollarCollected: Object.values(bucketData).reduce((sum, b) => sum + b.dollarCollected, 0),
    };

    return { buckets, total };
  } finally {
    await clickhouse.close();
  }
}

// ============================================
// SCORECARD DATA (ALL CLIENTS BATCH)
// ============================================

import type {
  HealthStatus,
  ScorecardMetric,
  ClientScorecardData,
  AllClientsScorecardData,
} from '@/types';

/**
 * Determine health status based on % change
 * Critical: ≤ -15%
 * Warning: -15% to -5%
 * Neutral: -5% to +5%
 * Good: ≥ +5%
 */
function getHealthStatus(change: number, invertLogic: boolean = false): HealthStatus {
  // For some metrics, down is bad (like RPC rate)
  // For others, we might want different logic
  const adjustedChange = invertLogic ? -change : change;

  if (adjustedChange <= -15) return 'critical';
  if (adjustedChange < -5) return 'warning';
  if (adjustedChange > 5) return 'good';
  return 'neutral';
}

/**
 * Create a scorecard metric with change calculation
 */
function createScorecardMetric(
  current: number,
  baseline: number,
  invertLogic: boolean = false
): ScorecardMetric {
  const change = baseline > 0 ? ((current - baseline) / baseline) * 100 : 0;
  const trend: 'up' | 'down' | 'neutral' =
    change > 0.5 ? 'up' : change < -0.5 ? 'down' : 'neutral';

  return {
    current,
    baseline,
    change,
    trend,
    status: getHealthStatus(change, invertLogic),
  };
}

/**
 * Calculate overall health score (0-100)
 * Weighted average of key metric changes
 */
function calculateOverallScore(metrics: {
  callVolume: ScorecardMetric;
  connectRate: ScorecardMetric;
  rpcRate: ScorecardMetric;
  promiseRate: ScorecardMetric;
  paymentSuccess: ScorecardMetric;
  dollarCollected: ScorecardMetric;
}): number {
  // Weights for each metric
  const weights = {
    callVolume: 0.10,      // Call volume matters but less than outcomes
    connectRate: 0.15,
    rpcRate: 0.20,         // RPC rate is important
    promiseRate: 0.15,
    paymentSuccess: 0.20,  // Payment success is critical
    dollarCollected: 0.20, // Dollars collected is critical
  };

  // Convert change % to a score (50 = no change, higher = better)
  // Clamp changes to reasonable range (-50% to +50%)
  const getScore = (change: number): number => {
    const clampedChange = Math.max(-50, Math.min(50, change));
    return 50 + clampedChange; // -50% = 0, 0% = 50, +50% = 100
  };

  const weightedScore =
    weights.callVolume * getScore(metrics.callVolume.change) +
    weights.connectRate * getScore(metrics.connectRate.change) +
    weights.rpcRate * getScore(metrics.rpcRate.change) +
    weights.promiseRate * getScore(metrics.promiseRate.change) +
    weights.paymentSuccess * getScore(metrics.paymentSuccess.change) +
    weights.dollarCollected * getScore(metrics.dollarCollected.change);

  return Math.round(Math.max(0, Math.min(100, weightedScore)));
}

/**
 * Get overall health status from score
 */
function getOverallStatusFromScore(score: number): HealthStatus {
  if (score >= 55) return 'good';
  if (score >= 45) return 'neutral';
  if (score >= 35) return 'warning';
  return 'critical';
}

/**
 * Helper to calculate averaged KPIs from an array of weekly KPIs
 */
function averageWeeklyKPIs(weeklyKPIs: PeriodKPIs[]): PeriodKPIs {
  if (weeklyKPIs.length === 0) {
    return emptyPeriodKPIs();
  }

  let total = emptyPeriodKPIs();
  for (const kpi of weeklyKPIs) {
    total = sumPeriodKPIs(total, kpi);
  }

  const divisor = weeklyKPIs.length;
  const averaged: PeriodKPIs = {
    collections: {
      accounts: total.collections.accounts / divisor,
      calls: total.collections.calls / divisor,
      callsPerAccount: 0,
      connects: total.collections.connects / divisor,
      connectRate: 0,
      rpcs: total.collections.rpcs / divisor,
      rpcRate: 0,
      promises: total.collections.promises / divisor,
      promisesPerRpc: 0,
      cashPayments: total.collections.cashPayments / divisor,
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: total.collections.transfers / divisor,
      transfersPerRpc: 0,
      timeOnCallHours: total.collections.timeOnCallHours / divisor,
      avgTimePerCallMin: 0,
      dollarPromised: total.collections.dollarPromised / divisor,
      dollarCollected: total.collections.dollarCollected / divisor,
      avgPaymentAmount: 0,
      dollarPerRpc: 0,
    },
    inbound: {
      accounts: total.inbound.accounts / divisor,
      calls: total.inbound.calls / divisor,
      callsPerAccount: 0,
      connects: total.inbound.connects / divisor,
      connectRate: 0,
      rpcs: total.inbound.rpcs / divisor,
      rpcRate: 0,
      promises: total.inbound.promises / divisor,
      promisesPerRpc: 0,
      cashPayments: total.inbound.cashPayments / divisor,
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: total.inbound.transfers / divisor,
      transfersPerRpc: 0,
      timeOnCallHours: total.inbound.timeOnCallHours / divisor,
      avgTimePerCallMin: 0,
      dollarPromised: total.inbound.dollarPromised / divisor,
      dollarCollected: total.inbound.dollarCollected / divisor,
      avgPaymentAmount: 0,
      dollarPerRpc: 0,
    },
    welcome: {
      accounts: total.welcome.accounts / divisor,
      calls: total.welcome.calls / divisor,
      callsPerAccount: 0,
      connects: total.welcome.connects / divisor,
      connectRate: 0,
      rpcs: total.welcome.rpcs / divisor,
      rpcRate: 0,
      eligible: total.welcome.eligible / divisor,
      eligiblePerRpc: 0,
      completed: total.welcome.completed / divisor,
      completedPerEligible: 0,
      completedPerRpc: 0,
      incomplete: total.welcome.incomplete / divisor,
    },
    verification: {
      accounts: total.verification.accounts / divisor,
      calls: total.verification.calls / divisor,
      callsPerAccount: 0,
      connects: total.verification.connects / divisor,
      connectRate: 0,
      rpcs: total.verification.rpcs / divisor,
      rpcRate: 0,
      eligible: total.verification.eligible / divisor,
      eligiblePerRpc: 0,
      completed: total.verification.completed / divisor,
      completedPerEligible: 0,
      completedPerRpc: 0,
      incomplete: total.verification.incomplete / divisor,
    },
  };

  return recalculateDerivedMetrics(averaged);
}

/**
 * Fetch scorecard data for all clients in a single batch operation
 * Compares current WTD (last 7 days) vs 4-week rolling average
 *
 * OPTIMIZED: Fetches all 5 weeks (current + 4 baseline) in parallel per client
 */
export async function fetchAllClientsScorecardData(): Promise<AllClientsScorecardData> {
  const clickhouse = getClickHouseClient();

  try {
    const now = new Date();

    // Current range: rolling 7 days (today - 6 days → today)
    const currentRange = getRolling7DayRange(now);

    // Pre-calculate all period ranges (current + 4 baseline periods)
    const weekRanges: { start: string; end: string }[] = [];

    // Period 0 = current rolling 7 days
    weekRanges.push({
      start: formatDateTimeForQuery(currentRange.start),
      end: formatDateTimeEndForQuery(currentRange.end),
    });

    // Periods 1-4 = baseline rolling 7-day periods
    // Each period ends the day before the previous period starts
    for (let w = 1; w <= 4; w++) {
      const periodEnd = new Date(currentRange.start);
      periodEnd.setDate(periodEnd.getDate() - ((w - 1) * 7) - 1);
      const periodRange = getRolling7DayRange(periodEnd);
      weekRanges.push({
        start: formatDateTimeForQuery(periodRange.start),
        end: formatDateTimeEndForQuery(periodRange.end),
      });
    }

    // Get available clients
    const availableClients = await getAvailableClients(clickhouse);

    // Build all (client, weekIndex) query pairs upfront
    type QueryTask = { client: string; weekIndex: number; range: { start: string; end: string } };
    const allQueryTasks: QueryTask[] = [];

    for (const client of availableClients) {
      for (let weekIndex = 0; weekIndex < weekRanges.length; weekIndex++) {
        allQueryTasks.push({ client, weekIndex, range: weekRanges[weekIndex] });
      }
    }

    // Execute all queries in parallel batches (30 concurrent queries max)
    const QUERY_BATCH_SIZE = 30;
    const queryResults: Map<string, PeriodKPIs[]> = new Map();

    // Initialize result arrays for each client
    for (const client of availableClients) {
      queryResults.set(client, new Array(weekRanges.length).fill(null));
    }

    // Process all query tasks in batches
    for (let i = 0; i < allQueryTasks.length; i += QUERY_BATCH_SIZE) {
      const taskBatch = allQueryTasks.slice(i, i + QUERY_BATCH_SIZE);

      const batchResults = await Promise.all(
        taskBatch.map(async (task) => {
          try {
            const result = await clickhouse.query({
              query: buildClientKPIQuery(task.client, task.range.start, task.range.end),
              format: 'JSONEachRow',
            });
            const rows = await result.json() as RawKPIRow[];
            return { ...task, kpis: parseKPIResults(rows) };
          } catch {
            return { ...task, kpis: emptyPeriodKPIs() };
          }
        })
      );

      // Store results in the appropriate client/week slot
      for (const { client, weekIndex, kpis } of batchResults) {
        const clientResults = queryResults.get(client)!;
        clientResults[weekIndex] = kpis;
      }
    }

    // Build final client data from query results
    const clientCurrentData: Map<string, PeriodKPIs> = new Map();
    const clientBaselineData: Map<string, PeriodKPIs> = new Map();

    for (const client of availableClients) {
      const weekResults = queryResults.get(client)!;
      // Period 0 is current rolling 7 days, periods 1-4 are baseline
      const currentKPIs = weekResults[0] || emptyPeriodKPIs();
      const baselineKPIs = averageWeeklyKPIs(weekResults.slice(1).filter(Boolean) as PeriodKPIs[]);

      clientCurrentData.set(client, currentKPIs);
      clientBaselineData.set(client, baselineKPIs);
    }

    // Build scorecard data for each client
    const clients: ClientScorecardData[] = availableClients.map((client) => {
      const current = clientCurrentData.get(client) || emptyPeriodKPIs();
      const baseline = clientBaselineData.get(client) || emptyPeriodKPIs();

      // Combine collections + inbound for totals
      const currentCalls = current.collections.calls + current.inbound.calls;
      const baselineCalls = baseline.collections.calls + baseline.inbound.calls;

      const currentConnects = current.collections.connects + current.inbound.connects;
      const baselineConnects = baseline.collections.connects + baseline.inbound.connects;

      const currentRpcs = current.collections.rpcs + current.inbound.rpcs;
      const baselineRpcs = baseline.collections.rpcs + baseline.inbound.rpcs;

      const currentPromises = current.collections.promises + current.inbound.promises;
      const baselinePromises = baseline.collections.promises + baseline.inbound.promises;

      const currentPayments = current.collections.cashPayments + current.inbound.cashPayments;
      const baselinePayments = baseline.collections.cashPayments + baseline.inbound.cashPayments;

      const currentDollars = current.collections.dollarCollected + current.inbound.dollarCollected;
      const baselineDollars = baseline.collections.dollarCollected + baseline.inbound.dollarCollected;

      // Calculate rates
      const currentConnectRate = currentCalls > 0 ? (currentConnects / currentCalls) * 100 : 0;
      const baselineConnectRate = baselineCalls > 0 ? (baselineConnects / baselineCalls) * 100 : 0;

      const currentRpcRate = currentConnects > 0 ? (currentRpcs / currentConnects) * 100 : 0;
      const baselineRpcRate = baselineConnects > 0 ? (baselineRpcs / baselineConnects) * 100 : 0;

      const currentPromiseRate = currentRpcs > 0 ? (currentPromises / currentRpcs) * 100 : 0;
      const baselinePromiseRate = baselineRpcs > 0 ? (baselinePromises / baselineRpcs) * 100 : 0;

      const currentPaymentRate = currentRpcs > 0 ? (currentPayments / currentRpcs) * 100 : 0;
      const baselinePaymentRate = baselineRpcs > 0 ? (baselinePayments / baselineRpcs) * 100 : 0;

      // Create metrics
      const callVolume = createScorecardMetric(currentCalls, baselineCalls);
      const connectRate = createScorecardMetric(currentConnectRate, baselineConnectRate);
      const rpcRate = createScorecardMetric(currentRpcRate, baselineRpcRate);
      const promiseRate = createScorecardMetric(currentPromiseRate, baselinePromiseRate);
      const paymentSuccess = createScorecardMetric(currentPaymentRate, baselinePaymentRate);
      const dollarCollected = createScorecardMetric(currentDollars, baselineDollars);

      const overallScore = calculateOverallScore({
        callVolume,
        connectRate,
        rpcRate,
        promiseRate,
        paymentSuccess,
        dollarCollected,
      });

      return {
        client: client as ClientName,
        displayName: getClientDisplayName(client),
        callVolume,
        connectRate,
        rpcRate,
        promiseRate,
        paymentSuccess,
        dollarCollected,
        overallScore,
        overallStatus: getOverallStatusFromScore(overallScore),
        currentPeriodLabel: currentRange.label,
        comparisonLabel: 'vs 4-week avg',
      };
    });

    return {
      clients,
      periodInfo: {
        currentRange,
        comparisonDescription: 'Last 7 days vs 4-week rolling average',
      },
      generatedAt: new Date().toISOString(),
    };
  } finally {
    await clickhouse.close();
  }
}

// Export for backward compatibility
export { getClickHouseClient };
