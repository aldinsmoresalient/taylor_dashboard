// Time period types
export type TimePeriod = 'daily' | 'weekly' | 'monthly';

// Comparison types for different period analyses
export type ComparisonType = 'mom' | 'wow' | 'mtd' | 'wtd';

// Date range interface
export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

// Period configuration with comparison metadata
export interface PeriodConfig {
  periodType: ComparisonType;
  currentRange: DateRange;
  comparisonRange: DateRange;
  comparisonLabel: string; // e.g., "vs Dec", "vs last week", "vs weekly avg"
}

// View types
export type ViewType = 'consolidated' | 'client-mix' | 'per-client' | 'scorecard';

// Client filter types
export type ClientFilter = 'all' | 'non-westlake' | string;

// Call direction/type categories
export type CallCategory = 'collections' | 'inbound' | 'welcome' | 'verification';

// List of all clients
export const ALL_CLIENTS = [
  'exeter',
  'aca',
  'cps',
  'ally',
  'autonation',
  'cac',
  'carmax',
  'creditone',
  'finbe',
  'ftb',
  'gm',
  'gofi',
  'maf',
  'prestige',
  'strike',
  'tenet',
  'tricolor',
  'uacc',
  'universal',
  'westlake',
  'yendo',
] as const;

export type ClientName = typeof ALL_CLIENTS[number];

// Collections/Inbound Metrics
export interface CollectionsMetrics {
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
  // Dollar metrics
  dollarPromised: number;
  dollarCollected: number;
  avgPaymentAmount: number;
  dollarPerRpc: number;
}

