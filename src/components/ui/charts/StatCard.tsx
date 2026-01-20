'use client';

import { Area, AreaChart, ResponsiveContainer } from 'recharts';
import { formatNumber, formatPercentage, calculateMoMChange } from '@/lib/utils';
import { TREND_COLORS } from '@/lib/colors';
import type { ComparisonType } from '@/types';

interface StatCardProps {
  label: string;
  value: number;
  previousValue: number;
  format?: 'number' | 'percentage' | 'decimal';
  icon?: React.ReactNode;
  accentColor?: string;
  sparklineData?: number[];
  comparisonType?: ComparisonType;
  className?: string;
}

export function StatCard({
  label,
  value,
  previousValue,
  format = 'number',
  icon,
  accentColor = '#3b82f6',
  sparklineData,
  comparisonType = 'mom',
  className = '',
}: StatCardProps) {
  const change = calculateMoMChange(value, previousValue);
  const trendStyle = TREND_COLORS[change.trend];

  const formattedValue = format === 'percentage'
    ? formatPercentage(value)
    : format === 'decimal'
    ? value.toFixed(1)
    : formatNumber(value);

  // Only create chart data if sparkline data is provided (no fake data)
  const chartData = sparklineData && sparklineData.length > 0
    ? sparklineData.map((v) => ({ value: v }))
    : null;

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow ${className}`}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-2">
          {icon && (
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center"
              style={{ backgroundColor: `${accentColor}15` }}
            >
              <div style={{ color: accentColor }}>{icon}</div>
            </div>
          )}
          <span className="text-sm font-medium text-gray-500">{label}</span>
        </div>
      </div>

      <div className="flex items-end justify-between">
        <div>
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            {formattedValue}
          </p>
          <div className="flex items-center gap-2 mt-2">
            <span
              className={`inline-flex items-center gap-0.5 px-2 py-0.5 rounded-full text-xs font-semibold ${trendStyle.bg} ${trendStyle.text}`}
            >
              {trendStyle.icon} {Math.abs(Math.round(change.value))}%
            </span>
            <span className="text-xs text-gray-400">vs previous</span>
          </div>
        </div>

        {/* Sparkline - only shown when real data is provided */}
        {chartData && (
          <div className="w-24 h-12">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id={`gradient-${label.replace(/\s/g, '')}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={change.trend === 'down' ? '#f43f5e' : accentColor} stopOpacity={0.3} />
                    <stop offset="100%" stopColor={change.trend === 'down' ? '#f43f5e' : accentColor} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area
                  type="monotone"
                  dataKey="value"
                  stroke={change.trend === 'down' ? '#f43f5e' : accentColor}
                  strokeWidth={2}
                  fill={`url(#gradient-${label.replace(/\s/g, '')})`}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}

// Compact version for grids
interface CompactStatCardProps {
  label: string;
  value: number;
  previousValue: number;
  format?: 'number' | 'percentage' | 'decimal';
  accentColor?: string;
  className?: string;
}

export function CompactStatCard({
  label,
  value,
  previousValue,
  format = 'number',
  accentColor = '#3b82f6',
  className = '',
}: CompactStatCardProps) {
  const change = calculateMoMChange(value, previousValue);
  const trendStyle = TREND_COLORS[change.trend];

  const formattedValue = format === 'percentage'
    ? formatPercentage(value)
    : format === 'decimal'
    ? value.toFixed(1)
    : formatNumber(value);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 ${className}`}
      style={{ borderLeftWidth: '3px', borderLeftColor: accentColor }}
    >
      <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
      <div className="flex items-baseline justify-between">
        <p className="text-xl font-bold text-gray-900">{formattedValue}</p>
        <span
          className={`text-xs font-semibold ${trendStyle.text}`}
        >
          {trendStyle.icon} {Math.abs(Math.round(change.value))}%
        </span>
      </div>
    </div>
  );
}
