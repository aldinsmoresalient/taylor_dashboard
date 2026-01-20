'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { Sidebar } from './Sidebar';
import { HeaderBar } from './HeaderBar';
import { PerClientView } from './views/PerClientView';
import { ConsolidatedView } from './views/ConsolidatedView';
import { ScorecardView } from './views/ScorecardView';
import { QuickStatsBar } from './ui/QuickStatsBar';
import { ChartsSection, ChartsSectionSkeleton } from './ui/ChartsSection';
import { HistoricalTrendsSection } from './ui/HistoricalTrendsSection';
import { PaymentOutcomesSection } from './ui/PaymentOutcomesSection';
import { DelinquencySection } from './ui/DelinquencySection';
import { ErrorBoundary } from './ui/ErrorBoundary';
import {
  QuickStatsBarSkeleton,
  HistoricalTrendsSkeleton,
  PaymentOutcomesSkeleton,
  DelinquencySkeleton,
} from './ui/Skeletons';
import {
  usePerClientDataWithPeriod,
  useConsolidatedDataWithPeriod,
  useHistoricalTrends,
} from '@/hooks/useKPIData';
import { useDashboardSettings } from '@/hooks/useLocalStorage';
import { useURLState, formatDateForURL, parseDateFromURL } from '@/hooks/useURLState';
import { useDashboardShortcuts } from '@/hooks/useKeyboardShortcuts';
import { getClientDisplayName, getPeriodConfig, formatDateForQuery } from '@/lib/utils';
import type { ViewType, ClientName, ComparisonType } from '@/types';