// Welcome/Verification Metrics
export interface WelcomeVerificationMetrics {
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

// Full KPI data for a period
export interface PeriodKPIs {
  collections: CollectionsMetrics;
  inbound: CollectionsMetrics;
  welcome: WelcomeVerificationMetrics;
  verification: WelcomeVerificationMetrics;
}

// Client KPI data with current and previous period
export interface ClientKPIData {
  client: ClientName | 'total';
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs | null;
  periodLabel: string;
  previousPeriodLabel: string | null;
}

// For consolidated view - client column data
export interface ClientColumnData {
  client: ClientName;
  displayName: string;
  currentPeriod: PeriodKPIs;
  percentOfTotal: PeriodKPIs; // Each metric as % of total
}

// Consolidated view data
export interface ConsolidatedViewData {
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  currentPeriodLabel: string;
  previousPeriodLabel: string;
  comparisonType?: ComparisonType;
  comparisonContext?: string; // e.g., "vs Dec 1-19" for MTD
}

// Per-client view data
export interface PerClientViewData {
  client: ClientName;
  displayName: string;
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
  comparisonType?: ComparisonType;
  comparisonContext?: string; // e.g., "vs Dec 1-19" for MTD
}

// Trend indicator (used for MoM, WoW, MTD, WTD comparisons)
export type TrendDirection = 'up' | 'down' | 'neutral';

// Legacy alias for backward compatibility
export type MoMTrend = TrendDirection;

export interface MoMChange {
  value: number; // percentage change
  trend: TrendDirection;
}

// Generic comparison change interface (for all comparison types)
export interface ComparisonChange {
  value: number; // percentage change
  trend: TrendDirection;
  comparisonType: ComparisonType;
}

// Payment outcome metrics
export interface PaymentOutcomeMetrics {
  totalAttempts: number;
  successful: number;
  declined: number;
  apiFailed: number;
  successRate: number;
  declineRate: number;
  apiFailureRate: number;
}

// Delinquency bucket types
export type DelinquencyBucket = '1-30' | '31-60' | '61-90' | '90+';

// Metrics by delinquency bucket
export interface DelinquencyMetrics {
  bucket: DelinquencyBucket;
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

export interface DelinquencyBreakdown {
  buckets: DelinquencyMetrics[];
  total: {
    accounts: number;
    calls: number;
    rpcs: number;
    promises: number;
    cashPayments: number;
    dollarCollected: number;
  };
}

// API Response types
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Test accounts and phone numbers to exclude
export const TEST_ACCOUNTS = [
  'TEST_ACCOUNT',
  'RUOK_TEST_ACCOUNT',
  'RUOK_TEST_NUMBER',
  'RUOK_TEST_CALL',
  'demo_web_call',
] as const;

export const TEST_PHONE_NUMBERS = [
  '9178606462', '6302094756', '2179049269', '6267780859', '6468818853',
  '6154876955', '9419288298', '8584499245', '4125199457', '6199522671',
  '6748395926', '2067795143', '3318146187', '4255159695', '9897689493',
  '2175184592', '4708360127', '9294123493', '4242357515', '1234567890',
  '8145846869', '3235150525', '2067967654', '2053259755',
] as const;

// Metric row configuration for rendering tables
export type MetricCategory = 'volume' | 'ratio' | 'dollar';

export interface MetricRowConfig {
  key: string;
  label: string;
  format: 'number' | 'percentage' | 'decimal' | 'hours' | 'minutes' | 'currency';
  category: MetricCategory;
  getValue: (metrics: CollectionsMetrics | WelcomeVerificationMetrics) => number;
}

// Collections metric rows - Volume metrics first, then Dollar metrics, then Ratio metrics
export const COLLECTIONS_METRICS: MetricRowConfig[] = [
  // Volume metrics (raw numbers)
  { key: 'accounts', label: '# Accounts', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).accounts },
  { key: 'calls', label: '# Calls', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).calls },
  { key: 'connects', label: '# Connects', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).connects },
  { key: 'rpcs', label: '# RPCs', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).rpcs },
  { key: 'promises', label: '# Promises', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).promises },
  { key: 'cashPayments', label: '# Cash Payments', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).cashPayments },
  { key: 'transfers', label: '# Transfers', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).transfers },
  { key: 'timeOnCallHours', label: 'Time on Call (hours)', format: 'number', category: 'volume', getValue: (m) => (m as CollectionsMetrics).timeOnCallHours },
  // Dollar metrics
  { key: 'dollarPromised', label: '$ Promised', format: 'currency', category: 'dollar', getValue: (m) => (m as CollectionsMetrics).dollarPromised },
  { key: 'dollarCollected', label: '$ Collected', format: 'currency', category: 'dollar', getValue: (m) => (m as CollectionsMetrics).dollarCollected },
  { key: 'avgPaymentAmount', label: 'Avg Payment $', format: 'currency', category: 'dollar', getValue: (m) => (m as CollectionsMetrics).avgPaymentAmount },
  { key: 'dollarPerRpc', label: '$ per RPC', format: 'currency', category: 'dollar', getValue: (m) => (m as CollectionsMetrics).dollarPerRpc },
  // Ratio metrics (percentages and rates)
  { key: 'callsPerAccount', label: 'Calls per account', format: 'decimal', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).callsPerAccount },
  { key: 'connectRate', label: 'Connect %', format: 'percentage', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).connectRate },
  { key: 'rpcRate', label: 'RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).rpcRate },
  { key: 'promisesPerRpc', label: 'Promises / RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).promisesPerRpc },
  { key: 'cashPerRpc', label: 'Cash / RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).cashPerRpc },
  { key: 'cashPerPromises', label: 'Cash / Promises %', format: 'percentage', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).cashPerPromises },
  { key: 'transfersPerRpc', label: 'Transfers / RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).transfersPerRpc },
  { key: 'avgTimePerCallMin', label: 'Avg Time per Call (min)', format: 'decimal', category: 'ratio', getValue: (m) => (m as CollectionsMetrics).avgTimePerCallMin },
];

// Welcome/Verification metric rows - Volume metrics first, then Ratio metrics
export const WELCOME_VERIFICATION_METRICS: MetricRowConfig[] = [
  // Volume metrics (raw numbers)
  { key: 'accounts', label: '# Accounts', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).accounts },
  { key: 'calls', label: '# Calls', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).calls },
  { key: 'connects', label: '# Connects', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).connects },
  { key: 'rpcs', label: '# RPCs', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).rpcs },
  { key: 'eligible', label: '# Eligible', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).eligible },
  { key: 'completed', label: '# Completed', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).completed },
  { key: 'incomplete', label: '# Incomplete', format: 'number', category: 'volume', getValue: (m) => (m as WelcomeVerificationMetrics).incomplete },
  // Ratio metrics (percentages and rates)
  { key: 'callsPerAccount', label: 'Calls per account', format: 'decimal', category: 'ratio', getValue: (m) => (m as WelcomeVerificationMetrics).callsPerAccount },
  { key: 'connectRate', label: 'Connect %', format: 'percentage', category: 'ratio', getValue: (m) => (m as WelcomeVerificationMetrics).connectRate },
  { key: 'rpcRate', label: 'RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as WelcomeVerificationMetrics).rpcRate },
  { key: 'eligiblePerRpc', label: 'Eligible / RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as WelcomeVerificationMetrics).eligiblePerRpc },
  { key: 'completedPerEligible', label: 'Completed / Eligible %', format: 'percentage', category: 'ratio', getValue: (m) => (m as WelcomeVerificationMetrics).completedPerEligible },
  { key: 'completedPerRpc', label: 'Completed / RPC %', format: 'percentage', category: 'ratio', getValue: (m) => (m as WelcomeVerificationMetrics).completedPerRpc },
];

// ============================================
// SCORECARD VIEW TYPES
// ============================================

// Health status for visual indicators
export type HealthStatus = 'good' | 'warning' | 'critical' | 'neutral';

// Scorecard metric with comparison
export interface ScorecardMetric {
  current: number;
  baseline: number;      // 4-week average
  change: number;        // % change
  trend: 'up' | 'down' | 'neutral';
  status: HealthStatus;
}

// Per-client scorecard data
export interface ClientScorecardData {
  client: ClientName;
  displayName: string;
  callVolume: ScorecardMetric;
  connectRate: ScorecardMetric;
  rpcRate: ScorecardMetric;
  promiseRate: ScorecardMetric;
  paymentSuccess: ScorecardMetric;
  dollarCollected: ScorecardMetric;
  overallScore: number;        // 0-100 weighted health
  overallStatus: HealthStatus;
  currentPeriodLabel: string;
  comparisonLabel: string;
}

// Batch response for all clients scorecard
export interface AllClientsScorecardData {
  clients: ClientScorecardData[];
  periodInfo: {
    currentRange: DateRange;
    comparisonDescription: string;
  };
  generatedAt: string;
}

// Sort options for scorecard view
export type ScorecardSortOption = 'alphabetical' | 'worst-first' | 'best-first' | 'volume';
