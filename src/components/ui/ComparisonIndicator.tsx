'use client';

import type { MoMChange, ComparisonType, TrendDirection } from '@/types';
import { getComparisonTypeLabel } from '@/lib/utils';
import { TREND_COLORS } from '@/lib/colors';

interface ComparisonIndicatorProps {
  change: MoMChange;
  comparisonType?: ComparisonType;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  comparisonContext?: string; // e.g., "vs Dec 1-19"
}

export function ComparisonIndicator({
  change,
  comparisonType = 'mom',
  size = 'sm',
  showLabel = false,
  comparisonContext,
}: ComparisonIndicatorProps) {
  const { value, trend } = change;
  const displayValue = Math.abs(Math.round(value));
  const colors = TREND_COLORS[trend];
  const label = getComparisonTypeLabel(comparisonType);

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-1 text-xs',
    lg: 'px-3 py-1.5 text-sm',
  };

  const iconSizes = {
    sm: 'w-2.5 h-2.5',
    md: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  const TrendIcon = ({ trend }: { trend: TrendDirection }) => {
    if (trend === 'up') {
      return (
        <svg className={iconSizes[size]} viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L10 8H2L6 2Z" />
        </svg>
      );
    }
    if (trend === 'down') {
      return (
        <svg className={iconSizes[size]} viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 10L2 4H10L6 10Z" />
        </svg>
      );
    }
    return (
      <svg className={iconSizes[size]} viewBox="0 0 12 12" fill="currentColor">
        <path d="M2 5H10V7H2V5Z" />
      </svg>
    );
  };

  const tooltipText = comparisonContext
    ? `${displayValue}% ${trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'change'} ${comparisonContext}`
    : `${label}: ${displayValue}% ${trend === 'up' ? 'increase' : trend === 'down' ? 'decrease' : 'change'}`;

  return (
    <span
      className={`
        inline-flex items-center gap-0.5 rounded-full font-semibold
        ${colors.bg} ${colors.text} ${colors.border} border
        ${sizeClasses[size]}
      `}
      title={tooltipText}
    >
      <TrendIcon trend={trend} />
      {showLabel && <span className="mr-0.5">{label}:</span>}
      {trend === 'neutral' ? '0' : displayValue}%
    </span>
  );
}

// Also export a simple Badge version for inline use in tables (backward compatible)
export function ComparisonBadge({ change, comparisonType }: { change: MoMChange; comparisonType?: ComparisonType }) {
  const { value, trend } = change;
  const displayValue = Math.abs(Math.round(value));

  const styles = {
    up: { bg: '#dcfce7', color: '#166534', border: '#bbf7d0' },
    down: { bg: '#fee2e2', color: '#991b1b', border: '#fecaca' },
    neutral: { bg: '#f1f5f9', color: '#475569', border: '#e2e8f0' },
  };

  const style = styles[trend];

  const icons = {
    up: '↑',
    down: '↓',
    neutral: '→',
  };

  const label = comparisonType ? getComparisonTypeLabel(comparisonType) : '';

  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '2px',
        padding: '2px 8px',
        fontSize: '11px',
        fontWeight: 600,
        borderRadius: '9999px',
        backgroundColor: style.bg,
        color: style.color,
        border: `1px solid ${style.border}`,
      }}
      title={label ? `${label}: ${displayValue}%` : undefined}
    >
      {icons[trend]} {trend === 'neutral' ? '0' : displayValue}%
    </span>
  );
}
