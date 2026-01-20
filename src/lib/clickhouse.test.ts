import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the internal logic without actually connecting to ClickHouse

describe('Result Code Classifications', () => {
  // Non-connect results (calls that didn't connect to a person)
  const NON_CONNECT_RESULTS = [
    'NOA', 'ANX', 'VML', 'DEADAIR', 'BADNO', 'BLOCKED',
    'DAI', 'DIS', // Westlake mappings
    'BGN', 'DIALING', 'ATTEMPTING', // Legacy/other
  ];

  // Non-RPC results
  const NON_RPC_RESULTS = [
    'TPI', 'WRONGNO', 'XCSN',
    'WRN', 'CHECKNO', // Client mappings
    'NID', // Legacy
  ];

  // Transfer results
  const TRANSFER_RESULTS = [
    'XCSV', 'XCSN', 'XCSP', 'XCS', 'XCSR',
    'TDNC', 'SARI', // Legacy
  ];

  // PTP results
  const PTP_RESULTS = ['POP', 'FCC', 'FCC-F', 'PHO', 'PHO-F', 'XCSP'];

  // Cash results
  const CASH_RESULTS = ['PHO', 'FCC'];

  it('non-connect results should include voicemail codes', () => {
    expect(NON_CONNECT_RESULTS).toContain('ANX');
    expect(NON_CONNECT_RESULTS).toContain('VML');
    expect(NON_CONNECT_RESULTS).toContain('NOA');
  });

  it('non-connect results should include technical failures', () => {
    expect(NON_CONNECT_RESULTS).toContain('BADNO');
    expect(NON_CONNECT_RESULTS).toContain('BLOCKED');
    expect(NON_CONNECT_RESULTS).toContain('DEADAIR');
  });

  it('non-connect should include Westlake-specific codes', () => {
    expect(NON_CONNECT_RESULTS).toContain('DAI'); // DEADAIR mapping
    expect(NON_CONNECT_RESULTS).toContain('DIS'); // BADNO mapping
  });

  it('non-RPC results should include third party and wrong number codes', () => {
    expect(NON_RPC_RESULTS).toContain('TPI');
    expect(NON_RPC_RESULTS).toContain('WRONGNO');
    expect(NON_RPC_RESULTS).toContain('WRN'); // Westlake mapping
    expect(NON_RPC_RESULTS).toContain('CHECKNO'); // ACA mapping
  });

  it('transfer results should include all transfer codes', () => {
    expect(TRANSFER_RESULTS).toContain('XCSV'); // After verification
    expect(TRANSFER_RESULTS).toContain('XCSN'); // Before verification
    expect(TRANSFER_RESULTS).toContain('XCSP'); // After POP
  });

  it('PTP results should include all promise codes', () => {
    expect(PTP_RESULTS).toContain('POP'); // Payment promised
    expect(PTP_RESULTS).toContain('FCC'); // Future payment scheduled
    expect(PTP_RESULTS).toContain('PHO'); // Payment today
    expect(PTP_RESULTS).toContain('FCC-F'); // Failed future payment
    expect(PTP_RESULTS).toContain('PHO-F'); // Failed payment
  });

  it('cash results should only include successful payments', () => {
    expect(CASH_RESULTS).toContain('PHO');
    expect(CASH_RESULTS).toContain('FCC');
    expect(CASH_RESULTS).not.toContain('FCC-F');
    expect(CASH_RESULTS).not.toContain('PHO-F');
    expect(CASH_RESULTS).not.toContain('POP'); // POP is promise, not cash
  });

  it('XCSP should be in both transfers and PTP', () => {
    expect(TRANSFER_RESULTS).toContain('XCSP');
    expect(PTP_RESULTS).toContain('XCSP');
  });
});

