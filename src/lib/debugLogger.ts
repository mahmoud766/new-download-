import { ExtractionDebugLog } from '../types';

const DEBUG_LOGS_STORAGE_KEY = 'omnifetch_raw_debug_logs';
const MAX_LOGS = 50;

export function getDebugLogs(): ExtractionDebugLog[] {
  try {
    const raw = localStorage.getItem(DEBUG_LOGS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to parse debug logs from localStorage:', e);
    return [];
  }
}

export function addDebugLog(
  logInput: Omit<ExtractionDebugLog, 'id' | 'timestamp'>
): ExtractionDebugLog {
  const newLog: ExtractionDebugLog = {
    ...logInput,
    id: `log_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };

  try {
    const existing = getDebugLogs();
    const updated = [newLog, ...existing].slice(0, MAX_LOGS);
    localStorage.setItem(DEBUG_LOGS_STORAGE_KEY, JSON.stringify(updated));

    window.dispatchEvent(
      new CustomEvent('omnifetch_debug_logs_updated', {
        detail: { logs: updated, newLog },
      })
    );
  } catch (e) {
    console.error('Failed to save debug log:', e);
  }

  return newLog;
}

export function clearDebugLogs(): void {
  try {
    localStorage.removeItem(DEBUG_LOGS_STORAGE_KEY);
    window.dispatchEvent(
      new CustomEvent('omnifetch_debug_logs_updated', {
        detail: { logs: [], newLog: null },
      })
    );
  } catch (e) {
    console.error('Failed to clear debug logs:', e);
  }
}

export function exportDebugLogsJson(): string {
  const logs = getDebugLogs();
  return JSON.stringify(logs, null, 2);
}
