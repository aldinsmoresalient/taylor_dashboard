'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Area,
  AreaChart,
  ComposedChart,
  Bar,
} from 'recharts';
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import { CHART_COLORS, TREND_COLORS } from '@/lib/colors';

interface DataPoint {
  label: string;
  [key: string]: number | string;
}

interface TrendChartProps {
  data: DataPoint[];
  lines: {
    key: string;
    name: string;
    color?: string;
    type?: 'line' | 'area' | 'bar';
  }[];
  title: string;
  subtitle?: string;
  yAxisFormat?: 'number' | 'percentage' | 'currency';
  height?: number;
  showLegend?: boolean;
  showGrid?: boolean;
}

export function TrendChart({
  data,
  lines,
  title,
  subtitle,
  yAxisFormat = 'number',
  height = 300,
  showLegend = true,
  showGrid = true,
}: TrendChartProps) {
  const formatYAxis = (value: number) => {
    if (yAxisFormat === 'percentage') {
      return `${value.toFixed(0)}%`;
    }
    if (yAxisFormat === 'currency') {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  const formatTooltipValue = (value: number) => {
    if (yAxisFormat === 'percentage') {
      return formatPercentage(value);
    }
    if (yAxisFormat === 'currency') {
      return formatCurrency(value);
    }
    return formatNumber(value);
  };

  // Custom tooltip following design spec
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 min-w-[150px]">
          <p className="text-xs font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1">
            {payload.map((entry: any, index: number) => (
              <div key={index} className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{ backgroundColor: entry.color }}
                  />
                  <span className="text-xs text-gray-600">{entry.name}</span>
                </div>
                <span className="text-xs font-semibold text-gray-900">
                  {formatTooltipValue(entry.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      );
    }
    return null;
  };

  const defaultColors = [
    CHART_COLORS.primary,
    CHART_COLORS.secondary,
    CHART_COLORS.tertiary,
    CHART_COLORS.success,
    CHART_COLORS.warning,
  ];

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {subtitle && (
          <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Chart */}
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data} margin={{ top: 5, right: 5, left: -10, bottom: 5 }}>
            {showGrid && (
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={CHART_COLORS.grid}
                vertical={false}
              />
            )}
            <XAxis
              dataKey="label"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              dy={10}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#64748b', fontSize: 11 }}
              tickFormatter={formatYAxis}
              dx={-5}
            />
            <Tooltip content={<CustomTooltip />} />
            {showLegend && (
              <Legend
                verticalAlign="top"
                align="right"
                iconType="circle"
                iconSize={8}
                wrapperStyle={{
                  paddingBottom: '10px',
                  fontSize: '12px',
                }}
              />
            )}
            {lines.map((line, index) => {
              const color = line.color || defaultColors[index % defaultColors.length];

              if (line.type === 'area') {
                return (
                  <Area
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.name}
                    stroke={color}
                    strokeWidth={2}
                    fill={color}
                    fillOpacity={0.1}
                  />
                );
              }

              if (line.type === 'bar') {
                return (
                  <Bar
                    key={line.key}
                    dataKey={line.key}
                    name={line.name}
                    fill={color}
                    fillOpacity={0.8}
                    radius={[4, 4, 0, 0]}
                  />
                );
              }

              return (
                <Line
                  key={line.key}
                  type="monotone"
                  dataKey={line.key}
                  name={line.name}
                  stroke={color}
                  strokeWidth={2}
                  dot={{ fill: color, strokeWidth: 0, r: 3 }}
                  activeDot={{ fill: color, strokeWidth: 2, stroke: '#fff', r: 5 }}
                />
              );
            })}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}

// Simplified trend line for sparklines
interface MiniTrendChartProps {
  data: number[];
  color?: string;
  height?: number;
  showArea?: boolean;
}

export function MiniTrendChart({
  data,
  color = CHART_COLORS.primary,
  height = 40,
  showArea = true,
}: MiniTrendChartProps) {
  const chartData = data.map((value, index) => ({ value, index }));

  return (
    <div style={{ width: '100%', height }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id={`miniGradient-${color.replace('#', '')}`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={color} stopOpacity={showArea ? 0.3 : 0} />
              <stop offset="100%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#miniGradient-${color.replace('#', '')})`}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

// Multi-metric trend card
interface TrendMetricCardProps {
  title: string;
  currentValue: number;
  previousValue: number;
  trendData: number[];
  format?: 'number' | 'percentage' | 'currency';
  color?: string;
}

export function TrendMetricCard({
  title,
  currentValue,
  previousValue,
  trendData,
  format = 'number',
  color = CHART_COLORS.primary,
}: TrendMetricCardProps) {
  const change = previousValue > 0
    ? ((currentValue - previousValue) / previousValue) * 100
    : 0;
  const isPositive = change > 0;
  const isNeutral = Math.abs(change) < 0.5;

  const formattedValue = format === 'percentage'
    ? formatPercentage(currentValue)
    : format === 'currency'
    ? formatCurrency(currentValue)
    : formatNumber(currentValue);

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-3">
        <span className="text-sm font-medium text-gray-500">{title}</span>
        <div
          className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isNeutral
              ? `${TREND_COLORS.neutral.bg} ${TREND_COLORS.neutral.text}`
              : isPositive
              ? `${TREND_COLORS.up.bg} ${TREND_COLORS.up.text}`
              : `${TREND_COLORS.down.bg} ${TREND_COLORS.down.text}`
          }`}
        >
          {isNeutral ? TREND_COLORS.neutral.icon : isPositive ? TREND_COLORS.up.icon : TREND_COLORS.down.icon} {Math.abs(Math.round(change))}%
        </div>
      </div>

      <div className="flex items-end justify-between">
        <p className="text-2xl font-bold text-gray-900 tracking-tight">
          {formattedValue}
        </p>
        <div className="w-24">
          <MiniTrendChart data={trendData} color={color} />
        </div>
      </div>
    </div>
  );
}
