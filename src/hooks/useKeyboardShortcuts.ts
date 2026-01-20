'use client';

import { useEffect, useCallback } from 'react';

interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  shift?: boolean;
  alt?: boolean;
  action: () => void;
  description: string;
}

/**
 * Hook for handling keyboard shortcuts
 */
export function useKeyboardShortcuts(shortcuts: ShortcutConfig[]) {
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      // Ignore if user is typing in an input
      const target = event.target as HTMLElement;
      if (
        target.tagName === 'INPUT' ||
        target.tagName === 'TEXTAREA' ||
        target.tagName === 'SELECT' ||
        target.isContentEditable
      ) {
        return;
      }

      for (const shortcut of shortcuts) {
        const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;

        if (keyMatch && ctrlMatch && shiftMatch && altMatch) {
          event.preventDefault();
          shortcut.action();
          return;
        }
      }
    },
    [shortcuts]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return shortcuts;
}

/**
 * Dashboard-specific keyboard shortcuts
 */
export function useDashboardShortcuts({
  onRefresh,
  onToggleCharts,
  onNextPeriod,
  onPrevPeriod,
  onSwitchToConsolidated,
  onSwitchToPerClient,
  onSwitchToClientMix,
}: {
  onRefresh?: () => void;
  onToggleCharts?: () => void;
  onNextPeriod?: () => void;
  onPrevPeriod?: () => void;
  onSwitchToConsolidated?: () => void;
  onSwitchToPerClient?: () => void;
  onSwitchToClientMix?: () => void;
}) {
  const shortcuts: ShortcutConfig[] = [];

  if (onRefresh) {
    shortcuts.push({
      key: 'r',
      action: onRefresh,
      description: 'Refresh data',
    });
  }

  if (onToggleCharts) {
    shortcuts.push({
      key: 'c',
      action: onToggleCharts,
      description: 'Toggle charts',
    });
  }

  if (onNextPeriod) {
    shortcuts.push({
      key: 'ArrowRight',
      action: onNextPeriod,
      description: 'Next period',
    });
  }

  if (onPrevPeriod) {
    shortcuts.push({
      key: 'ArrowLeft',
      action: onPrevPeriod,
      description: 'Previous period',
    });
  }

  if (onSwitchToConsolidated) {
    shortcuts.push({
      key: '1',
      action: onSwitchToConsolidated,
      description: 'Consolidated view',
    });
  }

  if (onSwitchToClientMix) {
    shortcuts.push({
      key: '2',
      action: onSwitchToClientMix,
      description: 'Client Mix view',
    });
  }

  if (onSwitchToPerClient) {
    shortcuts.push({
      key: '3',
      action: onSwitchToPerClient,
      description: 'Per Client view',
    });
  }

  useKeyboardShortcuts(shortcuts);

  return shortcuts;
}
