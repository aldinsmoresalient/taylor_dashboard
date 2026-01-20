'use client';

import { CollectionsTable, WelcomeVerificationTable } from '@/components/PerClientTable';
import type { PerClientViewData, ComparisonType } from '@/types';

interface PerClientViewProps {
  data: PerClientViewData | null;
  isLoading?: boolean;
  comparisonType?: ComparisonType;
}

// Loading skeleton
function TableSkeleton() {
  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      overflow: 'hidden'
    }}>
      <div style={{ height: '44px', backgroundColor: '#e5e7eb' }} className="animate-pulse" />
      <div style={{ padding: '12px' }}>
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} style={{ height: '28px', backgroundColor: '#f3f4f6', marginBottom: '8px', borderRadius: '4px' }} className="animate-pulse" />
        ))}
      </div>
    </div>
  );
}

export function PerClientView({ data, isLoading, comparisonType = 'mom' }: PerClientViewProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
        <TableSkeleton />
        <TableSkeleton />
        <TableSkeleton />
        <TableSkeleton />
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '256px', color: '#6b7280' }}>
        No data available
      </div>
    );
  }

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
      {/* Collections - Top Left */}
      <CollectionsTable
        title="Collections"
        currentMetrics={data.currentPeriod.collections}
        previousMetrics={data.previousPeriod?.collections || null}
        currentPeriodLabel={data.currentPeriodLabel}
        previousPeriodLabel={data.previousPeriodLabel}
        comparisonType={comparisonType}
      />

      {/* Inbound - Top Right */}
      <CollectionsTable
        title="Inbound"
        currentMetrics={data.currentPeriod.inbound}
        previousMetrics={data.previousPeriod?.inbound || null}
        currentPeriodLabel={data.currentPeriodLabel}
        previousPeriodLabel={data.previousPeriodLabel}
        comparisonType={comparisonType}
      />

      {/* Welcome - Bottom Left */}
      <WelcomeVerificationTable
        title="Welcome"
        currentMetrics={data.currentPeriod.welcome}
        previousMetrics={data.previousPeriod?.welcome || null}
        currentPeriodLabel={data.currentPeriodLabel}
        previousPeriodLabel={data.previousPeriodLabel}
        comparisonType={comparisonType}
      />

      {/* Verification - Bottom Right */}
      <WelcomeVerificationTable
        title="Verification"
        currentMetrics={data.currentPeriod.verification}
        previousMetrics={data.previousPeriod?.verification || null}
        currentPeriodLabel={data.currentPeriodLabel}
        previousPeriodLabel={data.previousPeriodLabel}
        comparisonType={comparisonType}
      />
    </div>
  );
}
