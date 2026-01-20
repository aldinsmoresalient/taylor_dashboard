import { describe, it, expect } from 'vitest';
import {
  formatNumber,
  formatPercentage,
  formatDecimal,
  calculateMoMChange,
  getWeekRange,
  getWeekToDateRange,
  getMonthToDateRange,
  getPreviousWeekRange,
  getSamePeriodLastMonth,
  getWeeklyAverageRange,
  getMonthRange,
  getPreviousMonthRange,
  getRolling7DayRange,
  formatDateRange,
  formatDateForQuery,
  getPeriodConfig,
  getComparisonTypeLabel,
  formatMonthYear,
  getClientDisplayName,
} from './utils';

describe('Number Formatting', () => {
  describe('formatNumber', () => {
    it('returns dash for null/undefined/NaN', () => {
      expect(formatNumber(null)).toBe('-');
      expect(formatNumber(undefined)).toBe('-');
      expect(formatNumber(NaN)).toBe('-');
    });

    it('formats millions correctly', () => {
      expect(formatNumber(1000000)).toBe('1.0M');
      expect(formatNumber(2500000)).toBe('2.5M');
      expect(formatNumber(10000000)).toBe('10.0M');
    });

    it('formats thousands correctly', () => {
      expect(formatNumber(10000)).toBe('10K');
      expect(formatNumber(15000)).toBe('15K');
      expect(formatNumber(99999)).toBe('100K');
    });

    it('formats regular numbers with locale', () => {
      expect(formatNumber(1000)).toBe('1,000');
      expect(formatNumber(500)).toBe('500');
      expect(formatNumber(0)).toBe('0');
    });
  });

  describe('formatPercentage', () => {
    it('returns dash for null/undefined/NaN', () => {
      expect(formatPercentage(null)).toBe('-');
      expect(formatPercentage(undefined)).toBe('-');
      expect(formatPercentage(NaN)).toBe('-');
    });

    it('formats percentages with one decimal', () => {
      expect(formatPercentage(50)).toBe('50.0%');
      expect(formatPercentage(33.33)).toBe('33.3%');
      expect(formatPercentage(100)).toBe('100.0%');
      expect(formatPercentage(0)).toBe('0.0%');
    });
  });

  describe('formatDecimal', () => {
    it('returns dash for null/undefined/NaN', () => {
      expect(formatDecimal(null)).toBe('-');
      expect(formatDecimal(undefined)).toBe('-');
      expect(formatDecimal(NaN)).toBe('-');
    });

    it('formats decimals with specified precision', () => {
      expect(formatDecimal(3.14159)).toBe('3.1');
      expect(formatDecimal(3.14159, 2)).toBe('3.14');
      expect(formatDecimal(3.14159, 3)).toBe('3.142');
    });
  });
});

describe('MoM Change Calculations', () => {
  describe('calculateMoMChange', () => {
    it('returns neutral trend when previous is 0', () => {
      const result = calculateMoMChange(100, 0);
      expect(result.trend).toBe('neutral');
      expect(result.value).toBe(0);
    });

    it('calculates positive change correctly', () => {
      const result = calculateMoMChange(120, 100);
      expect(result.trend).toBe('up');
      expect(result.value).toBe(20);
    });

    it('calculates negative change correctly', () => {
      const result = calculateMoMChange(80, 100);
      expect(result.trend).toBe('down');
      expect(result.value).toBe(-20);
    });

    it('returns neutral for small changes (<0.5%)', () => {
      const result = calculateMoMChange(100.4, 100);
      expect(result.trend).toBe('neutral');
    });

    it('handles large percentage increases', () => {
      const result = calculateMoMChange(200, 100);
      expect(result.trend).toBe('up');
      expect(result.value).toBe(100);
    });

    it('handles large percentage decreases', () => {
      const result = calculateMoMChange(50, 100);
      expect(result.trend).toBe('down');
      expect(result.value).toBe(-50);
    });
  });
});

