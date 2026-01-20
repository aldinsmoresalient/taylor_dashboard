'use client';

import { useState } from 'react';
import { getClientDisplayName } from '@/lib/utils';
import { PeriodSelector } from './ui/PeriodSelector';
import { ALL_CLIENTS, type ClientName, type ComparisonType } from '@/types';

interface HeaderBarProps {
  title: string;
  selectedClient?: ClientName | 'all' | 'non-westlake';
  onClientChange?: (client: ClientName | 'all' | 'non-westlake') => void;
  periodType: ComparisonType;
  onPeriodTypeChange: (type: ComparisonType) => void;
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
  showClientSelector?: boolean;
  showPeriodSelector?: boolean;
  lastUpdated?: Date;
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

export function HeaderBar({
  title,
  selectedClient,
  onClientChange,
  periodType,
  onPeriodTypeChange,
  referenceDate,
  onReferenceDateChange,
  showClientSelector = false,
  showPeriodSelector = true,
  lastUpdated,
  onRefresh,
  isRefreshing = false,
}: HeaderBarProps) {
  const formatLastUpdated = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;

    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' });
  };

  return (
    <header className="bg-white border-b border-gray-200 shadow-sm">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">{title}</h1>
        </div>

        <div className="flex items-center gap-4">
          {/* Last updated and refresh */}
          {(lastUpdated || onRefresh) && (
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-xs text-gray-400">
                  Updated {formatLastUpdated(lastUpdated)}
                </span>
              )}
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  disabled={isRefreshing}
                  className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                  title="Refresh data"
                >
                  <svg
                    className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                </button>
              )}
            </div>
          )}

          {/* Client selector */}
          {showClientSelector && onClientChange && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">Client:</span>
              <select
                value={selectedClient || 'exeter'}
                onChange={(e) => onClientChange(e.target.value as ClientName)}
                className="px-3 py-2 text-sm font-medium border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-gray-300 transition-colors"
              >
                {ALL_CLIENTS.map((client) => (
                  <option key={client} value={client}>
                    {getClientDisplayName(client)}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Period selector on second row */}
      {showPeriodSelector && (
        <div className="px-6 pb-4">
          <PeriodSelector
            periodType={periodType}
            onPeriodTypeChange={onPeriodTypeChange}
            referenceDate={referenceDate}
            onReferenceDateChange={onReferenceDateChange}
          />
        </div>
      )}
    </header>
  );
}
