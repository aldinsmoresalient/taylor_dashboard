'use client';

import {
  formatMetricValue,
  calculateMoMChange,
  getComparisonTypeLabel,
} from '@/lib/utils';
import {
  COLLECTIONS_METRICS,
  WELCOME_VERIFICATION_METRICS,
  type ConsolidatedViewData,
  type CollectionsMetrics,
  type WelcomeVerificationMetrics,
  type MetricRowConfig,
  type MoMChange,
  type ComparisonType,
} from '@/types';

interface ConsolidatedViewProps {
  data: ConsolidatedViewData | null;
  isLoading?: boolean;
  comparisonType?: ComparisonType;
}

// Section color configs with actual hex values
const SECTION_STYLES = {
  collections: {
    headerBg: '#047857', // emerald-700
    headerLightBg: '#059669', // emerald-600
    accent: '#10b981', // emerald-500
  },
  inbound: {
    headerBg: '#0369a1', // sky-700
    headerLightBg: '#0284c7', // sky-600
    accent: '#0ea5e9', // sky-500
  },
  welcome: {
    headerBg: '#d97706', // amber-600
    headerLightBg: '#f59e0b', // amber-500
    accent: '#f59e0b', // amber-500
  },
  verification: {
    headerBg: '#6d28d9', // violet-700
    headerLightBg: '#7c3aed', // violet-600
    accent: '#8b5cf6', // violet-500
  },
};

// Comparison Badge component with inline styles
function ComparisonBadge({ change, comparisonType }: { change: MoMChange; comparisonType?: ComparisonType }) {
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

  const label = comparisonType ? getComparisonTypeLabel(comparisonType) : 'MoM';

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
      title={`${label}: ${displayValue}%`}
    >
      {icons[trend]} {trend === 'neutral' ? '0' : displayValue}%
    </span>
  );
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

// Generic metrics table component
interface MetricsTableProps {
  title: string;
  sectionType: 'collections' | 'inbound' | 'welcome' | 'verification';
  currentMetrics: CollectionsMetrics | WelcomeVerificationMetrics;
  previousMetrics: CollectionsMetrics | WelcomeVerificationMetrics;
  currentLabel: string;
  previousLabel: string;
  metricConfig: MetricRowConfig[];
  comparisonType?: ComparisonType;
}