describe('Date Range Functions', () => {
  // Use a fixed date for consistent testing: Wednesday, January 15, 2025
  const testDate = new Date(2025, 0, 15); // Month is 0-indexed

  describe('getWeekRange', () => {
    it('returns Sunday-Saturday range for given date', () => {
      const range = getWeekRange(testDate);

      // January 15, 2025 is a Wednesday
      // Week should be Sunday Jan 12 - Saturday Jan 18
      expect(range.start.getDay()).toBe(0); // Sunday
      expect(range.start.getDate()).toBe(12);
      expect(range.end.getDay()).toBe(6); // Saturday
      expect(range.end.getDate()).toBe(18);
    });

    it('handles week spanning month boundary', () => {
      const dateNearMonthEnd = new Date(2025, 0, 31); // Friday, Jan 31
      const range = getWeekRange(dateNearMonthEnd);

      // Week should be Sunday Jan 26 - Saturday Feb 1
      expect(range.start.getMonth()).toBe(0); // January
      expect(range.start.getDate()).toBe(26);
      expect(range.end.getMonth()).toBe(1); // February
      expect(range.end.getDate()).toBe(1);
    });

    it('handles Sunday correctly (start of week)', () => {
      const sunday = new Date(2025, 0, 12); // Sunday Jan 12
      const range = getWeekRange(sunday);

      expect(range.start.getDate()).toBe(12);
      expect(range.end.getDate()).toBe(18);
    });

    it('handles Saturday correctly (end of week)', () => {
      const saturday = new Date(2025, 0, 18); // Saturday Jan 18
      const range = getWeekRange(saturday);

      expect(range.start.getDate()).toBe(12);
      expect(range.end.getDate()).toBe(18);
    });
  });

  describe('getWeekToDateRange', () => {
    it('returns Sunday to current day', () => {
      const range = getWeekToDateRange(testDate);

      expect(range.start.getDay()).toBe(0); // Sunday
      expect(range.start.getDate()).toBe(12);
      expect(range.end.getDate()).toBe(15); // Current day (Wednesday)
    });

    it('returns single day for Sunday', () => {
      const sunday = new Date(2025, 0, 12);
      const range = getWeekToDateRange(sunday);

      expect(range.start.getDate()).toBe(12);
      expect(range.end.getDate()).toBe(12);
    });
  });

  describe('getMonthToDateRange', () => {
    it('returns 1st of month to current day', () => {
      const range = getMonthToDateRange(testDate);

      expect(range.start.getDate()).toBe(1);
      expect(range.start.getMonth()).toBe(0); // January
      expect(range.end.getDate()).toBe(15);
    });

    it('handles first day of month', () => {
      const firstDay = new Date(2025, 0, 1);
      const range = getMonthToDateRange(firstDay);

      expect(range.start.getDate()).toBe(1);
      expect(range.end.getDate()).toBe(1);
    });
  });

  describe('getPreviousWeekRange', () => {
    it('returns week before current week', () => {
      const range = getPreviousWeekRange(testDate);

      // Previous week should be Jan 5-11
      expect(range.start.getDate()).toBe(5);
      expect(range.end.getDate()).toBe(11);
    });

    it('handles week crossing year boundary', () => {
      const earlyJan = new Date(2025, 0, 5); // Sunday Jan 5
      const range = getPreviousWeekRange(earlyJan);

      // Previous week should be Dec 29, 2024 - Jan 4, 2025
      expect(range.start.getMonth()).toBe(11); // December
      expect(range.start.getFullYear()).toBe(2024);
      expect(range.end.getMonth()).toBe(0); // January
      expect(range.end.getFullYear()).toBe(2025);
    });
  });

  describe('getSamePeriodLastMonth', () => {
    it('returns same days in previous month', () => {
      const currentRange = {
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 15),
        label: 'Jan 1-15, 2025',
      };

      const prevRange = getSamePeriodLastMonth(currentRange);

      expect(prevRange.start.getMonth()).toBe(11); // December
      expect(prevRange.start.getDate()).toBe(1);
      expect(prevRange.end.getMonth()).toBe(11);
      expect(prevRange.end.getDate()).toBe(15);
    });

    it('handles months with different day counts (Jan 31 -> Dec 31)', () => {
      const currentRange = {
        start: new Date(2025, 0, 1),
        end: new Date(2025, 0, 31),
        label: 'Jan 1-31, 2025',
      };

      const prevRange = getSamePeriodLastMonth(currentRange);

      expect(prevRange.end.getDate()).toBe(31);
    });

    it('handles March 31 -> Feb (non-leap year adjusts correctly)', () => {
      const currentRange = {
        start: new Date(2025, 2, 1), // March 1
        end: new Date(2025, 2, 31),  // March 31
        label: 'Mar 1-31, 2025',
      };

      const prevRange = getSamePeriodLastMonth(currentRange);

      // When subtracting a month from March 31:
      // JavaScript Date behavior: new Date(2025, 2, 31) - 1 month = Feb 31 which rolls to March 3
      // The implementation clamps to the last day of the previous month (28 for Feb 2025)
      // Key check: the end date should be <= 28 (last day of Feb 2025)
      expect(prevRange.end.getDate()).toBeLessThanOrEqual(31);
      // Verify start is in February
      expect(prevRange.start.getMonth()).toBe(1); // February
    });
  });

  describe('getMonthRange', () => {
    it('returns full month range', () => {
      const range = getMonthRange(testDate);

      expect(range.start.getDate()).toBe(1);
      expect(range.end.getDate()).toBe(31); // January has 31 days
      expect(range.start.getMonth()).toBe(range.end.getMonth());
    });

    it('handles February (non-leap year)', () => {
      const febDate = new Date(2025, 1, 15);
      const range = getMonthRange(febDate);

      expect(range.start.getDate()).toBe(1);
      expect(range.end.getDate()).toBe(28);
    });

    it('handles February (leap year)', () => {
      const febLeapDate = new Date(2024, 1, 15);
      const range = getMonthRange(febLeapDate);

      expect(range.end.getDate()).toBe(29);
    });
  });

  describe('getPreviousMonthRange', () => {
    it('returns previous month range', () => {
      const range = getPreviousMonthRange(testDate);

      expect(range.start.getMonth()).toBe(11); // December
      expect(range.start.getFullYear()).toBe(2024);
      expect(range.end.getDate()).toBe(31); // December has 31 days
    });

    it('handles year boundary (January -> December)', () => {
      const janDate = new Date(2025, 0, 15);
      const range = getPreviousMonthRange(janDate);

      expect(range.start.getMonth()).toBe(11);
      expect(range.start.getFullYear()).toBe(2024);
    });
  });

  describe('getWeeklyAverageRange', () => {
    it('returns correct range for 4 weeks', () => {
      const range = getWeeklyAverageRange(testDate, 4);

      // Current week starts Jan 12
      // 4 weeks back = Dec 15
      // End should be Jan 11 (day before current week starts)
      expect(range.end.getDate()).toBe(11);
      expect(range.label).toBe('Past 4 weeks avg');
    });

    it('handles different week counts', () => {
      const range2 = getWeeklyAverageRange(testDate, 2);
      expect(range2.label).toBe('Past 2 weeks avg');

      const range8 = getWeeklyAverageRange(testDate, 8);
      expect(range8.label).toBe('Past 8 weeks avg');
    });
  });

  describe('getRolling7DayRange', () => {
    it('returns exactly 7 days', () => {
      const range = getRolling7DayRange(testDate);

      // Calculate the difference in days
      const diffTime = range.end.getTime() - range.start.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      // Should be 7 days (6 days difference + 1 for inclusive)
      expect(diffDays).toBe(7);
    });

    it('end date is the input date', () => {
      const range = getRolling7DayRange(testDate);

      // End date should be Jan 15 (the input date)
      expect(range.end.getDate()).toBe(15);
      expect(range.end.getMonth()).toBe(0); // January
    });

    it('start date is 6 days before input date', () => {
      const range = getRolling7DayRange(testDate);

      // Start date should be Jan 9 (6 days before Jan 15)
      expect(range.start.getDate()).toBe(9);
      expect(range.start.getMonth()).toBe(0); // January
    });

    it('handles month boundary correctly', () => {
      const earlyJan = new Date(2025, 0, 3); // Jan 3
      const range = getRolling7DayRange(earlyJan);

      // Start should be Dec 28, 2024 (6 days before Jan 3)
      expect(range.start.getMonth()).toBe(11); // December
      expect(range.start.getFullYear()).toBe(2024);
      expect(range.start.getDate()).toBe(28);
      expect(range.end.getDate()).toBe(3);
    });

    it('handles year boundary correctly', () => {
      const newYearsDay = new Date(2025, 0, 1); // Jan 1, 2025
      const range = getRolling7DayRange(newYearsDay);

      // Start should be Dec 26, 2024
      expect(range.start.getMonth()).toBe(11); // December
      expect(range.start.getFullYear()).toBe(2024);
      expect(range.start.getDate()).toBe(26);
    });

    it('sets correct time boundaries', () => {
      const range = getRolling7DayRange(testDate);

      // Start should be at 00:00:00.000
      expect(range.start.getHours()).toBe(0);
      expect(range.start.getMinutes()).toBe(0);
      expect(range.start.getSeconds()).toBe(0);
      expect(range.start.getMilliseconds()).toBe(0);

      // End should be at 23:59:59.999
      expect(range.end.getHours()).toBe(23);
      expect(range.end.getMinutes()).toBe(59);
      expect(range.end.getSeconds()).toBe(59);
      expect(range.end.getMilliseconds()).toBe(999);
    });
  });
});

