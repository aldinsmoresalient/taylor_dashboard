/**
 * Shared color constants for the dashboard
 * Centralizes all color definitions for consistency
 */

// Chart colors for recharts visualizations
export const CHART_COLORS = {
  primary: '#3b82f6',    // blue-500
  secondary: '#8b5cf6',  // violet-500
  tertiary: '#f59e0b',   // amber-500
  success: '#10b981',    // emerald-500
  warning: '#f97316',    // orange-500
  grid: '#e5e7eb',       // gray-200
} as const;

// Trend indicator colors (for positive/negative changes)
export const TREND_COLORS = {
  up: {
    text: 'text-emerald-700',
    bg: 'bg-emerald-50',
    border: 'border-emerald-200',
    icon: '↑',
  },
  down: {
    text: 'text-rose-700',
    bg: 'bg-rose-50',
    border: 'border-rose-200',
    icon: '↓',
  },
  neutral: {
    text: 'text-gray-600',
    bg: 'bg-gray-50',
    border: 'border-gray-200',
    icon: '→',
  },
} as const;

// Table section theme colors (hex values for styled components)
export const TABLE_SECTION_COLORS = {
  collections: {
    headerBg: '#047857',     // emerald-700
    headerLightBg: '#059669', // emerald-600
    accent: '#10b981',       // emerald-500
  },
  inbound: {
    headerBg: '#6d28d9',     // violet-700
    headerLightBg: '#7c3aed', // violet-600
    accent: '#8b5cf6',       // violet-500
  },
} as const;

// Table section theme colors (Tailwind classes)
export const TABLE_SECTION_CLASSES = {
  collections: {
    header: 'bg-emerald-700',
    headerLight: 'bg-emerald-600',
    accent: 'border-l-emerald-500',
  },
  inbound: {
    header: 'bg-violet-700',
    headerLight: 'bg-violet-600',
    accent: 'border-l-violet-500',
  },
} as const;

// Metric-specific colors for charts
export const METRIC_COLORS = {
  calls: '#3b82f6',        // blue-500
  connects: '#8b5cf6',     // violet-500
  rpcs: '#f59e0b',         // amber-500
  promises: '#ec4899',     // pink-500
  cash: '#10b981',         // emerald-500
  dollarCollected: '#059669', // emerald-600
} as const;

// Delinquency bucket colors
export const DELINQUENCY_COLORS = {
  '1-30': '#10b981',   // emerald-500
  '31-60': '#f59e0b',  // amber-500
  '61-90': '#f97316',  // orange-500
  '90+': '#ef4444',    // red-500
} as const;

// Payment outcome colors
export const PAYMENT_COLORS = {
  successful: '#10b981', // emerald-500
  failed: '#ef4444',     // red-500
  pending: '#f59e0b',    // amber-500
} as const;

// Conversion funnel colors
export const FUNNEL_COLORS = {
  calls: '#3b82f6',      // blue-500
  connects: '#8b5cf6',   // violet-500
  rpcs: '#f59e0b',       // amber-500
  promises: '#ec4899',   // pink-500
  cash: '#10b981',       // emerald-500
} as const;

// Helper function to get trend color classes
export function getTrendColorClasses(direction: 'up' | 'down' | 'neutral') {
  return TREND_COLORS[direction];
}

// Helper function to determine trend direction
export function getTrendDirection(current: number, previous: number, higherIsBetter = true): 'up' | 'down' | 'neutral' {
  if (current === previous) return 'neutral';
  const isHigher = current > previous;
  if (higherIsBetter) {
    return isHigher ? 'up' : 'down';
  }
  return isHigher ? 'down' : 'up';
}
