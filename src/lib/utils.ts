import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import type { MoMTrend, MoMChange, DateRange, ComparisonType, PeriodConfig } from '@/types';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 10000) {
    return (num / 1000).toFixed(0) + 'K';
  }
  if (num >= 1000) {
    return num.toLocaleString();
  }
  return num.toLocaleString();
}

export function formatPercentage(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return `${num.toFixed(1)}%`;
}

export function formatDecimal(num: number | null | undefined, decimals = 1): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return num.toFixed(decimals);
}

export function formatCurrency(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  if (num >= 1000000) {
    return '$' + (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return '$' + (num / 1000).toFixed(1) + 'K';
  }
  return '$' + num.toFixed(0);
}

export function formatCurrencyFull(num: number | null | undefined): string {
  if (num === null || num === undefined || isNaN(num)) return '-';
  return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

export function formatMetricValue(
  value: number | null | undefined,
  format: 'number' | 'percentage' | 'decimal' | 'hours' | 'minutes' | 'currency'
): string {
  if (value === null || value === undefined || isNaN(value)) return '-';

  switch (format) {
    case 'number':
      return formatNumber(value);
    case 'percentage':
      return formatPercentage(value);
    case 'decimal':
      return formatDecimal(value, 1);
    case 'hours':
      return formatNumber(Math.round(value));
    case 'minutes':
      return formatDecimal(value, 1);
    case 'currency':
      return formatCurrency(value);
    default:
      return String(value);
  }
}

export function calculateMoMChange(current: number, previous: number): MoMChange {
  if (!previous || previous === 0) {
    return { value: 0, trend: 'neutral' };
  }
  
  const change = ((current - previous) / previous) * 100;
  
  let trend: MoMTrend = 'neutral';
  if (change > 0.5) trend = 'up';
  else if (change < -0.5) trend = 'down';
  
  return { value: change, trend };
}

export function formatMoMChange(change: MoMChange): string {
  if (change.trend === 'neutral' || Math.abs(change.value) < 0.5) {
    return '0%';
  }
  const sign = change.value > 0 ? '' : '';
  return `${sign}${Math.round(change.value)}%`;
}

export function getClientDisplayName(client: string): string {
  const displayNames: Record<string, string> = {
    exeter: 'EXETER',
    aca: 'ACA',
    cps: 'CPS',
    ally: 'ALLY',
    autonation: 'Autonation',
    cac: 'CAC',
    carmax: 'CarMax',
    creditone: 'CreditOne',
    finbe: 'FINBE',
    ftb: 'FTB',
    gm: 'GM',
    gofi: 'GoFi',
    maf: 'MAF',
    prestige: 'Prestige',
    strike: 'Strike',
    tenet: 'Tenet',
    tricolor: 'Tricolor',
    uacc: 'UACC',
    universal: 'Universal',
    westlake: 'Westlake',
    yendo: 'Yendo',
    all: 'All Clients',
    'non-westlake': 'All (Excl. Westlake)',
    total: 'Total',
  };
  return displayNames[client] || client.toUpperCase();
}

export function formatMonthYear(date: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  // Use UTC methods to avoid timezone issues
  const year = date.getUTCFullYear().toString().slice(-2);
  return `${months[date.getUTCMonth()]}-${year}`;
}

// Parse YYYY-MM string to get proper month label without timezone issues
export function parseMonthString(monthStr: string): { label: string; prevLabel: string } {
  const [year, month] = monthStr.split('-').map(Number);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  
  const currentLabel = `${months[month - 1]}-${year.toString().slice(-2)}`;
  
  // Calculate previous month
  let prevMonth = month - 1;
  let prevYear = year;
  if (prevMonth < 1) {
    prevMonth = 12;
    prevYear -= 1;
  }
  const prevLabel = `${months[prevMonth - 1]}-${prevYear.toString().slice(-2)}`;
  
  return { label: currentLabel, prevLabel };
}

export function formatYearMonth(date: Date): string {
  const year = date.getFullYear();
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${year}-${month}`;
}

// Get available months for selector (last 12 months)
export function getAvailableMonths(): { value: string; label: string }[] {
  const months: { value: string; label: string }[] = [];
  const now = new Date();
  
  for (let i = 0; i < 12; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      value: formatYearMonth(date),
      label: formatMonthYear(date),
    });
  }
  
  return months;
}

// ============================================
// DATE RANGE UTILITY FUNCTIONS
// ============================================

/**
 * Get the week range (Sunday-Saturday) containing the given date
 */
export function getWeekRange(date: Date): DateRange {
  const d = new Date(date);
  const day = d.getDay(); // 0 = Sunday, 6 = Saturday

  // Get Sunday (start of week)
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  sunday.setHours(0, 0, 0, 0);

  // Get Saturday (end of week)
  const saturday = new Date(sunday);
  saturday.setDate(sunday.getDate() + 6);
  saturday.setHours(23, 59, 59, 999);

  return {
    start: sunday,
    end: saturday,
    label: formatDateRange(sunday, saturday),
  };
}

/**
 * Get week-to-date range (Sunday to current day)
 */
export function getWeekToDateRange(date: Date): DateRange {
  const d = new Date(date);
  const day = d.getDay();

  // Get Sunday (start of week)
  const sunday = new Date(d);
  sunday.setDate(d.getDate() - day);
  sunday.setHours(0, 0, 0, 0);

  // End is the current date
  const endDate = new Date(d);
  endDate.setHours(23, 59, 59, 999);

  return {
    start: sunday,
    end: endDate,
    label: formatDateRange(sunday, endDate),
  };
}

/**
 * Get month-to-date range (1st of month to current day)
 */
export function getMonthToDateRange(date: Date): DateRange {
  const d = new Date(date);

  // Start of month
  const monthStart = new Date(d.getFullYear(), d.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  // Current date
  const current = new Date(d);
  current.setHours(23, 59, 59, 999);

  return {
    start: monthStart,
    end: current,
    label: formatDateRange(monthStart, current),
  };
}

/**
 * Get the previous week's range (Sunday-Saturday before the current week)
 */
export function getPreviousWeekRange(date: Date): DateRange {
  const currentWeek = getWeekRange(date);

  // Go back 7 days from the start of current week
  const prevSunday = new Date(currentWeek.start);
  prevSunday.setDate(prevSunday.getDate() - 7);

  const prevSaturday = new Date(prevSunday);
  prevSaturday.setDate(prevSunday.getDate() + 6);
  prevSaturday.setHours(23, 59, 59, 999);

  return {
    start: prevSunday,
    end: prevSaturday,
    label: formatDateRange(prevSunday, prevSaturday),
  };
}

/**
 * Get the same period in the previous month
 * E.g., if current is Jan 1-19, returns Dec 1-19
 */
export function getSamePeriodLastMonth(range: DateRange): DateRange {
  const startPrevMonth = new Date(range.start);
  startPrevMonth.setMonth(startPrevMonth.getMonth() - 1);

  const endPrevMonth = new Date(range.end);
  endPrevMonth.setMonth(endPrevMonth.getMonth() - 1);

  // Handle edge cases for months with different day counts
  // If the day doesn't exist in prev month, use last day of that month
  const daysInPrevMonth = new Date(startPrevMonth.getFullYear(), startPrevMonth.getMonth() + 1, 0).getDate();
  if (endPrevMonth.getDate() > daysInPrevMonth) {
    endPrevMonth.setDate(daysInPrevMonth);
  }

  return {
    start: startPrevMonth,
    end: endPrevMonth,
    label: formatDateRange(startPrevMonth, endPrevMonth),
  };
}

/**
 * Get the range for calculating weekly average (rolling N weeks)
 * Returns the combined range for the past N weeks
 */
export function getWeeklyAverageRange(date: Date, weeks: number = 4): DateRange {
  const currentWeek = getWeekRange(date);

  // Go back N weeks from the start of current week
  const startDate = new Date(currentWeek.start);
  startDate.setDate(startDate.getDate() - (weeks * 7));

  // End at the Saturday before current week
  const endDate = new Date(currentWeek.start);
  endDate.setDate(endDate.getDate() - 1);
  endDate.setHours(23, 59, 59, 999);

  return {
    start: startDate,
    end: endDate,
    label: `Past ${weeks} weeks avg`,
  };
}

/**
 * Get the full month range for a given date
 */
export function getMonthRange(date: Date): DateRange {
  const monthStart = new Date(date.getFullYear(), date.getMonth(), 1);
  monthStart.setHours(0, 0, 0, 0);

  const monthEnd = new Date(date.getFullYear(), date.getMonth() + 1, 0);
  monthEnd.setHours(23, 59, 59, 999);

  return {
    start: monthStart,
    end: monthEnd,
    label: formatMonthYear(date),
  };
}

/**
 * Get the previous month's full range
 */
export function getPreviousMonthRange(date: Date): DateRange {
  const prevMonth = new Date(date.getFullYear(), date.getMonth() - 1, 1);
  return getMonthRange(prevMonth);
}

/**
 * Get rolling 7-day range ending on the given date
 * E.g., for Jan 19, returns Jan 13-19
 */
export function getRolling7DayRange(date: Date): DateRange {
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);

  const start = new Date(date);
  start.setDate(start.getDate() - 6);
  start.setHours(0, 0, 0, 0);

  return { start, end, label: formatDateRange(start, end) };
}

/**
 * Format a date range as a human-readable string
 * E.g., "Jan 13-19, 2025" or "Jan 13 - Feb 2, 2025"
 */
export function formatDateRange(start: Date, end: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const sameMonth = start.getMonth() === end.getMonth() && start.getFullYear() === end.getFullYear();

  if (sameMonth) {
    return `${months[start.getMonth()]} ${start.getDate()}-${end.getDate()}, ${start.getFullYear()}`;
  }

  const sameYear = start.getFullYear() === end.getFullYear();
  if (sameYear) {
    return `${months[start.getMonth()]} ${start.getDate()} - ${months[end.getMonth()]} ${end.getDate()}, ${start.getFullYear()}`;
  }

  return `${months[start.getMonth()]} ${start.getDate()}, ${start.getFullYear()} - ${months[end.getMonth()]} ${end.getDate()}, ${end.getFullYear()}`;
}

/**
 * Format date as YYYY-MM-DD for API queries
 */
export function formatDateForQuery(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get the PeriodConfig for a given comparison type and reference date
 */
export function getPeriodConfig(comparisonType: ComparisonType, referenceDate: Date): PeriodConfig {
  switch (comparisonType) {
    case 'mom': {
      const currentRange = getMonthRange(referenceDate);
      const comparisonRange = getPreviousMonthRange(referenceDate);
      return {
        periodType: 'mom',
        currentRange,
        comparisonRange,
        comparisonLabel: `vs ${comparisonRange.label}`,
      };
    }
    case 'wow': {
      const currentRange = getWeekRange(referenceDate);
      const comparisonRange = getPreviousWeekRange(referenceDate);
      return {
        periodType: 'wow',
        currentRange,
        comparisonRange,
        comparisonLabel: 'vs last week',
      };
    }
    case 'mtd': {
      const currentRange = getMonthToDateRange(referenceDate);
      const comparisonRange = getSamePeriodLastMonth(currentRange);
      return {
        periodType: 'mtd',
        currentRange,
        comparisonRange,
        comparisonLabel: `vs ${comparisonRange.label}`,
      };
    }
    case 'wtd': {
      const currentRange = getWeekToDateRange(referenceDate);
      const comparisonRange = getWeeklyAverageRange(referenceDate, 4);
      return {
        periodType: 'wtd',
        currentRange,
        comparisonRange,
        comparisonLabel: 'vs 4-week avg',
      };
    }
    default:
      return getPeriodConfig('mom', referenceDate);
  }
}

/**
 * Get display label for a comparison type
 */
export function getComparisonTypeLabel(type: ComparisonType): string {
  const labels: Record<ComparisonType, string> = {
    mom: 'MoM',
    wow: 'WoW',
    mtd: 'MTD',
    wtd: 'Last 7 Days',
  };
  return labels[type];
}

/**
 * Get available weeks for navigation (last 12 weeks)
 */
export function getAvailableWeeks(): { value: string; label: string; range: DateRange }[] {
  const weeks: { value: string; label: string; range: DateRange }[] = [];
  const now = new Date();

  for (let i = 0; i < 12; i++) {
    const weekDate = new Date(now);
    weekDate.setDate(weekDate.getDate() - (i * 7));
    const range = getWeekRange(weekDate);
    weeks.push({
      value: formatDateForQuery(range.start),
      label: range.label,
      range,
    });
  }

  return weeks;
}

// ============================================
// CSV EXPORT UTILITIES
// ============================================

/**
 * Escape a value for CSV (handle quotes, commas, newlines)
 */
function escapeCSVValue(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return '';
  const stringValue = String(value);
  // If the value contains quotes, commas, or newlines, wrap in quotes and escape internal quotes
  if (stringValue.includes('"') || stringValue.includes(',') || stringValue.includes('\n')) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
}

/**
 * Convert an array of objects to CSV string
 */
export function convertToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string; formatter?: (value: unknown) => string }[]
): string {
  if (data.length === 0) return '';

  // Header row
  const headerRow = columns.map((col) => escapeCSVValue(col.header)).join(',');

  // Data rows
  const dataRows = data.map((row) =>
    columns
      .map((col) => {
        const value = row[col.key];
        const formatted = col.formatter ? col.formatter(value) : value;
        return escapeCSVValue(formatted as string | number);
      })
      .join(',')
  );

  return [headerRow, ...dataRows].join('\n');
}

/**
 * Download a CSV file
 */
export function downloadCSV(csvContent: string, filename: string): void {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Export table data to CSV and trigger download
 */
export function exportTableToCSV<T extends Record<string, unknown>>(
  data: T[],
  columns: { key: keyof T; header: string; formatter?: (value: unknown) => string }[],
  filename: string
): void {
  const csv = convertToCSV(data, columns);
  downloadCSV(csv, filename);
}