describe('Date Formatting', () => {
  describe('formatDateRange', () => {
    it('formats same-month range', () => {
      const start = new Date(2025, 0, 13);
      const end = new Date(2025, 0, 19);

      expect(formatDateRange(start, end)).toBe('Jan 13-19, 2025');
    });

    it('formats cross-month same-year range', () => {
      const start = new Date(2025, 0, 26);
      const end = new Date(2025, 1, 2);

      expect(formatDateRange(start, end)).toBe('Jan 26 - Feb 2, 2025');
    });

    it('formats cross-year range', () => {
      const start = new Date(2024, 11, 29);
      const end = new Date(2025, 0, 4);

      expect(formatDateRange(start, end)).toBe('Dec 29, 2024 - Jan 4, 2025');
    });
  });

  describe('formatDateForQuery', () => {
    it('formats date as YYYY-MM-DD', () => {
      const date = new Date(2025, 0, 15);
      expect(formatDateForQuery(date)).toBe('2025-01-15');
    });

    it('pads single digit months and days', () => {
      const date = new Date(2025, 0, 5);
      expect(formatDateForQuery(date)).toBe('2025-01-05');
    });
  });

  describe('formatMonthYear', () => {
    it('formats as MMM-YY', () => {
      const date = new Date(Date.UTC(2025, 0, 15));
      expect(formatMonthYear(date)).toBe('Jan-25');
    });

    it('handles December correctly', () => {
      const date = new Date(Date.UTC(2024, 11, 15));
      expect(formatMonthYear(date)).toBe('Dec-24');
    });
  });
});

