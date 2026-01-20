'use client';

import {
  formatMetricValue,
  calculateMoMChange,
  getComparisonTypeLabel,
  exportTableToCSV,
} from '@/lib/utils';
import {
  COLLECTIONS_METRICS,
  WELCOME_VERIFICATION_METRICS,
  type CollectionsMetrics,
  type WelcomeVerificationMetrics,
  type MetricRowConfig,
  type MoMChange,
  type ComparisonType,
} from '@/types';

type SectionType = 'collections' | 'inbound' | 'welcome' | 'verification';

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

interface PerClientTableProps {
  title: string;
  sectionType: SectionType;
  currentMetrics: CollectionsMetrics | WelcomeVerificationMetrics;
  previousMetrics: CollectionsMetrics | WelcomeVerificationMetrics | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
  metricConfig: MetricRowConfig[];
  comparisonType?: ComparisonType;
}

export function PerClientTable({
  title,
  sectionType,
  currentMetrics,
  previousMetrics,
  currentPeriodLabel,
  previousPeriodLabel,
  metricConfig,
  comparisonType = 'mom',
}: PerClientTableProps) {
  const colors = SECTION_STYLES[sectionType];
  const comparisonLabel = getComparisonTypeLabel(comparisonType);

  // Separate volume and ratio metrics
  const volumeMetrics = metricConfig.filter(m => m.category === 'volume');
  const ratioMetrics = metricConfig.filter(m => m.category === 'ratio');

  const handleExport = () => {
    const rows = metricConfig.map((metric) => {
      const currentValue = metric.getValue(currentMetrics);
      const previousValue = previousMetrics ? metric.getValue(previousMetrics) : null;
      const momChange = previousValue !== null
        ? calculateMoMChange(currentValue, previousValue)
        : { value: 0, trend: 'neutral' as const };

      return {
        metric: metric.label,
        current: formatMetricValue(currentValue, metric.format),
        previous: previousValue !== null ? formatMetricValue(previousValue, metric.format) : '-',
        change: `${momChange.trend === 'up' ? '+' : momChange.trend === 'down' ? '-' : ''}${Math.abs(Math.round(momChange.value))}%`,
      };
    });

    const columns = [
      { key: 'metric' as const, header: 'Metric' },
      { key: 'current' as const, header: currentPeriodLabel },
      { key: 'previous' as const, header: previousPeriodLabel || 'Previous' },
      { key: 'change' as const, header: comparisonLabel },
    ];

    const filename = `${title.toLowerCase()}_metrics_${new Date().toISOString().split('T')[0]}.csv`;
    exportTableToCSV(rows, columns, filename);
  };

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
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span>{title}</span>
                <button
                  onClick={handleExport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '4px',
                    padding: '4px 8px',
                    fontSize: '10px',
                    fontWeight: 500,
                    color: 'rgba(255,255,255,0.8)',
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                  }}
                  title={`Export ${title} to CSV`}
                >
                  <svg width="12" height="12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export
                </button>
              </div>
            </th>
            <th style={{
              backgroundColor: colors.headerLightBg,
              color: 'white',
              textAlign: 'center',
              padding: '10px 12px',
              fontWeight: 600,
              minWidth: '85px'
            }}>
              {currentPeriodLabel}
            </th>
            <th style={{
              backgroundColor: colors.headerLightBg,
              color: 'white',
              textAlign: 'center',
              padding: '10px 12px',
              fontWeight: 600,
              minWidth: '85px'
            }}>
              {previousPeriodLabel || 'Prev'}
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
            const previousValue = previousMetrics ? metric.getValue(previousMetrics) : null;
            const momChange = previousValue !== null
              ? calculateMoMChange(currentValue, previousValue)
              : { value: 0, trend: 'neutral' as const };

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
                  {previousValue !== null ? formatMetricValue(previousValue, metric.format) : '-'}
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
            const previousValue = previousMetrics ? metric.getValue(previousMetrics) : null;
            const momChange = previousValue !== null
              ? calculateMoMChange(currentValue, previousValue)
              : { value: 0, trend: 'neutral' as const };

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
                  {previousValue !== null ? formatMetricValue(previousValue, metric.format) : '-'}
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

// Collections/Inbound table wrapper
interface CollectionsTableProps {
  title: 'Collections' | 'Inbound';
  currentMetrics: CollectionsMetrics;
  previousMetrics: CollectionsMetrics | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
  comparisonType?: ComparisonType;
}

export function CollectionsTable(props: CollectionsTableProps) {
  const sectionType = props.title.toLowerCase() as SectionType;
  return <PerClientTable {...props} sectionType={sectionType} metricConfig={COLLECTIONS_METRICS} />;
}

// Welcome/Verification table wrapper
interface WelcomeVerificationTableProps {
  title: 'Welcome' | 'Verification';
  currentMetrics: WelcomeVerificationMetrics;
  previousMetrics: WelcomeVerificationMetrics | null;
  currentPeriodLabel: string;
  previousPeriodLabel: string | null;
  comparisonType?: ComparisonType;
}

export function WelcomeVerificationTable(props: WelcomeVerificationTableProps) {
  const sectionType = props.title.toLowerCase() as SectionType;
  return <PerClientTable {...props} sectionType={sectionType} metricConfig={WELCOME_VERIFICATION_METRICS} />;
}
