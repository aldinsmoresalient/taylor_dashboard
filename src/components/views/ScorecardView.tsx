'use client';

import { useState, useMemo } from 'react';
import { ClientCard } from '../ui/ClientCard';
import { ScorecardSkeleton } from '../ui/ScorecardSkeleton';
import { useAllClientsScorecardData } from '@/hooks/useKPIData';
import type { ClientName, ScorecardSortOption, ClientScorecardData } from '@/types';

interface ScorecardViewProps {
  onClientClick?: (client: ClientName) => void;
}

const SORT_OPTIONS: { value: ScorecardSortOption; label: string }[] = [
  { value: 'worst-first', label: 'Most Concerning' },
  { value: 'best-first', label: 'Best Performers' },
  { value: 'alphabetical', label: 'Alphabetical' },
  { value: 'volume', label: 'Call Volume' },
];

function sortClients(
  clients: ClientScorecardData[],
  sortOption: ScorecardSortOption
): ClientScorecardData[] {
  const sorted = [...clients];

  switch (sortOption) {
    case 'worst-first':
      return sorted.sort((a, b) => a.overallScore - b.overallScore);
    case 'best-first':
      return sorted.sort((a, b) => b.overallScore - a.overallScore);
    case 'alphabetical':
      return sorted.sort((a, b) => a.displayName.localeCompare(b.displayName));
    case 'volume':
      return sorted.sort((a, b) => b.callVolume.current - a.callVolume.current);
    default:
      return sorted;
  }
}

export function ScorecardView({ onClientClick }: ScorecardViewProps) {
  const { data, isLoading, error, refetch } = useAllClientsScorecardData();
  const [sortOption, setSortOption] = useState<ScorecardSortOption>('worst-first');

  const sortedClients = useMemo(() => {
    if (!data?.clients) return [];
    return sortClients(data.clients, sortOption);
  }, [data?.clients, sortOption]);

  // Summary stats
  const summaryStats = useMemo(() => {
    if (!data?.clients) return null;

    const clients = data.clients;
    const criticalCount = clients.filter((c) => c.overallStatus === 'critical').length;
    const warningCount = clients.filter((c) => c.overallStatus === 'warning').length;
    const goodCount = clients.filter((c) => c.overallStatus === 'good').length;
    const neutralCount = clients.filter((c) => c.overallStatus === 'neutral').length;

    return { criticalCount, warningCount, goodCount, neutralCount, total: clients.length };
  }, [data?.clients]);

  if (isLoading) {
    return <ScorecardSkeleton />;
  }

  if (error) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-12 h-12 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-rose-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to load scorecard data</h3>
          <p className="text-sm text-gray-500 mb-4">{error}</p>
          <button
            onClick={refetch}
            className="inline-flex items-center px-4 py-2 text-sm font-medium text-indigo-600 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors"
          >
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!data || sortedClients.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="text-center py-8">
          <p className="text-sm text-gray-500">No client data available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with summary and controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">Client Scorecard</h2>
          <p className="text-sm text-gray-500 mt-1">
            {data.periodInfo.comparisonDescription}
          </p>
        </div>

        {/* Summary badges */}
        {summaryStats && (
          <div className="flex items-center gap-2 flex-wrap">
            {summaryStats.criticalCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-rose-100 text-rose-700">
                {summaryStats.criticalCount} Critical
              </span>
            )}
            {summaryStats.warningCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-amber-100 text-amber-700">
                {summaryStats.warningCount} Warning
              </span>
            )}
            {summaryStats.goodCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-100 text-emerald-700">
                {summaryStats.goodCount} Good
              </span>
            )}
            {summaryStats.neutralCount > 0 && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                {summaryStats.neutralCount} Neutral
              </span>
            )}
          </div>
        )}
      </div>

      {/* Sort controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">
          {sortedClients.length} client{sortedClients.length !== 1 ? 's' : ''}
        </p>
        <div className="flex items-center gap-2">
          <label htmlFor="sort-select" className="text-sm text-gray-600">
            Sort by:
          </label>
          <select
            id="sort-select"
            value={sortOption}
            onChange={(e) => setSortOption(e.target.value as ScorecardSortOption)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {sortedClients.map((client) => (
          <ClientCard
            key={client.client}
            data={client}
            onClick={onClientClick ? () => onClientClick(client.client) : undefined}
          />
        ))}
      </div>

      {/* Footer */}
      <div className="text-center py-2">
        <p className="text-xs text-gray-400">
          Generated at {new Date(data.generatedAt).toLocaleString()}
        </p>
      </div>
    </div>
  );
}