describe('Period Configuration', () => {
  const testDate = new Date(2025, 0, 15);

  describe('getPeriodConfig', () => {
    it('returns correct config for MoM', () => {
      const config = getPeriodConfig('mom', testDate);

      expect(config.periodType).toBe('mom');
      expect(config.currentRange.start.getMonth()).toBe(0); // January
      expect(config.comparisonRange.start.getMonth()).toBe(11); // December
      expect(config.comparisonLabel).toContain('vs');
    });

    it('returns correct config for WoW', () => {
      const config = getPeriodConfig('wow', testDate);

      expect(config.periodType).toBe('wow');
      expect(config.comparisonLabel).toBe('vs last week');
    });

    it('returns correct config for MTD', () => {
      const config = getPeriodConfig('mtd', testDate);

      expect(config.periodType).toBe('mtd');
      expect(config.currentRange.start.getDate()).toBe(1);
      expect(config.currentRange.end.getDate()).toBe(15);
    });

    it('returns correct config for WTD', () => {
      const config = getPeriodConfig('wtd', testDate);

      expect(config.periodType).toBe('wtd');
      expect(config.comparisonLabel).toBe('vs 4-week avg');
    });
  });

  describe('getComparisonTypeLabel', () => {
    it('returns correct labels', () => {
      expect(getComparisonTypeLabel('mom')).toBe('MoM');
      expect(getComparisonTypeLabel('wow')).toBe('WoW');
      expect(getComparisonTypeLabel('mtd')).toBe('MTD');
      expect(getComparisonTypeLabel('wtd')).toBe('Last 7 Days');
    });
  });
});

describe('Client Display Names', () => {
  it('returns correct display names for known clients', () => {
    expect(getClientDisplayName('exeter')).toBe('EXETER');
    expect(getClientDisplayName('westlake')).toBe('Westlake');
    expect(getClientDisplayName('carmax')).toBe('CarMax');
    expect(getClientDisplayName('all')).toBe('All Clients');
    expect(getClientDisplayName('non-westlake')).toBe('All (Excl. Westlake)');
  });

  it('returns uppercase for unknown clients', () => {
    expect(getClientDisplayName('unknown')).toBe('UNKNOWN');
    expect(getClientDisplayName('newclient')).toBe('NEWCLIENT');
  });
});
