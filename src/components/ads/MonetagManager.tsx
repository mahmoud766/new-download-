import React, { useEffect } from 'react';
import { initializeMonetag, getMonetagRuntimeConfig, isAdminContext } from '../../lib/monetag';

interface MonetagManagerProps {
  activeView?: string;
}

/**
 * MonetagManager
 * 
 * Component responsible for single-source-of-truth initialization of Monetag MultiTag.
 * Guarantees:
 * - Fail-Open Application / Fail-Closed Ads: Any error or invalid configuration disables Monetag safely.
 * - Load once across app lifecycle.
 * - Zero duplicate scripts / initializations.
 * - Complete immunity from React StrictMode duplicate calls.
 * - Zero execution / loading in Admin Dashboard.
 * - Zero blocking of main thread / First Paint.
 * - Zero background polling or request storms.
 */
export const MonetagManager: React.FC<MonetagManagerProps> = ({ activeView }) => {
  useEffect(() => {
    // 1. Guard against admin screens
    if (isAdminContext(activeView)) {
      return;
    }

    // 2. Safely trigger single idempotent loader
    const config = getMonetagRuntimeConfig();
    if (config.enabled) {
      initializeMonetag({ activeView, config });
    }

    // 3. Listen for dynamic admin toggles without polling loops
    const handleStatusChange = (e: Event) => {
      const customEvent = e as CustomEvent<{ enabled: boolean }>;
      if (customEvent.detail?.enabled && !isAdminContext(activeView)) {
        initializeMonetag({ activeView, force: true });
      }
    };

    window.addEventListener('omnifetch_monetag_status_changed', handleStatusChange);
    return () => {
      window.removeEventListener('omnifetch_monetag_status_changed', handleStatusChange);
    };
  }, [activeView]);

  return null;
};

