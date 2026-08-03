import React, { useState, useEffect } from 'react';
import {
  Terminal,
  X,
  Copy,
  Check,
  Trash2,
  Download,
  Search,
  AlertTriangle,
  CheckCircle2,
  Bug,
  RefreshCw,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  Send,
  Code2,
} from 'lucide-react';
import { ExtractionDebugLog } from '../types';
import { getDebugLogs, clearDebugLogs, exportDebugLogsJson } from '../lib/debugLogger';
import { processVideoFetch } from '../lib/providers';

interface DebugLogsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectUrlForRetry?: (url: string) => void;
}

export function DebugLogsModal({ isOpen, onClose, onSelectUrlForRetry }: DebugLogsModalProps) {
  const [logs, setLogs] = useState<ExtractionDebugLog[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'facebook' | 'failed' | 'success'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);
  const [copiedLogId, setCopiedLogId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [testUrlInput, setTestUrlInput] = useState('');
  const [isTestingUrl, setIsTestingUrl] = useState(false);

  // Load and subscribe to live log updates
  useEffect(() => {
    if (!isOpen) return;

    setLogs(getDebugLogs());

    const handleLogsUpdated = () => {
      setLogs(getDebugLogs());
    };

    window.addEventListener('omnifetch_debug_logs_updated', handleLogsUpdated);
    return () => {
      window.removeEventListener('omnifetch_debug_logs_updated', handleLogsUpdated);
    };
  }, [isOpen]);

  // Handle ESC key to close
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter logs based on active tab & search keyword
  const filteredLogs = logs.filter((log) => {
    // Tab filter
    if (filterTab === 'facebook' && log.platform !== 'facebook' && !log.url.includes('facebook.com') && !log.url.includes('fb.watch')) {
      return false;
    }
    if (filterTab === 'failed' && log.success) {
      return false;
    }
    if (filterTab === 'success' && !log.success) {
      return false;
    }

    // Search filter
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchUrl = log.url.toLowerCase().includes(q);
      const matchErr = log.error?.toLowerCase().includes(q);
      const matchPlatform = log.platform.toLowerCase().includes(q);
      const matchStatus = String(log.httpStatus).includes(q);
      return matchUrl || matchErr || matchPlatform || matchStatus;
    }

    return true;
  });

  const fbFailedCount = logs.filter(
    (l) => !l.success && (l.platform === 'facebook' || l.url.includes('facebook') || l.url.includes('fb.watch'))
  ).length;

  const handleCopyLog = (log: ExtractionDebugLog) => {
    const payload = JSON.stringify(log, null, 2);
    navigator.clipboard.writeText(payload);
    setCopiedLogId(log.id);
    setTimeout(() => setCopiedLogId(null), 2000);
  };

  const handleCopyAll = () => {
    const raw = exportDebugLogsJson();
    navigator.clipboard.writeText(raw);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  };

  const handleDownloadJson = () => {
    const raw = exportDebugLogsJson();
    const blob = new Blob([raw], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnifetch_debug_logs_${new Date().toISOString().replace(/[:.]/g, '-')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRunLiveTest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testUrlInput.trim()) return;

    setIsTestingUrl(true);
    try {
      await processVideoFetch(testUrlInput.trim());
    } catch (err) {
      // Errors will automatically be logged by processVideoFetch
    } finally {
      setIsTestingUrl(false);
      setTestUrlInput('');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-xl animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl max-h-[92vh] flex flex-col rounded-3xl bg-slate-950 border border-indigo-500/40 shadow-2xl shadow-indigo-500/20 overflow-hidden font-sans">
        {/* Top Header Bar */}
        <div className="p-4 sm:p-5 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-indigo-500/20 border border-indigo-500/40 text-indigo-400">
              <Terminal className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                  Backend Extraction Debug Console
                </h2>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold bg-indigo-500/20 border border-indigo-500/30 text-indigo-300">
                  Ctrl + Shift + D
                </span>
              </div>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                Live extraction responses, status codes & diagnostic raw logs for troubleshooting Facebook and multi-platform links
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700 transition"
            title="Close Debug Overlay (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Live Simulation & Quick Test Bar */}
        <div className="p-3 sm:p-4 bg-slate-900/50 border-b border-slate-800/80 shrink-0">
          <form onSubmit={handleRunLiveTest} className="flex flex-col sm:flex-row items-center gap-2">
            <div className="relative w-full flex items-center">
              <Bug className="w-4 h-4 text-purple-400 absolute left-3 pointer-events-none" />
              <input
                type="text"
                value={testUrlInput}
                onChange={(e) => setTestUrlInput(e.target.value)}
                placeholder="Test a URL live in raw debugger (e.g. https://www.facebook.com/watch/?v=1015832...)..."
                className="w-full h-10 pl-9 pr-3 rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:border-indigo-500 transition"
              />
            </div>
            <button
              type="submit"
              disabled={isTestingUrl || !testUrlInput.trim()}
              className="w-full sm:w-auto h-10 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 disabled:opacity-50"
            >
              {isTestingUrl ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Extracting...</span>
                </>
              ) : (
                <>
                  <Send className="w-3.5 h-3.5" />
                  <span>Test URL</span>
                </>
              )}
            </button>
          </form>
        </div>

        {/* Control Bar: Filters & Global Actions */}
        <div className="p-3 sm:p-4 bg-slate-900/30 border-b border-slate-800/80 flex flex-wrap items-center justify-between gap-3 shrink-0">
          {/* Filter Tabs */}
          <div className="flex flex-wrap items-center gap-1.5">
            <button
              onClick={() => setFilterTab('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'all'
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>All Logs</span>
              <span className="px-1.5 py-0.2 bg-slate-950 text-indigo-300 rounded-md font-mono text-[10px]">
                {logs.length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('facebook')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'facebook'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-slate-900 text-blue-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>Facebook</span>
              {fbFailedCount > 0 && (
                <span className="px-1.5 py-0.2 bg-rose-500/30 text-rose-300 rounded-md font-mono text-[10px] font-extrabold border border-rose-500/40">
                  {fbFailedCount} Failures
                </span>
              )}
            </button>

            <button
              onClick={() => setFilterTab('failed')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'failed'
                  ? 'bg-rose-600 text-white shadow-md'
                  : 'bg-slate-900 text-rose-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>Failed Only</span>
              <span className="px-1.5 py-0.2 bg-slate-950 text-rose-300 rounded-md font-mono text-[10px]">
                {logs.filter((l) => !l.success).length}
              </span>
            </button>

            <button
              onClick={() => setFilterTab('success')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                filterTab === 'success'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'bg-slate-900 text-emerald-400 hover:text-white border border-slate-800'
              }`}
            >
              <span>Successes</span>
              <span className="px-1.5 py-0.2 bg-slate-950 text-emerald-300 rounded-md font-mono text-[10px]">
                {logs.filter((l) => l.success).length}
              </span>
            </button>
          </div>

          {/* Search Box & Export Actions */}
          <div className="flex items-center gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search logs..."
                className="w-full h-8 pl-8 pr-2 rounded-lg bg-slate-950 border border-slate-800 text-slate-200 placeholder-slate-500 text-xs focus:outline-none focus:border-indigo-500"
              />
            </div>

            <button
              onClick={handleCopyAll}
              disabled={logs.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 border border-slate-700 disabled:opacity-40"
              title="Copy all logs to clipboard"
            >
              {copiedAll ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span className="hidden sm:inline">{copiedAll ? 'Copied' : 'Copy All'}</span>
            </button>

            <button
              onClick={handleDownloadJson}
              disabled={logs.length === 0}
              className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1 border border-slate-700 disabled:opacity-40"
              title="Export JSON file"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export</span>
            </button>

            <button
              onClick={() => clearDebugLogs()}
              disabled={logs.length === 0}
              className="p-1.5 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 text-xs font-bold transition border border-rose-500/30 disabled:opacity-40"
              title="Clear all debug logs"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Log Entries Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs">
          {filteredLogs.length === 0 ? (
            <div className="py-16 text-center text-slate-500 space-y-2">
              <Code2 className="w-10 h-10 mx-auto text-slate-700 animate-pulse" />
              <p className="font-bold text-slate-400 text-sm">No raw extraction logs captured yet</p>
              <p className="text-xs text-slate-600 max-w-md mx-auto">
                Paste any video link (or test a Facebook URL above) to record real-time raw backend responses, headers, and status codes here.
              </p>
            </div>
          ) : (
            filteredLogs.map((log) => {
              const isExpanded = expandedLogId === log.id;
              const isFb = log.platform === 'facebook' || log.url.includes('facebook') || log.url.includes('fb.watch');

              return (
                <div
                  key={log.id}
                  className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                    log.success
                      ? 'bg-slate-900/80 border-slate-800/80 hover:border-emerald-500/40'
                      : 'bg-rose-950/20 border-rose-500/30 hover:border-rose-500/60'
                  }`}
                >
                  {/* Log Card Header summary */}
                  <div
                    onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                    className="p-3 sm:p-4 flex items-center justify-between gap-3 cursor-pointer select-none hover:bg-slate-900/90 transition"
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <button className="text-slate-500 hover:text-white transition">
                        {isExpanded ? <ChevronDown className="w-4 h-4 text-indigo-400" /> : <ChevronRight className="w-4 h-4" />}
                      </button>

                      {/* Status Badge */}
                      <div
                        className={`px-2 py-0.5 rounded-md font-bold text-[11px] flex items-center gap-1 shrink-0 ${
                          log.success
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {log.success ? (
                          <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        ) : (
                          <AlertTriangle className="w-3 h-3 text-rose-400" />
                        )}
                        <span>{log.httpStatus || 'FAIL'}</span>
                      </div>

                      {/* Platform Badge */}
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase shrink-0 ${
                          isFb
                            ? 'bg-blue-600/30 text-blue-300 border border-blue-500/40'
                            : 'bg-slate-800 text-slate-300 border border-slate-700'
                        }`}
                      >
                        {log.platform}
                      </span>

                      {/* URL text */}
                      <div className="truncate text-slate-200 font-mono text-[11px] flex-1" title={log.url}>
                        {log.url}
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0 text-slate-400 text-[11px]">
                      <span className="hidden sm:inline font-mono text-slate-500">{log.durationMs}ms</span>
                      <span className="font-mono text-slate-500">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                    </div>
                  </div>

                  {/* Log Error Summary Callout if failed */}
                  {!log.success && log.error && (
                    <div className="px-4 py-2 bg-rose-500/10 border-t border-rose-500/20 text-rose-300 text-[11px] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-2 truncate">
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                        <span className="font-semibold truncate">{log.error}</span>
                      </div>
                      {onSelectUrlForRetry && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectUrlForRetry(log.url);
                            onClose();
                          }}
                          className="px-2 py-0.5 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 text-[10px] font-bold border border-rose-500/40 flex items-center gap-1 transition shrink-0"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>Load in Downloader</span>
                        </button>
                      )}
                    </div>
                  )}

                  {/* Expanded Detail Panel */}
                  {isExpanded && (
                    <div className="p-4 bg-slate-950 border-t border-slate-800/80 space-y-3 font-mono text-xs">
                      {/* Diagnostic Breakdown */}
                      {log.debugDetails && (
                        <div>
                          <h4 className="text-[11px] font-bold uppercase text-indigo-400 tracking-wider mb-1.5 flex items-center gap-1.5">
                            <Bug className="w-3.5 h-3.5 text-purple-400" />
                            Backend Diagnostic Debug Info
                          </h4>
                          <pre className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed">
                            {JSON.stringify(log.debugDetails, null, 2)}
                          </pre>
                        </div>
                      )}

                      {/* Raw Response JSON Payload */}
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-1.5">
                          <h4 className="text-[11px] font-bold uppercase text-slate-400 tracking-wider">
                            Full Raw Response Payload
                          </h4>
                          <button
                            onClick={() => handleCopyLog(log)}
                            className="px-2 py-0.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 text-[10px] font-bold transition flex items-center gap-1 border border-slate-700"
                          >
                            {copiedLogId === log.id ? (
                              <Check className="w-3 h-3 text-emerald-400" />
                            ) : (
                              <Copy className="w-3 h-3" />
                            )}
                            <span>{copiedLogId === log.id ? 'Copied' : 'Copy Entry'}</span>
                          </button>
                        </div>

                        <pre className="p-3 rounded-xl bg-slate-900/90 border border-slate-800 text-indigo-200 text-[11px] overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-64">
                          {JSON.stringify(log.rawResponse || log, null, 2)}
                        </pre>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Footer info & shortcut reminder */}
        <div className="p-3 bg-slate-900/90 border-t border-slate-800 text-center text-xs text-slate-500 font-medium flex items-center justify-between px-5">
          <span>
            Showing <strong className="text-slate-300">{filteredLogs.length}</strong> of{' '}
            <strong className="text-slate-300">{logs.length}</strong> raw logs
          </span>
          <span className="hidden sm:inline text-slate-500 text-[11px]">
            Shortcut: <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700">Ctrl</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700">Shift</kbd> + <kbd className="px-1.5 py-0.5 rounded bg-slate-800 text-indigo-300 font-mono border border-slate-700">D</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
