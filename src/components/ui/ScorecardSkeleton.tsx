'use client';

function SkeletonBox({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded ${className}`} />;
}

function SkeletonText({ className = '' }: { className?: string }) {
  return <div className={`animate-pulse bg-gray-200 rounded h-4 ${className}`} />;
}

// Single card skeleton
function ClientCardSkeleton() {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-l-4 border-l-gray-300">
        <SkeletonText className="w-20 h-4" />
        <SkeletonBox className="w-8 h-8 rounded-lg" />
      </div>

      {/* Metrics */}
      <div className="px-4 py-2 space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center justify-between py-1.5">
            <div className="flex items-center gap-2">
              <SkeletonBox className="w-2 h-2 rounded-full" />
              <SkeletonText className="w-16 h-3" />
            </div>
            <div className="flex items-center gap-2">
              <SkeletonText className="w-12 h-3" />
              <SkeletonText className="w-10 h-3" />
            </div>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 bg-gray-50 border-t border-gray-100">
        <SkeletonText className="w-32 h-3" />
      </div>
    </div>
  );
}

// Full scorecard view skeleton
export function ScorecardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header with sort controls */}
      <div className="flex items-center justify-between">
        <div>
          <SkeletonText className="w-40 h-6 mb-2" />
          <SkeletonText className="w-56 h-4" />
        </div>
        <div className="flex items-center gap-3">
          <SkeletonText className="w-24 h-4" />
          <SkeletonBox className="w-32 h-9 rounded-lg" />
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {Array.from({ length: 12 }).map((_, i) => (
          <ClientCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}

export { ClientCardSkeleton };
