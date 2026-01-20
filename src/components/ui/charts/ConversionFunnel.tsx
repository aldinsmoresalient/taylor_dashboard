'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from 'recharts';
import { formatNumber, formatPercentage } from '@/lib/utils';
import type { CollectionsMetrics } from '@/types';

interface ConversionFunnelProps {
  metrics: CollectionsMetrics;
  title?: string;
  className?: string;
}

const FUNNEL_COLORS = {
  calls: '#6366f1',      // indigo-500
  connects: '#8b5cf6',   // violet-500
  rpcs: '#a855f7',       // purple-500
  promises: '#d946ef',   // fuchsia-500
  cash: '#10b981',       // emerald-500
};

export function ConversionFunnel({ metrics, title = 'Conversion Funnel', className = '' }: ConversionFunnelProps) {
  const data = [
    {
      name: 'Calls',
      value: metrics.calls,
      rate: 100,
      color: FUNNEL_COLORS.calls,
    },
    {
      name: 'Connects',
      value: metrics.connects,
      rate: metrics.connectRate,
      color: FUNNEL_COLORS.connects,
    },
    {
      name: 'RPCs',
      value: metrics.rpcs,
      rate: metrics.rpcRate,
      color: FUNNEL_COLORS.rpcs,
    },
    {
      name: 'Promises',
      value: metrics.promises,
      rate: metrics.promisesPerRpc,
      color: FUNNEL_COLORS.promises,
    },
    {
      name: 'Cash',
      value: metrics.cashPayments,
      rate: metrics.cashPerPromises, // Cash as % of Promises (conversion from previous stage)
      color: FUNNEL_COLORS.cash,
    },
  ];

  const CustomTooltip = ({ active, payload }: { active?: boolean; payload?: Array<{ payload: typeof data[0] }> }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      return (
        <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3">
          <p className="font-semibold text-gray-900">{item.name}</p>
          <p className="text-sm text-gray-600">
            Count: <span className="font-medium text-gray-900">{formatNumber(item.value)}</span>
          </p>
          {item.name !== 'Calls' && (
            <p className="text-sm text-gray-600">
              Rate: <span className="font-medium text-gray-900">{formatPercentage(item.rate)}</span>
            </p>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={`bg-white rounded-xl border border-gray-200 shadow-sm p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        <div className="flex items-center gap-4 text-xs">
          {data.slice(1).map((item) => (
            <div key={item.name} className="flex items-center gap-1.5">
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-gray-600">{item.name}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={data}
            layout="vertical"
            margin={{ top: 0, right: 40, left: 0, bottom: 0 }}
          >
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              width={70}
              tick={{ fontSize: 12, fill: '#6b7280' }}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(0,0,0,0.04)' }} />
            <Bar
              dataKey="value"
              radius={[0, 6, 6, 0]}
              barSize={32}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
              <LabelList
                dataKey="value"
                position="right"
                formatter={(value: number) => formatNumber(value)}
                style={{ fontSize: 12, fontWeight: 600, fill: '#374151' }}
              />
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Conversion rates row */}
      <div className="mt-4 pt-4 border-t border-gray-100">
        <div className="grid grid-cols-4 gap-4">
          {[
            { label: 'Connect Rate', value: metrics.connectRate },
            { label: 'RPC Rate', value: metrics.rpcRate },
            { label: 'Promise Rate', value: metrics.promisesPerRpc },
            { label: 'Cash/Promise', value: metrics.cashPerPromises },
          ].map((item) => (
            <div key={item.label} className="text-center">
              <p className="text-xs text-gray-500 mb-1">{item.label}</p>
              <p className="text-lg font-bold text-gray-900">{formatPercentage(item.value)}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
