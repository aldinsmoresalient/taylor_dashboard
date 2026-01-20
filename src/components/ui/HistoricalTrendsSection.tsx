'use client';

import { useState, useCallback } from 'react';
import { TrendChart, TrendMetricCard } from './charts/TrendChart';
import { useHistoricalTrends, type HistoricalTrendData } from '@/hooks/useKPIData';
import { ErrorWithRetry } from './ErrorWithRetry';
import type { ClientName } from '@/types';

interface HistoricalTrendsSectionProps {
  client: ClientName | 'all';
  excludeWestlake?: boolean;
}

// Loading skeleton for trends
function TrendsSkeleton() {
  return (
    <div className="space-y-6">
      {/* Metric cards skeleton */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-5 animate-pulse">
            <div className="h-4 w-20 bg-gray-200 rounded mb-3" />
            <div className="flex items-end justify-between">
              <div className="h-8 w-24 bg-gray-200 rounded" />
              <div className="h-10 w-24 bg-gray-100 rounded" />
            </div>
          </div>
        ))}
      </div>
      {/* Chart skeleton */}
      <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
        <div className="h-5 w-40 bg-gray-200 rounded mb-4" />
        <div className="h-64 bg-gray-100 rounded" />
      </div>
    </div>
  );
}

export function HistoricalTrendsSection({
  client,
  excludeWestlake = false,
}: HistoricalTrendsSectionProps) {
  const [months, setMonths] = useState(12);
  const [selectedMetric, setSelectedMetric] = useState<'volume' | 'rates' | 'outcomes' | 'dollars'>('volume');
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error } = useHistoricalTrends(client, months, excludeWestlake);

  const handleRetry = useCallback(() => {
    setRefreshKey((k) => k + 1);
  }, []);

  if (isLoading) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Historical Trends</h2>
        </div>
        <TrendsSkeleton />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold text-gray-800">Historical Trends</h2>
        </div>
        <ErrorWithRetry
          message={error || 'Failed to load historical data'}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Prepare chart data
  const chartData = data.months.map((m) => ({
    label: m.label,
    // Volume metrics
    calls: m.collections.calls + m.inbound.calls,
    collectionsCalls: m.collections.calls,
    inboundCalls: m.inbound.calls,
    // Rate metrics
    connectRate: m.collections.connectRate,
    rpcRate: m.collections.rpcRate,
    inboundConnectRate: m.inbound.connectRate,
    // Outcome metrics
    promises: m.collections.promises + m.inbound.promises,
    cashPayments: m.collections.cashPayments + m.inbound.cashPayments,
    promisesPerRpc: m.collections.promisesPerRpc,
    cashPerRpc: m.collections.cashPerRpc,
    cashPerPromises: m.collections.promises > 0 ? (m.collections.cashPayments / m.collections.promises) * 100 : 0,
    // Dollar metrics
    dollarCollected: m.collections.dollarCollected + m.inbound.dollarCollected,
    dollarPromised: m.collections.dollarPromised + m.inbound.dollarPromised,
    collectionsDollarCollected: m.collections.dollarCollected,
    inboundDollarCollected: m.inbound.dollarCollected,
  }));

  // Get latest and previous month for trend cards
  const latestMonth = data.months[data.months.length - 1];
  const prevMonth = data.months[data.months.length - 2];

  // Prepare trend data arrays for sparklines
  const callsTrend = data.months.map((m) => m.collections.calls + m.inbound.calls);
  const connectRateTrend = data.months.map((m) => m.collections.connectRate);
  const promisesTrend = data.months.map((m) => m.collections.promises + m.inbound.promises);
  const cashTrend = data.months.map((m) => m.collections.cashPayments + m.inbound.cashPayments);
  const dollarCollectedTrend = data.months.map((m) => m.collections.dollarCollected + m.inbound.dollarCollected);
  const dollarPromisedTrend = data.months.map((m) => m.collections.dollarPromised + m.inbound.dollarPromised);

  const metricTabs = [
    { key: 'volume' as const, label: 'Volume' },
    { key: 'rates' as const, label: 'Rates' },
    { key: 'outcomes' as const, label: 'Outcomes' },
    { key: 'dollars' as const, label: 'Dollars' },
  ];

  return (
    <div className="mb-6">
      {/* Section Header */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-semibold text-gray-800">Historical Trends</h2>
        <div className="flex items-center gap-3">
          {/* Time range selector */}
          <select
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value={6}>Last 6 months</option>
            <option value={12}>Last 12 months</option>
            <option value={18}>Last 18 months</option>
          </select>
        </div>
      </div>

      {/* Summary Trend Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <TrendMetricCard
          title="Total Calls"
          currentValue={latestMonth.collections.calls + latestMonth.inbound.calls}
          previousValue={prevMonth ? prevMonth.collections.calls + prevMonth.inbound.calls : 0}
          trendData={callsTrend}
          format="number"
          color="#6366f1"
        />
        <TrendMetricCard
          title="Connect Rate"
          currentValue={latestMonth.collections.connectRate}
          previousValue={prevMonth?.collections.connectRate || 0}
          trendData={connectRateTrend}
          format="percentage"
          color="#8b5cf6"
        />
        <TrendMetricCard
          title="$ Collected"
          currentValue={latestMonth.collections.dollarCollected + latestMonth.inbound.dollarCollected}
          previousValue={prevMonth ? prevMonth.collections.dollarCollected + prevMonth.inbound.dollarCollected : 0}
          trendData={dollarCollectedTrend}
          format="currency"
          color="#059669"
        />
        <TrendMetricCard
          title="$ Promised"
          currentValue={latestMonth.collections.dollarPromised + latestMonth.inbound.dollarPromised}
          previousValue={prevMonth ? prevMonth.collections.dollarPromised + prevMonth.inbound.dollarPromised : 0}
          trendData={dollarPromisedTrend}
          format="currency"
          color="#0d9488"
        />
      </div>

      {/* Metric Type Tabs */}
      <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-1 w-fit mb-4">
        {metricTabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedMetric(tab.key)}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-all duration-150 ${
              selectedMetric === tab.key
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Main Trend Chart */}
      {selectedMetric === 'volume' && (
        <TrendChart
          data={chartData}
          lines={[
            { key: 'collectionsCalls', name: 'Collections', color: '#6366f1', type: 'area' },
            { key: 'inboundCalls', name: 'Inbound', color: '#8b5cf6', type: 'area' },
          ]}
          title="Call Volume Over Time"
          subtitle="Collections (outbound) vs Inbound calls by month"
          yAxisFormat="number"
          height={320}
        />
      )}

      {selectedMetric === 'rates' && (
        <TrendChart
          data={chartData}
          lines={[
            { key: 'connectRate', name: 'Connect Rate', color: '#6366f1' },
            { key: 'rpcRate', name: 'RPC Rate', color: '#8b5cf6' },
          ]}
          title="Conversion Rates Over Time"
          subtitle="Connect rate and RPC rate trends"
          yAxisFormat="percentage"
          height={320}
        />
      )}

      {selectedMetric === 'outcomes' && (
        <TrendChart
          data={chartData}
          lines={[
            { key: 'promises', name: 'Promises', color: '#ec4899', type: 'bar' },
            { key: 'cashPayments', name: 'Cash Payments', color: '#10b981', type: 'bar' },
          ]}
          title="Outcomes Over Time"
          subtitle="Promises and cash payments by month"
          yAxisFormat="number"
          height={320}
        />
      )}

      {selectedMetric === 'dollars' && (
        <TrendChart
          data={chartData}
          lines={[
            { key: 'dollarCollected', name: '$ Collected', color: '#059669', type: 'area' },
            { key: 'dollarPromised', name: '$ Promised', color: '#0d9488', type: 'area' },
          ]}
          title="Dollar Volume Over Time"
          subtitle="Total dollars collected and promised by month"
          yAxisFormat="currency"
          height={320}
        />
      )}

      {/* Secondary Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <TrendChart
          data={chartData}
          lines={[
            { key: 'promisesPerRpc', name: 'Promises/RPC', color: '#ec4899' },
            { key: 'cashPerPromises', name: 'Cash/Promise', color: '#10b981' },
          ]}
          title="Efficiency Rates"
          subtitle="Conversion efficiency over time"
          yAxisFormat="percentage"
          height={240}
        />
        <TrendChart
          data={chartData}
          lines={[
            { key: 'calls', name: 'Total Calls', color: '#6366f1', type: 'area' },
          ]}
          title="Total Call Volume"
          subtitle="Combined collections and inbound"
          yAxisFormat="number"
          height={240}
          showLegend={false}
        />
      </div>
    </div>
  );
}
