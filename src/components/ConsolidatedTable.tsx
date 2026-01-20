'use client';

import {
  formatMetricValue,
  getClientDisplayName,
  exportTableToCSV
} from '@/lib/utils';
import {
  COLLECTIONS_METRICS,
  WELCOME_VERIFICATION_METRICS,
  type CollectionsMetrics,
  type WelcomeVerificationMetrics,
  type MetricRowConfig,
} from '@/types';

interface ConsolidatedTableProps {
  title: string;
  totalMetrics: CollectionsMetrics | WelcomeVerificationMetrics;
  clientsData: Array<{
    client: string;
    metrics: CollectionsMetrics | WelcomeVerificationMetrics;
    percentOfTotal: CollectionsMetrics | WelcomeVerificationMetrics;
  }>;
  metricConfig: MetricRowConfig[];
}

export function ConsolidatedTable({
  title,
  totalMetrics,
  clientsData,
  metricConfig,
}: ConsolidatedTableProps) {
  const handleExport = () => {
    // Build rows with metric name, total, and each client's value
    const rows = metricConfig.map((metric) => {
      const row: Record<string, unknown> = {
        metric: metric.label,
        total: formatMetricValue(metric.getValue(totalMetrics), metric.format),
      };
      clientsData.forEach((client) => {
        row[client.client] = formatMetricValue(metric.getValue(client.metrics), metric.format);
      });
      return row;
    });

    // Build columns config
    const columns: { key: string; header: string }[] = [
      { key: 'metric', header: 'Metric' },
      { key: 'total', header: 'Total' },
      ...clientsData.map((c) => ({
        key: c.client,
        header: getClientDisplayName(c.client),
      })),
    ];

    const filename = `${title.toLowerCase()}_metrics_${new Date().toISOString().split('T')[0]}.csv`;
    exportTableToCSV(rows, columns, filename);
  };

  return (
    <div className="bg-white border border-gray-300 rounded overflow-hidden">
      {/* Header with export button */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-gray-200 bg-gray-50">
        <span className="text-sm font-semibold text-gray-700">{title}</span>
        <button
          onClick={handleExport}
          className="flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors"
          title={`Export ${title} to CSV`}
        >
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
          </svg>
          Export
        </button>
      </div>
      <div className="overflow-x-auto">
      <table className="w-full text-xs border-collapse min-w-[800px]">
        <thead>
          <tr>
            <th className="bg-[#2d4a35] text-white text-left px-2 py-1.5 font-semibold border border-gray-300 sticky left-0" style={{ minWidth: '130px' }}>
              Metric
            </th>
            <th className="bg-[#4a7c59] text-white text-center px-2 py-1.5 font-semibold border border-gray-300" style={{ minWidth: '70px' }}>
              Total
            </th>
            {clientsData.map((client) => (
              <th 
                key={client.client} 
                colSpan={2} 
                className="bg-[#4a7c59] text-white text-center px-2 py-1.5 font-semibold border border-gray-300"
                style={{ minWidth: '100px' }}
              >
                {getClientDisplayName(client.client)}
              </th>
            ))}
          </tr>
          <tr>
            <th className="bg-gray-100 text-gray-600 text-left px-2 py-1 text-[10px] border border-gray-200 sticky left-0"></th>
            <th className="bg-gray-100 text-gray-600 text-center px-2 py-1 text-[10px] border border-gray-200">Month</th>
            {clientsData.map((client) => (
              <>
                <th key={`${client.client}-month`} className="bg-gray-100 text-gray-600 text-center px-2 py-1 text-[10px] border border-gray-200">Month</th>
                <th key={`${client.client}-pct`} className="bg-gray-100 text-gray-600 text-center px-2 py-1 text-[10px] border border-gray-200">% total</th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {metricConfig.map((metric, idx) => {
            const totalValue = metric.getValue(totalMetrics);
            
            return (
              <tr key={metric.key} className={idx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                <td className="text-left px-2 py-1 font-medium text-gray-700 border border-gray-200 bg-gray-50 sticky left-0">
                  {metric.label}
                </td>
                <td className="text-right px-2 py-1 font-semibold border border-gray-200">
                  {formatMetricValue(totalValue, metric.format)}
                </td>
                {clientsData.map((client) => {
                  const clientValue = metric.getValue(client.metrics);
                  const pctValue = metric.getValue(client.percentOfTotal);
                  const showPct = metric.format === 'number' || metric.format === 'hours';
                  
                  return (
                    <>
                      <td key={`${client.client}-${metric.key}-val`} className="text-right px-2 py-1 border border-gray-200">
                        {formatMetricValue(clientValue, metric.format)}
                      </td>
                      <td key={`${client.client}-${metric.key}-pct`} className="text-right px-2 py-1 text-gray-400 border border-gray-200">
                        {showPct && pctValue > 0 ? `${Math.round(pctValue)}%` : '-'}
                      </td>
                    </>
                  );
                })}
              </tr>
            );
          })}
        </tbody>
      </table>
      </div>
    </div>
  );
}

// Collections consolidated table
interface CollectionsConsolidatedTableProps {
  title: 'Collections' | 'Inbound';
  totalMetrics: CollectionsMetrics;
  clientsData: Array<{
    client: string;
    metrics: CollectionsMetrics;
    percentOfTotal: CollectionsMetrics;
  }>;
}

export function CollectionsConsolidatedTable(props: CollectionsConsolidatedTableProps) {
  return <ConsolidatedTable {...props} metricConfig={COLLECTIONS_METRICS} />;
}

// Welcome/Verification consolidated table
interface WelcomeVerificationConsolidatedTableProps {
  title: 'Welcome' | 'Verification';
  totalMetrics: WelcomeVerificationMetrics;
  clientsData: Array<{
    client: string;
    metrics: WelcomeVerificationMetrics;
    percentOfTotal: WelcomeVerificationMetrics;
  }>;
}

export function WelcomeVerificationConsolidatedTable(props: WelcomeVerificationConsolidatedTableProps) {
  return <ConsolidatedTable {...props} metricConfig={WELCOME_VERIFICATION_METRICS} />;
}