function MetricsTable({
  title,
  sectionType,
  currentMetrics,
  previousMetrics,
  currentLabel,
  previousLabel,
  metricConfig,
  comparisonType = 'mom',
}: MetricsTableProps) {
  const colors = SECTION_STYLES[sectionType];
  const comparisonLabel = getComparisonTypeLabel(comparisonType);

  // Find where volume metrics end and ratio metrics begin
  const volumeMetrics = metricConfig.filter(m => m.category === 'volume');
  const ratioMetrics = metricConfig.filter(m => m.category === 'ratio');

  return (
    <div style={{
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
      border: '1px solid #e5e7eb',
      borderLeft: `4px solid ${colors.accent}`,
      overflow: 'hidden'
    }}>
      <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={{
              backgroundColor: colors.headerBg,
              color: 'white',
              textAlign: 'left',
              padding: '10px 16px',
              fontWeight: 600,
              minWidth: '160px'
            }}>
              {title}
            </th>
            <th style={{
              backgroundColor: colors.headerLightBg,
              color: 'white',
              textAlign: 'center',
              padding: '10px 12px',
              fontWeight: 600,
              minWidth: '85px'
            }}>
              {currentLabel}
            </th>
            <th style={{
              backgroundColor: colors.headerLightBg,
              color: 'white',
              textAlign: 'center',
              padding: '10px 12px',
              fontWeight: 600,
              minWidth: '85px'
            }}>
              {previousLabel}
            </th>
            <th style={{
              backgroundColor: colors.headerLightBg,
              color: 'white',
              textAlign: 'center',
              padding: '10px 12px',
              fontWeight: 600,
              minWidth: '80px'
            }}>
              {comparisonLabel}
            </th>
          </tr>
        </thead>
        <tbody>
          {/* Volume Metrics */}
          {volumeMetrics.map((metric, idx) => {
            const currentValue = metric.getValue(currentMetrics);
            const previousValue = metric.getValue(previousMetrics);
            const momChange = calculateMoMChange(currentValue, previousValue);

            return (
              <tr
                key={metric.key}
                style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}
              >
                <td style={{
                  textAlign: 'left',
                  padding: '8px 16px',
                  fontWeight: 500,
                  color: '#374151',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {metric.label}
                </td>
                <td style={{
                  textAlign: 'right',
                  padding: '8px 12px',
                  fontWeight: 600,
                  color: '#111827',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {formatMetricValue(currentValue, metric.format)}
                </td>
                <td style={{
                  textAlign: 'right',
                  padding: '8px 12px',
                  color: '#6b7280',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {formatMetricValue(previousValue, metric.format)}
                </td>
                <td style={{
                  textAlign: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <ComparisonBadge change={momChange} comparisonType={comparisonType} />
                </td>
              </tr>
            );
          })}

          {/* Separator row */}
          <tr>
            <td colSpan={4} style={{
              backgroundColor: '#f3f4f6',
              padding: '4px 16px',
              fontSize: '10px',
              fontWeight: 600,
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Ratios & Rates
            </td>
          </tr>

          {/* Ratio Metrics */}
          {ratioMetrics.map((metric, idx) => {
            const currentValue = metric.getValue(currentMetrics);
            const previousValue = metric.getValue(previousMetrics);
            const momChange = calculateMoMChange(currentValue, previousValue);

            return (
              <tr
                key={metric.key}
                style={{ backgroundColor: idx % 2 === 0 ? 'white' : '#f9fafb' }}
              >
                <td style={{
                  textAlign: 'left',
                  padding: '8px 16px',
                  fontWeight: 500,
                  color: '#374151',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {metric.label}
                </td>
                <td style={{
                  textAlign: 'right',
                  padding: '8px 12px',
                  fontWeight: 600,
                  color: '#111827',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {formatMetricValue(currentValue, metric.format)}
                </td>
                <td style={{
                  textAlign: 'right',
                  padding: '8px 12px',
                  color: '#6b7280',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  {formatMetricValue(previousValue, metric.format)}
                </td>
                <td style={{
                  textAlign: 'center',
                  padding: '8px 12px',
                  borderBottom: '1px solid #f3f4f6'
                }}>
                  <ComparisonBadge change={momChange} comparisonType={comparisonType} />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export function ConsolidatedView({ data, isLoading, comparisonType = 'mom' }: ConsolidatedViewProps) {
  if (isLoading) {
    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '24px' }}>
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

  const { currentPeriod, previousPeriod, currentPeriodLabel, previousPeriodLabel } = data;

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(480px, 1fr))', gap: '24px' }}>
      {/* Collections */}
      <MetricsTable
        title="Collections"
        sectionType="collections"
        currentMetrics={currentPeriod.collections}
        previousMetrics={previousPeriod.collections}
        currentLabel={currentPeriodLabel}
        previousLabel={previousPeriodLabel}
        metricConfig={COLLECTIONS_METRICS}
        comparisonType={comparisonType}
      />

      {/* Inbound */}
      <MetricsTable
        title="Inbound"
        sectionType="inbound"
        currentMetrics={currentPeriod.inbound}
        previousMetrics={previousPeriod.inbound}
        currentLabel={currentPeriodLabel}
        previousLabel={previousPeriodLabel}
        metricConfig={COLLECTIONS_METRICS}
        comparisonType={comparisonType}
      />

      {/* Welcome */}
      <MetricsTable
        title="Welcome"
        sectionType="welcome"
        currentMetrics={currentPeriod.welcome}
        previousMetrics={previousPeriod.welcome}
        currentLabel={currentPeriodLabel}
        previousLabel={previousPeriodLabel}
        metricConfig={WELCOME_VERIFICATION_METRICS}
        comparisonType={comparisonType}
      />

      {/* Verification */}
      <MetricsTable
        title="Verification"
        sectionType="verification"
        currentMetrics={currentPeriod.verification}
        previousMetrics={previousPeriod.verification}
        currentLabel={currentPeriodLabel}
        previousLabel={previousPeriodLabel}
        metricConfig={WELCOME_VERIFICATION_METRICS}
        comparisonType={comparisonType}
      />
    </div>
  );
}