export function Dashboard() {
  // Load persisted settings from localStorage
  const { settings, updateSetting } = useDashboardSettings();

  // URL state for sharing
  const { urlState, updateURLParam, isInitialized: urlInitialized } = useURLState();

  // Initialize state from URL params (if present) or localStorage
  const [currentView, setCurrentView] = useState<ViewType>(() => {
    return urlState.view || settings.view;
  });
  const [periodType, setPeriodType] = useState<ComparisonType>(() => {
    return urlState.period || settings.periodType;
  });
  const [selectedClient, setSelectedClient] = useState<ClientName | 'all' | 'non-westlake'>(() => {
    return (urlState.client || settings.client) as ClientName | 'all' | 'non-westlake';
  });
  const [referenceDate, setReferenceDate] = useState<Date>(() => {
    if (urlState.date) {
      const parsed = parseDateFromURL(urlState.date);
      if (parsed) return parsed;
    }
    const now = new Date();
    // Default to previous month for monthly view
    return new Date(now.getFullYear(), now.getMonth() - 1, 15);
  });
  const [showCharts, setShowCharts] = useState(settings.showCharts);
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date());

  // Sync all state to URL (consolidated)
  useEffect(() => {
    if (!urlInitialized) return;
    updateURLParam('view', currentView);
    updateURLParam('period', periodType);
    updateURLParam('date', formatDateForURL(referenceDate));
    if (currentView === 'per-client') {
      updateURLParam('client', selectedClient as ClientName);
    }
  }, [currentView, periodType, selectedClient, referenceDate, urlInitialized, updateURLParam]);

  // Persist all settings to localStorage (consolidated)
  useEffect(() => {
    updateSetting('view', currentView);
    updateSetting('periodType', periodType);
    updateSetting('client', selectedClient);
    updateSetting('showCharts', showCharts);
  }, [currentView, periodType, selectedClient, showCharts, updateSetting]);

  // Refresh handler - modifies referenceDate slightly to trigger hooks
  const handleRefresh = useCallback(() => {
    // Create a new Date object to force React to see a change
    setReferenceDate(new Date(referenceDate.getTime()));
  }, [referenceDate]);

  // Handler for period type change - reset reference date appropriately
  const handlePeriodTypeChange = (newPeriodType: ComparisonType) => {
    setPeriodType(newPeriodType);

    // For MTD and WTD, use today's date
    // For MoM, use mid-previous month
    // For WoW, use today (will show current week)
    if (newPeriodType === 'mtd' || newPeriodType === 'wtd') {
      setReferenceDate(new Date());
    } else if (newPeriodType === 'mom') {
      const now = new Date();
      setReferenceDate(new Date(now.getFullYear(), now.getMonth() - 1, 15));
    } else if (newPeriodType === 'wow') {
      setReferenceDate(new Date());
    }
  };

  // Memoize period config for display purposes
  const periodConfig = useMemo(
    () => getPeriodConfig(periodType, referenceDate),
    [periodType, referenceDate]
  );

  // Memoized derived values
  const actualClient = useMemo(
    () => (selectedClient === 'all' || selectedClient === 'non-westlake') ? 'exeter' : selectedClient,
    [selectedClient]
  );

  // Data hooks - use the new period-based hooks
  const perClientData = usePerClientDataWithPeriod(
    actualClient,
    periodType,
    referenceDate
  );

  const consolidatedData = useConsolidatedDataWithPeriod(
    periodType,
    referenceDate,
    currentView === 'client-mix' // excludeWestlake
  );

  // Historical trends for sparklines in QuickStatsBar
  const historicalTrends = useHistoricalTrends(
    currentView === 'per-client' ? actualClient : 'all',
    6, // Last 6 months for sparklines
    currentView === 'client-mix'
  );

  // Memoize derived state to prevent unnecessary recalculations
  const title = useMemo(() => {
    if (currentView === 'scorecard') {
      return 'Client Scorecard';
    }

    const periodLabel = periodType === 'mom' ? 'Monthly' :
                        periodType === 'wow' ? 'Weekly' :
                        periodType === 'mtd' ? 'MTD' : 'WTD';

    switch (currentView) {
      case 'consolidated':
        return `${periodLabel} KPIs`;
      case 'client-mix':
        return `${periodLabel} KPIs (Excl. Westlake)`;
      case 'per-client':
        return `${periodLabel} KPIs per Client`;
      default:
        return `${periodLabel} KPIs`;
    }
  }, [periodType, currentView]);

  const currentError = useMemo(
    () => currentView === 'per-client' ? perClientData.error : consolidatedData.error,
    [currentView, perClientData.error, consolidatedData.error]
  );

  const isLoading = useMemo(
    () => currentView === 'per-client' ? perClientData.isLoading : consolidatedData.isLoading,
    [currentView, perClientData.isLoading, consolidatedData.isLoading]
  );

  const quickStatsData = useMemo(
    () => currentView === 'per-client' ? perClientData.data : consolidatedData.data,
    [currentView, perClientData.data, consolidatedData.data]
  );

  // Update lastUpdated when data finishes loading
  useEffect(() => {
    if (!isLoading) {
      setLastUpdated(new Date());
    }
  }, [isLoading]);

  // Period navigation handlers for keyboard shortcuts
  const handlePrevPeriod = useCallback(() => {
    const newDate = new Date(referenceDate);
    if (periodType === 'mom' || periodType === 'mtd') {
      newDate.setMonth(newDate.getMonth() - 1);
    } else {
      newDate.setDate(newDate.getDate() - 7);
    }
    setReferenceDate(newDate);
  }, [referenceDate, periodType]);

  const handleNextPeriod = useCallback(() => {
    const newDate = new Date(referenceDate);
    const today = new Date();
    if (periodType === 'mom' || periodType === 'mtd') {
      newDate.setMonth(newDate.getMonth() + 1);
      if (newDate > today) return;
    } else {
      newDate.setDate(newDate.getDate() + 7);
      if (newDate > today) return;
    }
    setReferenceDate(newDate);
  }, [referenceDate, periodType]);

  // Handler for clicking a client card in scorecard view
  const handleScorecardClientClick = useCallback((client: ClientName) => {
    setSelectedClient(client);
    setCurrentView('per-client');
  }, []);

  // Keyboard shortcuts
  useDashboardShortcuts({
    onRefresh: handleRefresh,
    onToggleCharts: () => setShowCharts((prev) => !prev),
    onNextPeriod: handleNextPeriod,
    onPrevPeriod: handlePrevPeriod,
    onSwitchToConsolidated: () => setCurrentView('consolidated'),
    onSwitchToClientMix: () => setCurrentView('client-mix'),
    onSwitchToPerClient: () => setCurrentView('per-client'),
  });

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <Sidebar currentView={currentView} onViewChange={setCurrentView} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <HeaderBar
          title={title}
          selectedClient={selectedClient}
          onClientChange={setSelectedClient}
          periodType={periodType}
          onPeriodTypeChange={handlePeriodTypeChange}
          referenceDate={referenceDate}
          onReferenceDateChange={setReferenceDate}
          showClientSelector={currentView === 'per-client'}
          showPeriodSelector={currentView !== 'scorecard'}
          lastUpdated={lastUpdated}
          onRefresh={handleRefresh}
          isRefreshing={isLoading}
        />

        {/* Content area */}
        <main className="flex-1 p-6 overflow-auto">
          {/* Scorecard View - renders its own content */}
          {currentView === 'scorecard' && (
            <ErrorBoundary sectionName="Scorecard">
              <ScorecardView onClientClick={handleScorecardClientClick} />
            </ErrorBoundary>
          )}

          {/* Non-scorecard views */}
          {currentView !== 'scorecard' && (
            <>
              {/* Error banner */}
              {currentError && (
                <div className="mb-6 px-4 py-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-sm flex items-center gap-3">
                  <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  <span><strong>Error:</strong> {currentError}</span>
                </div>
              )}

              {/* Quick Stats Bar */}
              {isLoading ? (
                <QuickStatsBarSkeleton />
              ) : quickStatsData && quickStatsData.previousPeriod ? (
                <ErrorBoundary sectionName="Quick Stats">
                  <QuickStatsBar
                    key={`stats-${currentView}-${currentView === 'per-client' ? selectedClient : 'all'}`}
                    currentPeriod={quickStatsData.currentPeriod}
                    previousPeriod={quickStatsData.previousPeriod}
                    comparisonType={periodType}
                    comparisonLabel={periodConfig.comparisonLabel}
                    historicalData={historicalTrends.data?.months}
                  />
                </ErrorBoundary>
              ) : null}

          {/* Charts Section Toggle */}
          <div className="flex items-center justify-between mb-4">
            {/* Per-client view header info */}
            {currentView === 'per-client' && (
              <div className="flex items-center gap-4 text-sm">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Client:</span>
                  <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200">
                    {getClientDisplayName(selectedClient)}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Period:</span>
                  <span className="font-semibold text-gray-800 bg-white px-3 py-1 rounded-lg border border-gray-200">
                    {periodConfig.currentRange.label}
                  </span>
                </div>
              </div>
            )}
            {currentView !== 'per-client' && <div />}

            {/* Charts toggle */}
            <button
              onClick={() => setShowCharts(!showCharts)}
              className="flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 px-3 py-1.5 rounded-lg hover:bg-white border border-transparent hover:border-gray-200 transition-all"
            >
              <svg
                className={`w-4 h-4 transition-transform ${showCharts ? 'rotate-0' : '-rotate-90'}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              {showCharts ? 'Hide Charts' : 'Show Charts'}
            </button>
          </div>

          {/* Charts Section */}
          {showCharts && (
            <ErrorBoundary sectionName="Charts">
              {isLoading ? (
                <ChartsSectionSkeleton />
              ) : quickStatsData && quickStatsData.previousPeriod ? (
                <ChartsSection
                  key={`charts-${currentView}-${currentView === 'per-client' ? selectedClient : 'all'}`}
                  currentPeriod={quickStatsData.currentPeriod}
                  previousPeriod={quickStatsData.previousPeriod}
                  currentLabel={quickStatsData.currentPeriodLabel}
                  previousLabel={quickStatsData.previousPeriodLabel || ''}
                  comparisonType={periodType}
                />
              ) : null}
            </ErrorBoundary>
          )}

          {/* Historical Trends Section */}
          {showCharts && (
            <ErrorBoundary sectionName="Historical Trends">
              <HistoricalTrendsSection
                key={`trends-${currentView}-${currentView === 'per-client' ? selectedClient : 'all'}`}
                client={currentView === 'per-client' ? actualClient : 'all'}
                excludeWestlake={currentView === 'client-mix'}
              />
            </ErrorBoundary>
          )}

          {/* Payment Outcomes and Delinquency Sections */}
          {showCharts && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
              <ErrorBoundary sectionName="Payment Outcomes">
                <PaymentOutcomesSection
                  key={`payment-${currentView}-${currentView === 'per-client' ? selectedClient : 'all'}`}
                  client={currentView === 'per-client' ? actualClient : 'all'}
                  startDate={formatDateForQuery(periodConfig.currentRange.start)}
                  endDate={formatDateForQuery(periodConfig.currentRange.end)}
                  excludeWestlake={currentView === 'client-mix'}
                />
              </ErrorBoundary>
              <ErrorBoundary sectionName="Delinquency">
                <DelinquencySection
                  key={`delinquency-${currentView}-${currentView === 'per-client' ? selectedClient : 'all'}`}
                  client={currentView === 'per-client' ? actualClient : 'all'}
                  startDate={formatDateForQuery(periodConfig.currentRange.start)}
                  endDate={formatDateForQuery(periodConfig.currentRange.end)}
                  excludeWestlake={currentView === 'client-mix'}
                />
              </ErrorBoundary>
            </div>
          )}

          {/* Detail Tables Section Header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-semibold text-gray-800">Detailed Metrics</h2>
          </div>

          {/* View content */}
          {currentView === 'per-client' && (
            <ErrorBoundary sectionName="Per-Client Data">
              <PerClientView
                data={perClientData.data}
                isLoading={perClientData.isLoading}
                comparisonType={periodType}
              />
            </ErrorBoundary>
          )}

          {(currentView === 'consolidated' || currentView === 'client-mix') && (
            <ErrorBoundary sectionName="Consolidated Data">
              <ConsolidatedView
                data={consolidatedData.data}
                isLoading={consolidatedData.isLoading}
                comparisonType={periodType}
              />
            </ErrorBoundary>
          )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
