'use client';

import { ConversionFunnel, ComparisonChart, RateComparisonChart } from './charts';
import type { PeriodKPIs, ComparisonType } from '@/types';

interface ChartsSectionProps {
  currentPeriod: PeriodKPIs;
  previousPeriod: PeriodKPIs;
  currentLabel: string;
  previousLabel: string;
  comparisonType: ComparisonType;
}

export function ChartsSection({
  currentPeriod,
  previousPeriod,
  currentLabel,
  previousLabel,
  comparisonType,
}: ChartsSectionProps) {
  return (
    <div className="mb-6">
      {/* Section header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Performance Overview</h2>
      </div>

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel - Collections */}
        <ConversionFunnel
          metrics={currentPeriod.collections}
          title="Collections Funnel"
        />

        {/* Volume Comparison */}
        <ComparisonChart
          currentPeriod={currentPeriod}
          previousPeriod={previousPeriod}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
          comparisonType={comparisonType}
          title="Volume Comparison"
        />

        {/* Rate Comparison */}
        <RateComparisonChart
          currentPeriod={currentPeriod}
          previousPeriod={previousPeriod}
          currentLabel={currentLabel}
          previousLabel={previousLabel}
          comparisonType={comparisonType}
          title="Rate Comparison"
        />

        {/* Inbound Funnel */}
        <ConversionFunnel
          metrics={currentPeriod.inbound}
          title="Inbound Funnel"
        />
      </div>
    </div>
  );
}

// Loading skeleton for charts
export function ChartsSectionSkeleton() {
  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="h-5 w-40 bg-gray-200 rounded animate-pulse" />
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 h-80"
          >
            <div className="h-5 w-32 bg-gray-200 rounded animate-pulse mb-6" />
            <div className="h-48 bg-gray-100 rounded animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}
