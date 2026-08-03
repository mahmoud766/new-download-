import React from 'react';
import { motion } from 'motion/react';
import { Loader2, Zap, HardDrive, Gauge, Clock, CheckCircle2, AlertCircle, X } from 'lucide-react';

export interface DownloadProgressBarProps {
  percent: number;
  speedMbps?: number;
  loadedMb?: number | string;
  totalMb?: number | string;
  statusText?: string;
  etaSeconds?: number;
  isCompleted?: boolean;
  isError?: boolean;
  errorMessage?: string;
  onCancel?: () => void;
  className?: string;
  showDetails?: boolean;
  compact?: boolean;
}

export const DownloadProgressBar: React.FC<DownloadProgressBarProps> = ({
  percent,
  speedMbps = 0,
  loadedMb,
  totalMb,
  statusText = 'Downloading...',
  etaSeconds,
  isCompleted = false,
  isError = false,
  errorMessage,
  onCancel,
  className = '',
  showDetails = true,
  compact = false,
}) => {
  // Clamp percent between 0 and 100
  const currentPercent = Math.min(100, Math.max(0, Math.round(percent)));

  const formatEta = (seconds?: number) => {
    if (seconds === undefined || seconds < 0 || !isFinite(seconds)) return '--';
    if (seconds < 60) return `${seconds}s`;
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  if (compact) {
    return (
      <div className={`w-full space-y-1.5 ${className}`}>
        <div className="flex items-center justify-between text-[11px] font-bold">
          <span className="text-slate-300 truncate max-w-[60%]">{statusText}</span>
          <span className="text-indigo-400 font-mono font-black">{currentPercent}%</span>
        </div>
        <div className="w-full h-2 rounded-full bg-slate-900 overflow-hidden relative border border-slate-800 shadow-inner">
          <motion.div
            className={`h-full rounded-full transition-all ${
              isCompleted
                ? 'bg-emerald-500 shadow-md shadow-emerald-500/40'
                : isError
                ? 'bg-rose-500'
                : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400'
            }`}
            initial={{ width: 0 }}
            animate={{ width: `${Math.max(3, currentPercent)}%` }}
            transition={{ type: 'spring', damping: 25, stiffness: 180 }}
          />
        </div>
      </div>
    );
  }

  return (
    <div
      className={`w-full p-3.5 rounded-2xl bg-slate-950/80 border transition-all ${
        isCompleted
          ? 'border-emerald-500/40 bg-emerald-950/20 shadow-lg shadow-emerald-500/10'
          : isError
          ? 'border-rose-500/40 bg-rose-950/20'
          : 'border-indigo-500/30 shadow-xl shadow-indigo-500/5'
      } ${className}`}
    >
      {/* Top Header Row */}
      <div className="flex items-center justify-between gap-3 text-xs font-bold mb-2.5">
        <div className="flex items-center gap-2 text-slate-200 truncate">
          {isCompleted ? (
            <div className="p-1 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 shrink-0">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          ) : isError ? (
            <div className="p-1 rounded-full bg-rose-500/20 text-rose-400 border border-rose-500/40 shrink-0">
              <AlertCircle className="w-4 h-4" />
            </div>
          ) : (
            <Loader2 className="w-4 h-4 animate-spin text-amber-400 shrink-0" />
          )}
          <span className="truncate font-semibold text-slate-100">
            {isCompleted
              ? 'Download Completed Successfully!'
              : isError
              ? errorMessage || 'Download Failed'
              : statusText}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {/* Speed badge */}
          {!isCompleted && !isError && speedMbps > 0 && (
            <div className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-mono text-[11px] font-extrabold animate-pulse">
              <Zap className="w-3 h-3 text-emerald-400 fill-emerald-400" />
              <span>{speedMbps} MB/s</span>
            </div>
          )}

          {/* Percentage Badge */}
          <span
            className={`font-mono font-black text-xs px-2 py-0.5 rounded-md border ${
              isCompleted
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                : isError
                ? 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                : 'bg-amber-400/10 text-amber-300 border-amber-400/25'
            }`}
          >
            {currentPercent}%
          </span>

          {onCancel && !isCompleted && (
            <button
              onClick={onCancel}
              className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
              title="Cancel Download"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Main Smooth Progress Bar Container */}
      <div className="relative w-full h-3.5 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800 shadow-inner">
        {/* Animated Fill Bar */}
        <motion.div
          className={`h-full rounded-full relative overflow-hidden transition-all ${
            isCompleted
              ? 'bg-gradient-to-r from-emerald-500 to-teal-400 shadow-lg shadow-emerald-500/50'
              : isError
              ? 'bg-gradient-to-r from-rose-600 to-red-500'
              : 'bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 shadow-md shadow-emerald-500/30'
          }`}
          initial={{ width: '0%' }}
          animate={{ width: `${Math.max(2, currentPercent)}%` }}
          transition={{ ease: 'easeOut', duration: 0.2 }}
        >
          {/* Shimmer / Pulse Overlay Effect for active download */}
          {!isCompleted && !isError && (
            <div className="absolute inset-0 w-full h-full bg-[linear-gradient(90deg,transparent_0%,rgba(255,255,255,0.35)_50%,transparent_100%)] animate-[shimmer_1.5s_infinite]" />
          )}

          {/* Leading Glow Head Dot */}
          {!isCompleted && !isError && currentPercent > 5 && (
            <div className="absolute right-0 top-0 bottom-0 w-2.5 bg-white rounded-full blur-[1px] shadow-[0_0_8px_#ffffff]" />
          )}
        </motion.div>
      </div>

      {/* Extended Telemetry Details (Loaded MB / Speed / ETA) */}
      {showDetails && !isError && (
        <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium pt-2 flex-wrap gap-2">
          <div className="flex items-center gap-1.5 text-slate-200 font-mono">
            <HardDrive className="w-3.5 h-3.5 text-indigo-400" />
            <span>
              {loadedMb ?? '0'} MB {totalMb ? `/ ${totalMb} MB` : ''}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {speedMbps > 0 && (
              <div className="flex items-center gap-1 text-slate-300 font-mono bg-slate-900/90 px-2.5 py-0.5 rounded-md border border-slate-800">
                <Gauge className="w-3.5 h-3.5 text-sky-400" />
                <span>
                  Speed: <strong className="text-emerald-400">{speedMbps} MB/s</strong>
                </span>
              </div>
            )}

            {etaSeconds !== undefined && etaSeconds > 0 && !isCompleted && (
              <div className="flex items-center gap-1 text-amber-300 font-mono font-bold bg-amber-400/10 px-2.5 py-0.5 rounded-md border border-amber-400/20">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>ETA: {formatEta(etaSeconds)}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
