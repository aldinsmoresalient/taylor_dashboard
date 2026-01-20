'use client';

import { formatMetricValue, calculateMoMChange } from '@/lib/utils';
import { ComparisonIndicator } from './ComparisonIndicator';
import type { ComparisonType } from '@/types';

interface MetricCardProps {
  label: string;
  value: number;
  previousValue: number;
  format: 'number' | 'percentage' | 'decimal' | 'hours' | 'minutes';
  comparisonType?: ComparisonType;
  comparisonContext?: string;
  accentColor?: string;
  className?: string;
}

export function MetricCard({
  label,
  value,
  previousValue,
  format,
  comparisonType = 'mom',
  comparisonContext,
  accentColor = '#4a7c59',
  className = '',
}: MetricCardProps) {
  const change = calculateMoMChange(value, previousValue);
  const formattedValue = formatMetricValue(value, format);
  const formattedPrevious = formatMetricValue(previousValue, format);

  return (
    <div
      className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm ${className}`}
      style={{ borderLeftWidth: '4px', borderLeftColor: accentColor }}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 mb-1">{label}</p>
          <p className="text-2xl font-bold text-gray-900">{formattedValue}</p>
          <p className="text-xs text-gray-400 mt-1">
            was {formattedPrevious}
          </p>
        </div>
        <ComparisonIndicator
          change={change}
          comparisonType={comparisonType}
          size="md"
          comparisonContext={comparisonContext}
        />
      </div>
    </div>
  );
}

// A compact version for use in grids
interface CompactMetricCardProps {
  label: string;
  value: number;
  previousValue: number;
  format: 'number' | 'percentage' | 'decimal';
  comparisonType?: ComparisonType;
}

export function CompactMetricCard({
  label,
  value,
  previousValue,
  format,
  comparisonType = 'mom',
}: CompactMetricCardProps) {
  const change = calculateMoMChange(value, previousValue);
  const formattedValue = formatMetricValue(value, format);

  return (
    <div className="bg-white rounded border border-gray-200 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="min-w-0">
          <p className="text-[10px] font-medium text-gray-500 truncate">{label}</p>
          <p className="text-sm font-bold text-gray-900">{formattedValue}</p>
        </div>
        <ComparisonIndicator
          change={change}
          comparisonType={comparisonType}
          size="sm"
        />
      </div>
    </div>
  );
}