describe('Derived Metrics Calculations', () => {
  // Safe division helper
  function safeDivide(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  // Calculate derived metrics for collections
  function calculateDerivedCollectionsMetrics(raw: {
    accounts: number;
    calls: number;
    connects: number;
    rpcs: number;
    promises: number;
    cashPayments: number;
    transfers: number;
    durationMinutes: number;
  }) {
    return {
      accounts: raw.accounts,
      calls: raw.calls,
      callsPerAccount: safeDivide(raw.calls, raw.accounts),
      connects: raw.connects,
      connectRate: safeDivide(raw.connects, raw.calls) * 100,
      rpcs: raw.rpcs,
      rpcRate: safeDivide(raw.rpcs, raw.connects) * 100,
      promises: raw.promises,
      promisesPerRpc: safeDivide(raw.promises, raw.rpcs) * 100,
      cashPayments: raw.cashPayments,
      cashPerRpc: safeDivide(raw.cashPayments, raw.rpcs) * 100,
      cashPerPromises: safeDivide(raw.cashPayments, raw.promises) * 100,
      transfers: raw.transfers,
      transfersPerRpc: safeDivide(raw.transfers, raw.rpcs) * 100,
      timeOnCallHours: raw.durationMinutes / 60,
      avgTimePerCallMin: safeDivide(raw.durationMinutes, raw.calls),
    };
  }

  describe('safeDivide', () => {
    it('returns 0 when denominator is 0', () => {
      expect(safeDivide(100, 0)).toBe(0);
    });

    it('calculates division correctly', () => {
      expect(safeDivide(50, 100)).toBe(0.5);
      expect(safeDivide(100, 50)).toBe(2);
    });
  });

  describe('calculateDerivedCollectionsMetrics', () => {
    it('calculates all metrics correctly for valid data', () => {
      const raw = {
        accounts: 1000,
        calls: 5000,
        connects: 2000,
        rpcs: 800,
        promises: 400,
        cashPayments: 200,
        transfers: 100,
        durationMinutes: 15000,
      };

      const metrics = calculateDerivedCollectionsMetrics(raw);

      // Basic metrics
      expect(metrics.accounts).toBe(1000);
      expect(metrics.calls).toBe(5000);
      expect(metrics.connects).toBe(2000);
      expect(metrics.rpcs).toBe(800);
      expect(metrics.promises).toBe(400);
      expect(metrics.cashPayments).toBe(200);
      expect(metrics.transfers).toBe(100);

      // Derived metrics
      expect(metrics.callsPerAccount).toBe(5); // 5000/1000
      expect(metrics.connectRate).toBe(40); // 2000/5000 * 100
      expect(metrics.rpcRate).toBe(40); // 800/2000 * 100
      expect(metrics.promisesPerRpc).toBe(50); // 400/800 * 100
      expect(metrics.cashPerRpc).toBe(25); // 200/800 * 100
      expect(metrics.cashPerPromises).toBe(50); // 200/400 * 100
      expect(metrics.transfersPerRpc).toBe(12.5); // 100/800 * 100
      expect(metrics.timeOnCallHours).toBe(250); // 15000/60
      expect(metrics.avgTimePerCallMin).toBe(3); // 15000/5000
    });

    it('handles zero values gracefully', () => {
      const raw = {
        accounts: 0,
        calls: 0,
        connects: 0,
        rpcs: 0,
        promises: 0,
        cashPayments: 0,
        transfers: 0,
        durationMinutes: 0,
      };

      const metrics = calculateDerivedCollectionsMetrics(raw);

      // Should not throw and should return 0 for derived metrics
      expect(metrics.callsPerAccount).toBe(0);
      expect(metrics.connectRate).toBe(0);
      expect(metrics.rpcRate).toBe(0);
      expect(metrics.promisesPerRpc).toBe(0);
      expect(metrics.cashPerRpc).toBe(0);
      expect(metrics.avgTimePerCallMin).toBe(0);
    });

    it('calculates correct rates for edge cases', () => {
      const raw = {
        accounts: 100,
        calls: 100,
        connects: 100,
        rpcs: 100,
        promises: 100,
        cashPayments: 100,
        transfers: 100,
        durationMinutes: 600,
      };

      const metrics = calculateDerivedCollectionsMetrics(raw);

      // All rates should be 100%
      expect(metrics.callsPerAccount).toBe(1);
      expect(metrics.connectRate).toBe(100);
      expect(metrics.rpcRate).toBe(100);
      expect(metrics.promisesPerRpc).toBe(100);
      expect(metrics.cashPerRpc).toBe(100);
      expect(metrics.cashPerPromises).toBe(100);
      expect(metrics.transfersPerRpc).toBe(100);
      expect(metrics.avgTimePerCallMin).toBe(6);
    });
  });
});

describe('Query Date Formatting', () => {
  function formatDateTimeForQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 00:00:00`;
  }

  function formatDateTimeEndForQuery(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day} 23:59:59`;
  }

  it('formats start of day correctly', () => {
    const date = new Date(2025, 0, 15); // Jan 15, 2025
    expect(formatDateTimeForQuery(date)).toBe('2025-01-15 00:00:00');
  });

  it('formats end of day correctly', () => {
    const date = new Date(2025, 0, 15);
    expect(formatDateTimeEndForQuery(date)).toBe('2025-01-15 23:59:59');
  });

  it('pads single digit months and days', () => {
    const date = new Date(2025, 0, 5); // Jan 5, 2025
    expect(formatDateTimeForQuery(date)).toBe('2025-01-05 00:00:00');
  });

  it('handles December correctly', () => {
    const date = new Date(2024, 11, 31); // Dec 31, 2024
    expect(formatDateTimeForQuery(date)).toBe('2024-12-31 00:00:00');
  });
});

