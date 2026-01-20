'use client';

import type { MoMChange } from '@/types';
import { TREND_COLORS } from '@/lib/colors';

interface MoMIndicatorProps {
  change: MoMChange;
  size?: 'sm' | 'md';
}

export function MoMIndicator({ change, size = 'sm' }: MoMIndicatorProps) {
  const { value, trend } = change;
  const displayValue = Math.abs(Math.round(value));
  const colors = TREND_COLORS[trend];
  
  const sizeClasses = size === 'sm' 
    ? 'px-1.5 py-0.5 text-[10px]' 
    : 'px-2 py-1 text-xs';
  
  if (trend === 'up') {
    return (
      <span className={`inline-flex items-center gap-0.5 ${colors.bg} ${colors.text} ${colors.border} border rounded-full font-semibold ${sizeClasses}`}>
        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 2L10 8H2L6 2Z" />
        </svg>
        {displayValue}%
      </span>
    );
  }
  
  if (trend === 'down') {
    return (
      <span className={`inline-flex items-center gap-0.5 ${colors.bg} ${colors.text} ${colors.border} border rounded-full font-semibold ${sizeClasses}`}>
        <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
          <path d="M6 10L2 4H10L6 10Z" />
        </svg>
        {displayValue}%
      </span>
    );
  }
  
  return (
    <span className={`inline-flex items-center gap-0.5 ${colors.bg} ${colors.text} ${colors.border} border rounded-full font-medium ${sizeClasses}`}>
      <svg className="w-2.5 h-2.5" viewBox="0 0 12 12" fill="currentColor">
        <path d="M2 5H10V7H2V5Z" />
      </svg>
      0%
    </span>
  );
}
