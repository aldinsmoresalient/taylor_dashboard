'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { formatNumber, formatPercentage, formatCurrency, calculateMoMChange } from '@/lib/utils';
import { TREND_COLORS } from '@/lib/colors';
import type { PeriodKPIs, ComparisonType, TrendDirection } from '@/types';
import type { MonthlyTrendPoint } from '@/hooks/useKPIData';

interface QuickStatProps {
  label: string;
  value: number;
  previousValue: number;
  format: 'number' | 'percentage' | 'currency';
  comparisonLabel: string;
  accentColor: string;
  sparklineData?: number[];
}

function QuickStat({ label, value, previousValue, format, comparisonLabel, accentColor, sparklineData }: QuickStatProps) {
  const change = calculateMoMChange(value, previousValue);
  const formattedValue = format === 'percentage'
    ? formatPercentage(value)
    : format === 'currency'
    ? formatCurrency(value)
    : formatNumber(value);
  const trendStyle = TREND_COLORS[change.trend];

  // Only use real sparkline data - no fake/interpolated data
  const sparkData = sparklineData && sparklineData.length > 0
    ? sparklineData.slice(-6).map((v) => ({ value: v }))
    : null;

  return (
    <div className="flex flex-col items-center px-3 sm:px-5 py-3 group">
      <span className="text-[10px] sm:text-xs font-medium text-gray-500 mb-1 sm:mb-1.5 text-center">{label}</span>
      <div className="flex items-center gap-1.5 sm:gap-2">
        <span className="text-lg sm:text-2xl font-bold text-gray-900 tracking-tight">{formattedValue}</span>
        {/* Mini sparkline - only shown when real data is available */}
        {sparkData && (
          <div className="hidden sm:block w-10 sm:w-12 h-5 sm:h-6 opacity-60 group-hover:opacity-100 transition-opacity">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sparkData}>
                <defs>
                  <linearGradient id={`mini-gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={change.trend === 'down' ? '#f43f5e' : accentColor} stopOpacity={0.4} />
                    <stop offset="100%" stopColor={change.trend === 'down' ? '#f43f5e' : accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={change.trend === 'down' ? '#f43f5e' : accentColor}
                  strokeWidth={1.5}
                  fill={`url(#mini-gradient-${label.replace(/\s/g, '')})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
      <span
        className={`text-[10px] sm:text-xs font-semibold ${trendStyle.text} ${trendStyle.bg} ${trendStyle.border} border px-1.5 sm:px-2 py-0.5 rounded-full mt-1 sm:mt-1.5 flex items-center gap-0.5`}
        title={comparisonLabel}
      >
        {trendStyle.icon} {Math.abs(Math.round(change.value))}%
      </span>
    </div>
  );
}

interface QuickStatsBarProps {
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  comparisonType: ComparisonType;
  comparisonLabel: string;
  historicalData?: MonthlyTrendPoint[];
}

// Accent colors following design spec
const STAT_COLORS = {
  calls: '#6366f1',      // indigo
  connect: '#8b5cf6',    // violet
  rpc: '#a855f7',        // purple
  promises: '#ec4899',   // pink
  cash: '#10b981',       // emerald
  dollarCollected: '#059669',  // darker emerald
  dollarPromised: '#0d9488',   // teal
};

export function QuickStatsBar({
  currentPeriod,
  previousPeriod,
  comparisonType,
  comparisonLabel,
  historicalData,
}: QuickStatsBarProps) {
  // Extract sparkline data from historical trends
  const getSparklineData = (extractor: (m: MonthlyTrendPoint) => number): number[] | undefined => {
    if (!historicalData || historicalData.length === 0) return undefined;
    return historicalData.map(extractor);
  };

  // Key metrics to display
  const stats = [
    {
      label: 'Total Calls',
      value: currentPeriod.collections.calls + currentPeriod.inbound.calls,
      previousValue: previousPeriod.collections.calls + previousPeriod.inbound.calls,
      format: 'number' as const,
      accentColor: STAT_COLORS.calls,
      sparklineData: getSparklineData((m) => m.collections.calls + m.inbound.calls),
    },
    {
      label: 'Connect Rate',
      value: currentPeriod.collections.connectRate,
      previousValue: previousPeriod.collections.connectRate,
      format: 'percentage' as const,
      accentColor: STAT_COLORS.connect,
      sparklineData: getSparklineData((m) => m.collections.connectRate),
    },
    {
      label: 'RPC Rate',
      value: currentPeriod.collections.rpcRate,
      previousValue: previousPeriod.collections.rpcRate,
      format: 'percentage' as const,
      accentColor: STAT_COLORS.rpc,
      sparklineData: getSparklineData((m) => m.collections.rpcRate),
    },
    {
      label: 'Promises',
      value: currentPeriod.collections.promises + currentPeriod.inbound.promises,
      previousValue: previousPeriod.collections.promises + previousPeriod.inbound.promises,
      format: 'number' as const,
      accentColor: STAT_COLORS.promises,
      sparklineData: getSparklineData((m) => m.collections.promises + m.inbound.promises),
    },
    {
      label: '$ Collected',
      value: currentPeriod.collections.dollarCollected + currentPeriod.inbound.dollarCollected,
      previousValue: previousPeriod.collections.dollarCollected + previousPeriod.inbound.dollarCollected,
      format: 'currency' as const,
      accentColor: STAT_COLORS.dollarCollected,
      sparklineData: getSparklineData((m) => m.collections.dollarCollected + m.inbound.dollarCollected),
    },
    {
      label: '$ Promised',
      value: currentPeriod.collections.dollarPromised + currentPeriod.inbound.dollarPromised,
      previousValue: previousPeriod.collections.dollarPromised + previousPeriod.inbound.dollarPromised,
      format: 'currency' as const,
      accentColor: STAT_COLORS.dollarPromised,
      sparklineData: getSparklineData((m) => m.collections.dollarPromised + m.inbound.dollarPromised),
    },
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100">
        <h3 className="text-xs sm:text-sm font-semibold text-gray-800">Key Metrics</h3>
        <span className="text-[10px] sm:text-xs text-gray-500 bg-gray-50 px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full">{comparisonLabel}</span>
      </div>
      {/* Responsive grid: 2 cols on mobile, 3 on sm, 6 on lg */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 py-2 divide-x divide-gray-100">
        {stats.map((stat) => (
          <QuickStat
            key={stat.label}
            label={stat.label}
            value={stat.value}
            previousValue={stat.previousValue}
            format={stat.format}
            comparisonLabel={comparisonLabel}
            accentColor={stat.accentColor}
            sparklineData={stat.sparklineData}
          />
        ))}
      </div>
    </div>
  );
}