describe('KPI Result Parsing', () => {
  interface RawKPIRow {
    model: string;
    direction: string;
    accounts: string;
    calls: string;
    connects: string;
    rpcs: string;
    promises: string;
    cash_payments: string;
    transfers: string;
    duration_minutes: string;
    completed_verifications: string;
  }

  function emptyCollectionsMetrics() {
    return {
      accounts: 0,
      calls: 0,
      callsPerAccount: 0,
      connects: 0,
      connectRate: 0,
      rpcs: 0,
      rpcRate: 0,
      promises: 0,
      promisesPerRpc: 0,
      cashPayments: 0,
      cashPerRpc: 0,
      cashPerPromises: 0,
      transfers: 0,
      transfersPerRpc: 0,
      timeOnCallHours: 0,
      avgTimePerCallMin: 0,
    };
  }

  // Simplified parseKPIResults for testing
  function parseKPIResults(rows: RawKPIRow[]) {
    let collectionsRaw = { calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0 };
    let inboundRaw = { calls: 0, connects: 0, rpcs: 0, promises: 0, cashPayments: 0 };

    for (const row of rows) {
      const model = row.model?.toLowerCase() || '';
      const direction = row.direction?.toLowerCase() || '';

      const calls = parseInt(row.calls) || 0;
      const connects = parseInt(row.connects) || 0;
      const rpcs = parseInt(row.rpcs) || 0;
      const promises = parseInt(row.promises) || 0;
      const cashPayments = parseInt(row.cash_payments) || 0;

      if (model === 'collections') {
        if (direction === 'inbound') {
          inboundRaw.calls += calls;
          inboundRaw.connects += connects;
          inboundRaw.rpcs += rpcs;
          inboundRaw.promises += promises;
          inboundRaw.cashPayments += cashPayments;
        } else {
          collectionsRaw.calls += calls;
          collectionsRaw.connects += connects;
          collectionsRaw.rpcs += rpcs;
          collectionsRaw.promises += promises;
          collectionsRaw.cashPayments += cashPayments;
        }
      } else if (model === 'inbound') {
        // Some clients use 'inbound' as model name
        inboundRaw.calls += calls;
        inboundRaw.connects += connects;
        inboundRaw.rpcs += rpcs;
        inboundRaw.promises += promises;
        inboundRaw.cashPayments += cashPayments;
      }
    }

    return { collectionsRaw, inboundRaw };
  }

  it('separates collections outbound and inbound correctly', () => {
    const rows: RawKPIRow[] = [
      {
        model: 'collections',
        direction: 'outbound',
        accounts: '100',
        calls: '500',
        connects: '200',
        rpcs: '80',
        promises: '40',
        cash_payments: '20',
        transfers: '10',
        duration_minutes: '1500',
        completed_verifications: '0',
      },
      {
        model: 'collections',
        direction: 'inbound',
        accounts: '50',
        calls: '100',
        connects: '90',
        rpcs: '70',
        promises: '35',
        cash_payments: '25',
        transfers: '5',
        duration_minutes: '300',
        completed_verifications: '0',
      },
    ];

    const result = parseKPIResults(rows);

    // Outbound collections
    expect(result.collectionsRaw.calls).toBe(500);
    expect(result.collectionsRaw.connects).toBe(200);
    expect(result.collectionsRaw.rpcs).toBe(80);
    expect(result.collectionsRaw.promises).toBe(40);
    expect(result.collectionsRaw.cashPayments).toBe(20);

    // Inbound
    expect(result.inboundRaw.calls).toBe(100);
    expect(result.inboundRaw.connects).toBe(90);
    expect(result.inboundRaw.rpcs).toBe(70);
    expect(result.inboundRaw.promises).toBe(35);
    expect(result.inboundRaw.cashPayments).toBe(25);
  });

  it('handles model=inbound as inbound type', () => {
    const rows: RawKPIRow[] = [
      {
        model: 'inbound',
        direction: '',
        accounts: '50',
        calls: '200',
        connects: '180',
        rpcs: '150',
        promises: '75',
        cash_payments: '50',
        transfers: '10',
        duration_minutes: '600',
        completed_verifications: '0',
      },
    ];

    const result = parseKPIResults(rows);

    expect(result.inboundRaw.calls).toBe(200);
    expect(result.inboundRaw.connects).toBe(180);
    expect(result.inboundRaw.rpcs).toBe(150);
  });

  it('handles missing or null values gracefully', () => {
    const rows: RawKPIRow[] = [
      {
        model: 'collections',
        direction: 'outbound',
        accounts: '',
        calls: 'invalid',
        connects: '',
        rpcs: '50',
        promises: '',
        cash_payments: '',
        transfers: '',
        duration_minutes: '',
        completed_verifications: '',
      },
    ];

    const result = parseKPIResults(rows);

    // Invalid values should parse as 0
    expect(result.collectionsRaw.calls).toBe(0);
    expect(result.collectionsRaw.connects).toBe(0);
    expect(result.collectionsRaw.rpcs).toBe(50);
    expect(result.collectionsRaw.promises).toBe(0);
  });

  it('aggregates multiple rows with same model/direction', () => {
    const rows: RawKPIRow[] = [
      {
        model: 'collections',
        direction: 'outbound',
        accounts: '100',
        calls: '500',
        connects: '200',
        rpcs: '80',
        promises: '40',
        cash_payments: '20',
        transfers: '10',
        duration_minutes: '1500',
        completed_verifications: '0',
      },
      {
        model: 'collections',
        direction: 'outbound',
        accounts: '100',
        calls: '300',
        connects: '120',
        rpcs: '50',
        promises: '25',
        cash_payments: '15',
        transfers: '8',
        duration_minutes: '900',
        completed_verifications: '0',
      },
    ];

    const result = parseKPIResults(rows);

    // Should aggregate both rows
    expect(result.collectionsRaw.calls).toBe(800);
    expect(result.collectionsRaw.connects).toBe(320);
    expect(result.collectionsRaw.rpcs).toBe(130);
    expect(result.collectionsRaw.promises).toBe(65);
    expect(result.collectionsRaw.cashPayments).toBe(35);
  });
});

