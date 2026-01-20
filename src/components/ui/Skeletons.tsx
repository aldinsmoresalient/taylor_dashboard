'use client';

/**
 * Skeleton components for loading states
 * Each skeleton matches the layout of its corresponding component
 */

// Base skeleton building blocks
function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded h-4 ${className}`} />;
}

/**
 * Skeleton for QuickStatsBar
 */
export function QuickStatsBarSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm mb-6">
      <div className="flex items-center justify-between px-4 sm:px-5 py-2.5 sm:py-3 border-b border-gray-100">
        <SkeletonText className="w-24 h-4" />
        <SkeletonText className="w-16 h-5 rounded-full" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 py-4 divide-x divide-gray-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-col items-center px-3 sm:px-5 py-2">
            <SkeletonText className="w-16 h-3 mb-2" />
            <SkeletonText className="w-20 h-7 mb-2" />
            <SkeletonText className="w-12 h-5 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for HistoricalTrendsSection
 */
export function HistoricalTrendsSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6 mb-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <SkeletonText className="w-40 h-5 mb-2" />
          <SkeletonText className="w-56 h-4" />
        </div>
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonText key={i} className="w-16 h-8 rounded-lg" />
          ))}
        </div>
      </div>
      <SkeletonBox className="w-full h-80" />
    </div>
  );
}

/**
 * Skeleton for PaymentOutcomesSection
 */
export function PaymentOutcomesSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-4">
        <SkeletonText className="w-36 h-5 mb-2" />
        <SkeletonText className="w-48 h-4" />
      </div>
      <div className="grid grid-cols-3 gap-4 mb-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="p-3 bg-gray-50 rounded-lg">
            <SkeletonText className="w-16 h-3 mb-2" />
            <SkeletonText className="w-20 h-6 mb-1" />
            <SkeletonText className="w-12 h-3" />
          </div>
        ))}
      </div>
      <SkeletonBox className="w-full h-48" />
    </div>
  );
}

/**
 * Skeleton for DelinquencySection
 */
export function DelinquencySkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="mb-4">
        <SkeletonText className="w-40 h-5 mb-2" />
        <SkeletonText className="w-52 h-4" />
      </div>
      <div className="space-y-3 mb-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            <SkeletonText className="w-12 h-4" />
            <SkeletonBox className="flex-1 h-6 rounded-full" />
            <SkeletonText className="w-16 h-4" />
          </div>
        ))}
      </div>
      <SkeletonBox className="w-full h-48" />
    </div>
  );
}

/**
 * Skeleton for data tables (ConsolidatedView/PerClientView)
 */
export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gray-100 px-4 py-3 border-b border-gray-200">
        <SkeletonText className="w-32 h-5" />
      </div>
      {/* Table header */}
      <div className="grid grid-cols-6 gap-4 px-4 py-3 bg-gray-50 border-b border-gray-200">
        {Array.from({ length: 6 }).map((_, i) => (
          <SkeletonText key={i} className="h-4" />
        ))}
      </div>
      {/* Table rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid grid-cols-6 gap-4 px-4 py-3 border-b border-gray-100"
        >
          {Array.from({ length: 6 }).map((_, colIndex) => (
            <SkeletonText key={colIndex} className="h-4" />
          ))}
        </div>
      ))}
    </div>
  );
}

/**
 * Generic card skeleton
 */
export function CardSkeleton({ height = 'h-48' }: { height?: string }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <SkeletonText className="w-32 h-5 mb-4" />
      <SkeletonBox className={`w-full ${height}`} />
    </div>
  );
}
