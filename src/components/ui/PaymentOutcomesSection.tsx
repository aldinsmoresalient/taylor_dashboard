'use client';

import { useState, useEffect } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { formatNumber, formatPercentage } from '@/lib/utils';
import type { ClientName, APIResponse } from '@/types';
import type { PaymentOutcomeData } from '@/lib/clickhouse';

const COLORS = {
  successful: '#10b981', // emerald-500
  declined: '#f59e0b',   // amber-500
  apiFailed: '#ef4444',  // red-500
};

interface PaymentOutcomesSectionProps {
  client: ClientName | 'all';
  startDate: string;
  endDate: string;
  excludeWestlake?: boolean;
}

export function PaymentOutcomesSection({
  client,
  startDate,
  endDate,
  excludeWestlake = false,
}: PaymentOutcomesSectionProps) {
  const [data, setData] = useState<PaymentOutcomeData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

        const response = await fetch(`/api/payment-outcomes?${params.toString()}`);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const result: APIResponse<PaymentOutcomeData> = await response.json();

        if (result.success && result.data) {
          setData(result.data);
        } else {
          throw new Error(result.error || 'Failed to fetch payment outcome data');
        }
      } catch (err) {
        console.error('Error fetching payment outcomes:', err);
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
        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Outcomes</h3>
        <div className="flex items-center justify-center h-[200px]">
          <div className="animate-pulse text-gray-400">Loading...</div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Outcomes</h3>
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          {error || 'No data available'}
        </div>
      </div>
    );
  }

  // No payment attempts
  if (data.totalAttempts === 0) {
    return (
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Outcomes</h3>
        <div className="flex items-center justify-center h-[200px] text-gray-400">
          No payment attempts in this period
        </div>
      </div>
    );
  }

  const chartData = [
    { name: 'Successful', value: data.successful, color: COLORS.successful },
    { name: 'Declined', value: data.declined, color: COLORS.declined },
    { name: 'API Failed', value: data.apiFailed, color: COLORS.apiFailed },
  ].filter(d => d.value > 0);

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const item = payload[0];
      return (
        <div className="bg-white rounded-lg border border-gray-200 shadow-lg p-3">
          <div className="flex items-center gap-2 mb-1">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: item.payload.color }}
            />
            <span className="font-semibold text-gray-900">{item.name}</span>
          </div>
          <div className="text-sm text-gray-600">
            Count: <span className="font-medium text-gray-900">{formatNumber(item.value)}</span>
          </div>
          <div className="text-sm text-gray-600">
            Rate: <span className="font-medium text-gray-900">
              {formatPercentage((item.value / data.totalAttempts) * 100)}
            </span>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Outcomes</h3>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <div className="h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="bottom"
                iconType="circle"
                iconSize={10}
                formatter={(value) => (
                  <span className="text-sm text-gray-600">{value}</span>
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Summary Stats */}
        <div className="space-y-4">
          <div className="p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-500 mb-1">Total Attempts</p>
            <p className="text-2xl font-bold text-gray-900">{formatNumber(data.totalAttempts)}</p>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 bg-emerald-50 rounded-lg border border-emerald-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-emerald-500" />
                <p className="text-xs text-emerald-700">Successful</p>
              </div>
              <p className="text-lg font-bold text-emerald-700">{formatNumber(data.successful)}</p>
              <p className="text-xs text-emerald-600">{formatPercentage(data.successRate)}</p>
            </div>

            <div className="p-3 bg-amber-50 rounded-lg border border-amber-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-amber-500" />
                <p className="text-xs text-amber-700">Declined</p>
              </div>
              <p className="text-lg font-bold text-amber-700">{formatNumber(data.declined)}</p>
              <p className="text-xs text-amber-600">{formatPercentage(data.declineRate)}</p>
            </div>

            <div className="p-3 bg-red-50 rounded-lg border border-red-100">
              <div className="flex items-center gap-1.5 mb-1">
                <div className="w-2 h-2 rounded-full bg-red-500" />
                <p className="text-xs text-red-700">API Failed</p>
              </div>
              <p className="text-lg font-bold text-red-700">{formatNumber(data.apiFailed)}</p>
              <p className="text-xs text-red-600">{formatPercentage(data.apiFailureRate)}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
