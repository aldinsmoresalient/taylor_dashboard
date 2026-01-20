'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from 'recharts';
import { formatNumber, formatPercentage, getComparisonTypeLabel } from '@/lib/utils';
import type { PeriodKPIs, ComparisonType } from '@/types';

interface ComparisonChartProps {
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  currentLabel: string;
  previousLabel: string;
  comparisonType: ComparisonType;
  title?: string;
  className?: string;
}

const COLORS = {
  current: '#3b82f6',   // blue-500
  previous: '#94a3b8',  // slate-400
};

export function ComparisonChart({
  currentPeriod,
  previousPeriod,
  currentLabel,
  previousLabel,
  comparisonType,
  title = 'Period Comparison',
  className = '',
}: ComparisonChartProps) {
  const data = [
    {
      name: 'Calls',
      current: currentPeriod.collections.calls + currentPeriod.inbound.calls,
      previous: previousPeriod.collections.calls + previousPeriod.inbound.calls,
    },
    {
      name: 'Connects',
      current: currentPeriod.collections.connects + currentPeriod.inbound.connects,
      previous: previousPeriod.collections.connects + previousPeriod.inbound.connects,
    },
    {
      name: 'RPCs',
      current: currentPeriod.collections.rpcs + currentPeriod.inbound.rpcs,
      previous: previousPeriod.collections.rpcs + previousPeriod.inbound.rpcs,
    },
    {
      name: 'Promises',
      current: currentPeriod.collections.promises + currentPeriod.inbound.promises,
      previous: previousPeriod.collections.promises + previousPeriod.inbound.promises,
    },
    {
      name: 'Cash',
      current: currentPeriod.collections.cashPayments + currentPeriod.inbound.cashPayments,
      previous: previousPeriod.collections.cashPayments + previousPeriod.inbound.cashPayments,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const current = payload.find(p => p.dataKey === 'current')?.value || 0;
      const previous = payload.find(p => p.dataKey === 'previous')?.value || 0;
      const change = previous > 0 ? ((current - previous) / previous) * 100 : 0;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.current }} />
              <span className="text-gray-600">{currentLabel}:</span>
              <span className="font-medium text-gray-900">{formatNumber(current)}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.previous }} />
              <span className="text-gray-600">{previousLabel}:</span>
              <span className="font-medium text-gray-900">{formatNumber(previous)}</span>
            </p>
            <p className="pt-1 border-t border-gray-100 mt-1">
              <span className="text-gray-600">Change:</span>
              <span className={`font-medium ml-1 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.current }} />
            <span className="text-gray-600">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.previous }} />
            <span className="text-gray-600">{previousLabel}</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(value) => formatNumber(value)}
              width={50}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar
              dataKey="current"
              fill={COLORS.current}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="previous"
              fill={COLORS.previous}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Rate comparison chart for percentages
interface RateComparisonChartProps {
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  currentLabel: string;
  previousLabel: string;
  comparisonType: ComparisonType;
  title?: string;
  className?: string;
}

export function RateComparisonChart({
  currentPeriod,
  previousPeriod,
  currentLabel,
  previousLabel,
  comparisonType,
  title = 'Rate Comparison',
  className = '',
}: RateComparisonChartProps) {
  const data = [
    {
      name: 'Connect %',
      current: currentPeriod.collections.connectRate,
      previous: previousPeriod.collections.connectRate,
    },
    {
      name: 'RPC %',
      current: currentPeriod.collections.rpcRate,
      previous: previousPeriod.collections.rpcRate,
    },
    {
      name: 'Promise %',
      current: currentPeriod.collections.promisesPerRpc,
      previous: previousPeriod.collections.promisesPerRpc,
    },
    {
      name: 'Cash/Promise %',
      current: currentPeriod.collections.cashPerPromises,
      previous: previousPeriod.collections.cashPerPromises,
    },
  ];

  const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; dataKey: string }>; label?: string }) => {
    if (active && payload && payload.length) {
      const current = payload.find(p => p.dataKey === 'current')?.value || 0;
      const previous = payload.find(p => p.dataKey === 'previous')?.value || 0;
      const change = current - previous;

      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <p className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.current }} />
              <span className="text-gray-600">{currentLabel}:</span>
              <span className="font-medium text-gray-900">{formatPercentage(current)}</span>
            </p>
            <p className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.previous }} />
              <span className="text-gray-600">{previousLabel}:</span>
              <span className="font-medium text-gray-900">{formatPercentage(previous)}</span>
            </p>
            <p className="pt-1 border-t border-gray-100 mt-1">
              <span className="text-gray-600">Change:</span>
              <span className={`font-medium ml-1 ${change >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                {change >= 0 ? '+' : ''}{change.toFixed(1)}pp
              </span>
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.current }} />
            <span className="text-gray-600">{currentLabel}</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS.previous }} />
            <span className="text-gray-600">{previousLabel}</span>
          </div>
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            margin={{ top: 0, right: 0, left: 0, bottom: 0 }}
          >
            <XAxis
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 11, fill: '#9ca3af' }}
              tickFormatter={(value) => `${value}%`}
              width={45}
              domain={[0, 'auto']}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar
              dataKey="current"
              fill={COLORS.current}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
            <Bar
              dataKey="previous"
              fill={COLORS.previous}
              radius={[4, 4, 0, 0]}
              maxBarSize={40}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
