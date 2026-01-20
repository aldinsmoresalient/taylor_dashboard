import { Suspense } from 'react';
import { Dashboard } from '@/components/Dashboard';

// Loading fallback for the dashboard while URL params are being read
function DashboardSkeleton() {
  return (
    <div className="flex min-h-screen bg-gray-50">
      <div className="w-64 bg-white border-r border-gray-200" />
      <div className="flex-1 flex flex-col">
        <div className="h-16 bg-white border-b border-gray-200" />
        <div className="flex-1 p-6">
          <div className="animate-pulse space-y-4">
            <div className="h-24 bg-gray-200 rounded-xl" />
            <div className="h-64 bg-gray-200 rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <Dashboard />
    </Suspense>
  );
}
