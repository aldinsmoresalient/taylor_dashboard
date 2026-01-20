'use client';

import { ScoreBadge, HealthDot } from './HealthIndicator';
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import type { ClientScorecardData, ScorecardMetric, HealthStatus } from '@/types';

interface ClientCardProps {
  data: ClientScorecardData;
  onClick?: () => void;
  className?: string;
}

// Header border color based on overall status
const HEADER_COLORS: Record<HealthStatus, string> = {
  good: 'border-l-emerald-500',
  warning: 'border-l-amber-500',
  critical: 'border-l-rose-500',
  neutral: 'border-l-gray-400',
};

const HEADER_BG: Record<HealthStatus, string> = {
  good: 'bg-emerald-50',
  warning: 'bg-amber-50',
  critical: 'bg-rose-50',
  neutral: 'bg-gray-50',
};

interface MetricRowProps {
  label: string;
  metric: ScorecardMetric;
  formatFn: (val: number) => string;
}

function MetricRow({ label, metric, formatFn }: MetricRowProps) {
  const trendArrow = metric.trend === 'up' ? '\u2191' : metric.trend === 'down' ? '\u2193' : '\u2192';

  const changeColor =
    metric.status === 'good'
      ? 'text-emerald-600'
      : metric.status === 'warning'
        ? 'text-amber-600'
        : metric.status === 'critical'
          ? 'text-rose-600'
          : 'text-gray-500';

  return (
    <div className="flex items-center justify-between py-1.5">
      <div className="flex items-center gap-2">
        <HealthDot status={metric.status} size="sm" />
        <span className="text-xs text-gray-600">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-medium text-gray-900">{formatFn(metric.current)}</span>
        <span className={`text-xs font-medium ${changeColor} w-14 text-right`}>
          {trendArrow} {metric.change > 0 ? '+' : ''}{Math.round(metric.change)}%
        </span>
      </div>
    </div>
  );
}

export function ClientCard({ data, onClick, className = '' }: ClientCardProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden
        transition-all duration-200 hover:shadow-md hover:border-gray-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      {/* Header */}
      <div
        className={`
          flex items-center justify-between px-4 py-3
          border-l-4 ${HEADER_COLORS[data.overallStatus]} ${HEADER_BG[data.overallStatus]}
        `}
      >
        <h3 className="text-sm font-semibold text-gray-900">{data.displayName}</h3>
        <ScoreBadge score={data.overallScore} status={data.overallStatus} size="sm" />
      </div>

      {/* Metrics */}
      <div className="px-4 py-2 divide-y divide-gray-100">
        <MetricRow
          label="Calls"
          metric={data.callVolume}
          formatFn={(v) => formatNumber(v)}
        />
        <MetricRow
          label="Connect %"
          metric={data.connectRate}
          formatFn={(v) => formatPercentage(v)}
        />
        <MetricRow
          label="RPC %"
          metric={data.rpcRate}
          formatFn={(v) => formatPercentage(v)}
        />
        <MetricRow
          label="Promise %"
          metric={data.promiseRate}
          formatFn={(v) => formatPercentage(v)}
        />
        <MetricRow
          label="Payment %"
          metric={data.paymentSuccess}
          formatFn={(v) => formatPercentage(v)}
        />
        <MetricRow
          label="$ Collected"
          metric={data.dollarCollected}
          formatFn={(v) => formatCurrency(v)}
        />
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <p className="text-[10px] text-gray-500">
          {data.currentPeriodLabel} {data.comparisonLabel}
        </p>
      </div>
    </div>
  );
}

// Compact variant for dense grids
interface ClientCardCompactProps {
  data: ClientScorecardData;
  onClick?: () => void;
  className?: string;
}

export function ClientCardCompact({ data, onClick, className = '' }: ClientCardCompactProps) {
  return (
    <div
      onClick={onClick}
      className={`
        bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden
        transition-all duration-150 hover:shadow-md hover:border-gray-300
        ${onClick ? 'cursor-pointer' : ''}
        ${className}
      `}
    >
      <div
        className={`
          flex items-center justify-between px-3 py-2
          border-l-4 ${HEADER_COLORS[data.overallStatus]}
        `}
      >
        <div className="flex items-center gap-2">
          <HealthDot status={data.overallStatus} size="md" />
          <span className="text-xs font-medium text-gray-900">{data.displayName}</span>
        </div>
        <span className={`text-xs font-bold ${
          data.overallStatus === 'good' ? 'text-emerald-600' :
          data.overallStatus === 'warning' ? 'text-amber-600' :
          data.overallStatus === 'critical' ? 'text-rose-600' : 'text-gray-600'
        }`}>
          {data.overallScore}
        </span>
      </div>
    </div>
  );
}
