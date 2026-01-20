'use client';

import { useMemo } from 'react';
import {
  getAvailableMonths,
  getAvailableWeeks,
  getMonthRange,
  getWeekRange,
  getPeriodConfig,
  formatDateForQuery,
} from '@/lib/utils';
import type { ComparisonType } from '@/types';

interface PeriodSelectorProps {
  periodType: ComparisonType;
  onPeriodTypeChange: (type: ComparisonType) => void;
  referenceDate: Date;
  onReferenceDateChange: (date: Date) => void;
}

const PERIOD_TYPE_OPTIONS: { value: ComparisonType; label: string; description: string }[] = [
  { value: 'mom', label: 'Monthly', description: 'Full month vs previous month' },
  { value: 'wow', label: 'Weekly', description: 'Full week vs previous week' },
  { value: 'mtd', label: 'MTD', description: 'Month-to-date vs same period last month' },
  { value: 'wtd', label: 'Last 7 Days', description: 'Last 7 days vs 4-week average' },
];

export function PeriodSelector({
  periodType,
  onPeriodTypeChange,
  referenceDate,
  onReferenceDateChange,
}: PeriodSelectorProps) {
  const periodConfig = useMemo(
    () => getPeriodConfig(periodType, referenceDate),
    [periodType, referenceDate]
  );

  // Get available options based on period type
  const months = useMemo(() => getAvailableMonths(), []);
  const weeks = useMemo(() => getAvailableWeeks(), []);

  // Navigation handlers
  const handlePrevious = () => {
    const newDate = new Date(referenceDate);
    if (periodType === 'mom' || periodType === 'mtd') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    onReferenceDateChange(newDate);
  };

  const handleNext = () => {
    const newDate = new Date(referenceDate);
    const today = new Date();

    if (periodType === 'mom' || periodType === 'mtd') {
      newDate.setMonth(newDate.getMonth() + 1);
      // Don't allow going past current month
      if (newDate > today) return;
    } else {
      newDate.setDate(newDate.getDate() + 7);
      // Don't allow going past current week
      if (newDate > today) return;
    }
    onReferenceDateChange(newDate);
  };

  // Check if we can navigate forward
  const canGoNext = useMemo(() => {
    const newDate = new Date(referenceDate);
    const today = new Date();

    if (periodType === 'mom' || periodType === 'mtd') {
      newDate.setMonth(newDate.getMonth() + 1);
      return newDate <= today;
    } else {
      newDate.setDate(newDate.getDate() + 7);
      return newDate <= today;
    }
  }, [referenceDate, periodType]);

  // Handle dropdown selection
  const handleDropdownChange = (value: string) => {
    if (periodType === 'mom' || periodType === 'mtd') {
      // Parse YYYY-MM format
      const [year, month] = value.split('-').map(Number);
      onReferenceDateChange(new Date(year, month - 1, 15)); // Use mid-month for stability
    } else {
      // Parse YYYY-MM-DD format (week start)
      const date = new Date(value);
      onReferenceDateChange(date);
    }
  };

  // Get current dropdown value
  const currentDropdownValue = useMemo(() => {
    if (periodType === 'mom' || periodType === 'mtd') {
      const year = referenceDate.getFullYear();
      const month = String(referenceDate.getMonth() + 1).padStart(2, '0');
      return `${year}-${month}`;
    } else {
      const weekRange = getWeekRange(referenceDate);
      return formatDateForQuery(weekRange.start);
    }
  }, [referenceDate, periodType]);

  return (
    <div className="flex items-center gap-4">
      {/* Period type buttons */}
      <div className="flex items-center bg-gray-100 rounded-lg p-1">
        {PERIOD_TYPE_OPTIONS.map((option) => (
          <button
            key={option.value}
            onClick={() => onPeriodTypeChange(option.value)}
            className={`
              px-4 py-2 text-sm font-medium rounded-md transition-all duration-150
              ${periodType === option.value
                ? 'bg-white shadow-sm text-gray-900'
                : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
              }
            `}
            title={option.description}
          >
            {option.label}
          </button>
        ))}
      </div>

      {/* Date navigation */}
      <div className="flex items-center gap-1 bg-white border border-gray-200 rounded-lg px-1 py-1">
        {/* Previous button */}
        <button
          onClick={handlePrevious}
          className="p-1.5 rounded-md hover:bg-gray-100 transition-colors text-gray-500 hover:text-gray-700"
          title="Previous period"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
          </svg>
        </button>

        {/* Period dropdown */}
        <select
          value={currentDropdownValue}
          onChange={(e) => handleDropdownChange(e.target.value)}
          className="px-3 py-1.5 text-sm font-medium border-0 bg-transparent focus:outline-none focus:ring-0 text-gray-700 min-w-[150px] cursor-pointer"
        >
          {(periodType === 'mom' || periodType === 'mtd') ? (
            months.map((month) => (
              <option key={month.value} value={month.value}>
                {month.label}
              </option>
            ))
          ) : (
            weeks.map((week) => (
              <option key={week.value} value={week.value}>
                {week.label}
              </option>
            ))
          )}
        </select>

        {/* Next button */}
        <button
          onClick={handleNext}
          disabled={!canGoNext}
          className={`
            p-1.5 rounded-md transition-colors
            ${canGoNext
              ? 'hover:bg-gray-100 text-gray-500 hover:text-gray-700'
              : 'text-gray-300 cursor-not-allowed'
            }
          `}
          title="Next period"
        >
          <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Current range display */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-800 bg-indigo-50 px-3 py-1.5 rounded-full">
          {periodConfig.currentRange.label}
        </span>
        <span className="text-sm text-gray-500">
          {periodConfig.comparisonLabel}
        </span>
      </div>
    </div>
  );
}
