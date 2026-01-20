'use client';

import type { HealthStatus } from '@/types';

interface HealthIndicatorProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
  className?: string;
}

const STATUS_COLORS: Record<HealthStatus, { bg: string; text: string; border: string }> = {
  good: { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200' },
  warning: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  critical: { bg: 'bg-rose-50', text: 'text-rose-700', border: 'border-rose-200' },
  neutral: { bg: 'bg-gray-50', text: 'text-gray-600', border: 'border-gray-200' },
};

const STATUS_LABELS: Record<HealthStatus, string> = {
  good: 'Good',
  warning: 'Warning',
  critical: 'Critical',
  neutral: 'Neutral',
};

const SIZE_CLASSES = {
  sm: 'px-1.5 py-0.5 text-[10px]',
  md: 'px-2 py-1 text-xs',
  lg: 'px-3 py-1.5 text-sm',
};

export function HealthIndicator({
  status,
  size = 'md',
  showLabel = true,
  className = '',
}: HealthIndicatorProps) {
  const colors = STATUS_COLORS[status];

  return (
    <span
      className={`
        inline-flex items-center rounded-full font-medium border
        ${colors.bg} ${colors.text} ${colors.border}
        ${SIZE_CLASSES[size]}
        ${className}
      `}
    >
      {showLabel && STATUS_LABELS[status]}
    </span>
  );
}

// A simple dot version for compact displays
interface HealthDotProps {
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const DOT_SIZES = {
  sm: 'w-1.5 h-1.5',
  md: 'w-2 h-2',
  lg: 'w-3 h-3',
};

const DOT_COLORS: Record<HealthStatus, string> = {
  good: 'bg-emerald-500',
  warning: 'bg-amber-500',
  critical: 'bg-rose-500',
  neutral: 'bg-gray-400',
};

export function HealthDot({ status, size = 'md', className = '' }: HealthDotProps) {
  return (
    <span
      className={`
        inline-block rounded-full
        ${DOT_COLORS[status]}
        ${DOT_SIZES[size]}
        ${className}
      `}
    />
  );
}

// Score badge that shows the overall score with color
interface ScoreBadgeProps {
  score: number;
  status: HealthStatus;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const SCORE_SIZES = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-12 h-12 text-base',
};

const SCORE_BG_COLORS: Record<HealthStatus, string> = {
  good: 'bg-emerald-100 text-emerald-800',
  warning: 'bg-amber-100 text-amber-800',
  critical: 'bg-rose-100 text-rose-800',
  neutral: 'bg-gray-100 text-gray-700',
};

export function ScoreBadge({ score, status, size = 'md', className = '' }: ScoreBadgeProps) {
  return (
    <div
      className={`
        flex items-center justify-center rounded-lg font-bold
        ${SCORE_BG_COLORS[status]}
        ${SCORE_SIZES[size]}
        ${className}
      `}
    >
      {score}
    </div>
  );
}
