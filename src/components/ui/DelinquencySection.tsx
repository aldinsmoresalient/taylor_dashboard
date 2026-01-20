'use client';

import { useState, useEffect } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts';
import { formatNumber, formatPercentage, formatCurrency } from '@/lib/utils';
import type { ClientName, APIResponse } from '@/types';
import type { DelinquencyBreakdownData } from '@/lib/clickhouse';

const BUCKET_COLORS = {
  '1-30': '#10b981',   // emerald-500
  '31-60': '#f59e0b',  // amber-500
  '61-90': '#f97316',  // orange-500
  '90+': '#ef4444',    // red-500
};

interface DelinquencySectionProps {
  client: ClientName | 'all';
  startDate: string;
  endDate: string;
  excludeWestlake?: boolean;
}

type MetricKey = 'rpcs' | 'promises' | 'cashPayments' | 'dollarCollected';

export function DelinquencySection({
  client,
  startDate,
  endDate,
  excludeWestlake = false,
}: DelinquencySectionProps) {
  const [data, setData] = useState<DelinquencyBreakdownData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<MetricKey>('rpcs');

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    const fetchData = async () => {
      try {
        const params = new URLSearchParams({
          client,
          startDate,
          endDate,
          excludeWestlake: String(excludeWestlake),
        });

        const response = await fetch(`/api/delinquency?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: APIResponse<DelinquencyBreakdownData> = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch delinquency data');
        }
      } catch (err) {
        console.error('Error fetching delinquency data:', err);
        setError(err instanceof Error ? err.message : 'An error occurred');
        setData(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [client, startDate, endDate, excludeWestlake]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Performance by Delinquency</h3>
        <div className="flex items-center justify-center h-[300px]">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Performance by Delinquency</h3>
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  // No data
  if (data.total.calls === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Performance by Delinquency</h3>
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          No collections data in this period
        </div>
      </div>
    );
  }

  const metricOptions: { key: MetricKey; label: string }[] = [
    { key: 'rpcs', label: 'RPCs' },
    { key: 'promises', label: 'Promises' },
    { key: 'cashPayments', label: 'Cash Payments' },
    { key: 'dollarCollected', label: '$ Collected' },
  ];

  const chartData = data.buckets.map((bucket) => ({
    name: bucket.bucketLabel,
    value: bucket[selectedMetric],
    fill: BUCKET_COLORS[bucket.bucket as keyof typeof BUCKET_COLORS],
  }));

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const bucket = data.buckets.find(b => b.bucketLabel === label);
      if (!bucket) return null;

      return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3 min-w-[180px]">
          <p className="font-semibold text-gray-900 mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-500">Accounts:</span>
              <span className="font-medium">{formatNumber(bucket.accounts)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Calls:</span>
              <span className="font-medium">{formatNumber(bucket.calls)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">Connect Rate:</span>
              <span className="font-medium">{formatPercentage(bucket.connectRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">RPCs:</span>
              <span className="font-medium">{formatNumber(bucket.rpcs)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">RPC Rate:</span>
              <span className="font-medium">{formatPercentage(bucket.rpcRate)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-500">$ Collected:</span>
              <span className="font-medium">{formatCurrency(bucket.dollarCollected)}</span>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  const formatYAxis = (value: number) => {
    if (selectedMetric === 'dollarCollected') {
      if (value >= 1000000) return `$${(value / 1000000).toFixed(1)}M`;
      if (value >= 1000) return `$${(value / 1000).toFixed(0)}K`;
      return `$${value}`;
    }
    return formatNumber(value);
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-gray-900">Performance by Delinquency</h3>
        <div className="flex gap-1">
          {metricOptions.map((option) => (
            <button
              key={option.key}
              onClick={() => setSelectedMetric(option.key)}
              className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
                selectedMetric === option.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Bar Chart */}
        <div className="h-[260px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#64748b', fontSize: 11 }}
                tickFormatter={formatYAxis}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="value"
                radius={[4, 4, 0, 0]}
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-200">
                <th className="text-left py-2 px-2 font-medium text-gray-500">Bucket</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500">Accounts</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500">RPCs</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500">PTP%</th>
                <th className="text-right py-2 px-2 font-medium text-gray-500">$ Collected</th>
              </tr>
            </thead>
            <tbody>
              {data.buckets.map((bucket) => (
                <tr key={bucket.bucket} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-2 px-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-2 h-2 rounded-full"
                        style={{ backgroundColor: BUCKET_COLORS[bucket.bucket as keyof typeof BUCKET_COLORS] }}
                      />
                      <span className="font-medium text-gray-900">{bucket.bucketLabel}</span>
                    </div>
                  </td>
                  <td className="text-right py-2 px-2 text-gray-700">
                    {formatNumber(bucket.accounts)}
                  </td>
                  <td className="text-right py-2 px-2 text-gray-700">
                    {formatNumber(bucket.rpcs)}
                  </td>
                  <td className="text-right py-2 px-2 text-gray-700">
                    {formatPercentage(bucket.promisesPerRpc)}
                  </td>
                  <td className="text-right py-2 px-2 text-gray-700">
                    {formatCurrency(bucket.dollarCollected)}
                  </td>
                </tr>
              ))}
              {/* Totals row */}
              <tr className="bg-gray-50 font-medium">
                <td className="py-2 px-2 text-gray-900">Total</td>
                <td className="text-right py-2 px-2 text-gray-900">
                  {formatNumber(data.total.accounts)}
                </td>
                <td className="text-right py-2 px-2 text-gray-900">
                  {formatNumber(data.total.rpcs)}
                </td>
                <td className="text-right py-2 px-2 text-gray-900">
                  {data.total.rpcs > 0
                    ? formatPercentage((data.total.promises / data.total.rpcs) * 100)
                    : '-'}
                </td>
                <td className="text-right py-2 px-2 text-gray-900">
                  {formatCurrency(data.total.dollarCollected)}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