describe('PeriodKPIs Summing', () => {
  function sumPeriodKPIs(
    a: { calls: number; connects: number; rpcs: number; promises: number },
    b: { calls: number; connects: number; rpcs: number; promises: number }
  ) {
    return {
      calls: a.calls + b.calls,
      connects: a.connects + b.connects,
      rpcs: a.rpcs + b.rpcs,
      promises: a.promises + b.promises,
    };
  }

  it('sums two KPI sets correctly', () => {
    const a = { calls: 1000, connects: 400, rpcs: 200, promises: 100 };
    const b = { calls: 500, connects: 200, rpcs: 100, promises: 50 };

    const result = sumPeriodKPIs(a, b);

    expect(result.calls).toBe(1500);
    expect(result.connects).toBe(600);
    expect(result.rpcs).toBe(300);
    expect(result.promises).toBe(150);
  });

  it('handles zero values', () => {
    const a = { calls: 1000, connects: 400, rpcs: 200, promises: 100 };
    const b = { calls: 0, connects: 0, rpcs: 0, promises: 0 };

    const result = sumPeriodKPIs(a, b);

    expect(result.calls).toBe(1000);
    expect(result.connects).toBe(400);
    expect(result.rpcs).toBe(200);
    expect(result.promises).toBe(100);
  });
});

describe('Historical Trends', () => {
  // Helper to get month range for historical data
  function getMonthsRange(numMonths: number, endDate: Date = new Date()): string[] {
    const months: string[] = [];
    for (let i = numMonths - 1; i >= 0; i--) {
      const date = new Date(endDate.getFullYear(), endDate.getMonth() - i, 1);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      months.push(`${year}-${month}`);
    }
    return months;
  }

  // Helper to format month for display
  function formatMonthLabel(monthStr: string): string {
    const [year, month] = monthStr.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, 1);
    return date.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
  }

  // Safe divide helper
  function safeDivide(numerator: number, denominator: number): number {
    if (denominator === 0) return 0;
    return numerator / denominator;
  }

  // Calculate trend point metrics
  function calculateTrendPoint(rawData: {
    calls: number;
    connects: number;
    rpcs: number;
    promises: number;
    cashPayments: number;
  }) {
    return {
      calls: rawData.calls,
      connects: rawData.connects,
      connectRate: safeDivide(rawData.connects, rawData.calls) * 100,
      rpcs: rawData.rpcs,
      rpcRate: safeDivide(rawData.rpcs, rawData.connects) * 100,
      promises: rawData.promises,
      promisesPerRpc: safeDivide(rawData.promises, rawData.rpcs) * 100,
      cashPayments: rawData.cashPayments,
      cashPerRpc: safeDivide(rawData.cashPayments, rawData.rpcs) * 100,
    };
  }

  describe('getMonthsRange', () => {
    it('generates correct number of months', () => {
      const endDate = new Date(2024, 11, 15); // Dec 2024
      const months = getMonthsRange(6, endDate);

      expect(months).toHaveLength(6);
    });

    it('generates months in chronological order', () => {
      const endDate = new Date(2024, 11, 15); // Dec 2024
      const months = getMonthsRange(6, endDate);

      expect(months[0]).toBe('2024-07'); // July first
      expect(months[5]).toBe('2024-12'); // December last
    });

    it('handles year boundaries correctly', () => {
      const endDate = new Date(2025, 1, 15); // Feb 2025
      const months = getMonthsRange(6, endDate);

      expect(months[0]).toBe('2024-09'); // Sep 2024
      expect(months[5]).toBe('2025-02'); // Feb 2025
    });

    it('generates 12 months correctly', () => {
      const endDate = new Date(2024, 11, 15); // Dec 2024
      const months = getMonthsRange(12, endDate);

      expect(months).toHaveLength(12);
      expect(months[0]).toBe('2024-01'); // Jan 2024
      expect(months[11]).toBe('2024-12'); // Dec 2024
    });

    it('generates 18 months correctly with year boundaries', () => {
      const endDate = new Date(2024, 5, 15); // Jun 2024
      const months = getMonthsRange(18, endDate);

      expect(months).toHaveLength(18);
      expect(months[0]).toBe('2023-01'); // Jan 2023
      expect(months[17]).toBe('2024-06'); // Jun 2024
    });
  });

  describe('formatMonthLabel', () => {
    it('formats month correctly', () => {
      expect(formatMonthLabel('2024-01')).toBe('Jan 24');
      expect(formatMonthLabel('2024-12')).toBe('Dec 24');
    });

    it('formats different years correctly', () => {
      expect(formatMonthLabel('2023-06')).toBe('Jun 23');
      expect(formatMonthLabel('2025-03')).toBe('Mar 25');
    });
  });

  describe('calculateTrendPoint', () => {
    it('calculates rates correctly for valid data', () => {
      const rawData = {
        calls: 1000,
        connects: 300,
        rpcs: 120,
        promises: 60,
        cashPayments: 30,
      };

      const result = calculateTrendPoint(rawData);

      expect(result.calls).toBe(1000);
      expect(result.connects).toBe(300);
      expect(result.connectRate).toBe(30); // 300/1000 * 100
      expect(result.rpcs).toBe(120);
      expect(result.rpcRate).toBe(40); // 120/300 * 100
      expect(result.promises).toBe(60);
      expect(result.promisesPerRpc).toBe(50); // 60/120 * 100
      expect(result.cashPayments).toBe(30);
      expect(result.cashPerRpc).toBe(25); // 30/120 * 100
    });

    it('handles zero values gracefully', () => {
      const rawData = {
        calls: 0,
        connects: 0,
        rpcs: 0,
        promises: 0,
        cashPayments: 0,
      };

      const result = calculateTrendPoint(rawData);

      expect(result.connectRate).toBe(0);
      expect(result.rpcRate).toBe(0);
      expect(result.promisesPerRpc).toBe(0);
      expect(result.cashPerRpc).toBe(0);
    });

    it('handles perfect conversion rates', () => {
      const rawData = {
        calls: 100,
        connects: 100,
        rpcs: 100,
        promises: 100,
        cashPayments: 100,
      };

      const result = calculateTrendPoint(rawData);

      expect(result.connectRate).toBe(100);
      expect(result.rpcRate).toBe(100);
      expect(result.promisesPerRpc).toBe(100);
      expect(result.cashPerRpc).toBe(100);
    });
  });

  describe('Trend Data Structure', () => {
    interface MonthlyTrendPoint {
      month: string;
      label: string;
      collections: {
        calls: number;
        connects: number;
        connectRate: number;
        rpcs: number;
        rpcRate: number;
        promises: number;
        promisesPerRpc: number;
        cashPayments: number;
        cashPerRpc: number;
      };
      inbound: {
        calls: number;
        connects: number;
        connectRate: number;
        rpcs: number;
        rpcRate: number;
        promises: number;
        cashPayments: number;
      };
    }

    function createMockTrendPoint(month: string): MonthlyTrendPoint {
      return {
        month,
        label: formatMonthLabel(month),
        collections: {
          calls: 5000,
          connects: 1500,
          connectRate: 30,
          rpcs: 600,
          rpcRate: 40,
          promises: 300,
          promisesPerRpc: 50,
          cashPayments: 150,
          cashPerRpc: 25,
        },
        inbound: {
          calls: 1000,
          connects: 800,
          connectRate: 80,
          rpcs: 600,
          rpcRate: 75,
          promises: 400,
          cashPayments: 250,
        },
      };
    }

    it('has required fields for collections', () => {
      const point = createMockTrendPoint('2024-11');

      expect(point.collections).toHaveProperty('calls');
      expect(point.collections).toHaveProperty('connects');
      expect(point.collections).toHaveProperty('connectRate');
      expect(point.collections).toHaveProperty('rpcs');
      expect(point.collections).toHaveProperty('rpcRate');
      expect(point.collections).toHaveProperty('promises');
      expect(point.collections).toHaveProperty('promisesPerRpc');
      expect(point.collections).toHaveProperty('cashPayments');
      expect(point.collections).toHaveProperty('cashPerRpc');
    });

    it('has required fields for inbound', () => {
      const point = createMockTrendPoint('2024-11');

      expect(point.inbound).toHaveProperty('calls');
      expect(point.inbound).toHaveProperty('connects');
      expect(point.inbound).toHaveProperty('connectRate');
      expect(point.inbound).toHaveProperty('rpcs');
      expect(point.inbound).toHaveProperty('rpcRate');
      expect(point.inbound).toHaveProperty('promises');
      expect(point.inbound).toHaveProperty('cashPayments');
    });

    it('month and label are properly formatted', () => {
      const point = createMockTrendPoint('2024-11');

      expect(point.month).toBe('2024-11');
      expect(point.label).toBe('Nov 24');
    });

    it('can aggregate trend data for totals', () => {
      const months = ['2024-10', '2024-11', '2024-12'].map(createMockTrendPoint);

      const totals = months.reduce(
        (acc, point) => ({
          calls: acc.calls + point.collections.calls + point.inbound.calls,
          promises: acc.promises + point.collections.promises + point.inbound.promises,
        }),
        { calls: 0, promises: 0 }
      );

      // 3 months * (5000 + 1000) calls each
      expect(totals.calls).toBe(18000);
      // 3 months * (300 + 400) promises each
      expect(totals.promises).toBe(2100);
    });
  });
});
