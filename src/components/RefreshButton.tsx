import React from 'react';
import { useRefresh } from '../context/RefreshContext';
import { RefreshCw, CheckCircle2, Clock } from 'lucide-react';

interface RefreshButtonProps {
  variant?: 'header' | 'compact' | 'badge' | 'outline';
  className?: string;
  label?: string;
}

export default function RefreshButton({
  variant = 'header',
  className = '',
  label = 'Segarkan Data',
}: RefreshButtonProps) {
  const { isRefreshing, lastRefreshedAt, triggerRefresh } = useRefresh();

  const formatTime = (date: Date | null) => {
    if (!date) return '--:--';
    return date.toLocaleTimeString('id-ID', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  if (variant === 'outline') {
    return (
      <button
        type="button"
        onClick={() => triggerRefresh()}
        disabled={isRefreshing}
        title="Segarkan data tanpa reload halaman"
        className={`inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white border border-white/20 px-3.5 py-2 rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 active:scale-95 ${className}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-sky-400' : 'text-slate-200'}`} />
        <span>{isRefreshing ? 'Menyegarkan...' : label}</span>
      </button>
    );
  }

  if (variant === 'compact') {
    return (
      <button
        type="button"
        onClick={() => triggerRefresh()}
        disabled={isRefreshing}
        title="Segarkan data tanpa reload halaman"
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all border shadow-2xs ${
          isRefreshing
            ? 'bg-blue-50 text-blue-700 border-blue-200 cursor-wait'
            : 'bg-white hover:bg-slate-50 text-slate-700 border-slate-200 hover:border-slate-300 active:scale-95'
        } ${className}`}
      >
        <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-blue-600' : 'text-slate-600'}`} />
        <span>{isRefreshing ? 'Menyegarkan...' : label}</span>
      </button>
    );
  }

  if (variant === 'badge') {
    return (
      <button
        type="button"
        onClick={() => triggerRefresh()}
        disabled={isRefreshing}
        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
          isRefreshing
            ? 'bg-blue-50 text-blue-700 border-blue-300'
            : 'bg-slate-100 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border-slate-200'
        } ${className}`}
      >
        <RefreshCw className={`w-3 h-3 ${isRefreshing ? 'animate-spin text-blue-600' : ''}`} />
        <span>{isRefreshing ? 'Sinkron...' : `Sinkron ${formatTime(lastRefreshedAt)}`}</span>
      </button>
    );
  }

  // Default: 'header' variant
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <button
        type="button"
        onClick={() => triggerRefresh()}
        disabled={isRefreshing}
        title="Klik untuk menyegarkan data tanpa reload tab browser"
        className={`group flex items-center gap-2 px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl text-xs font-bold transition-all border shadow-xs active:scale-95 ${
          isRefreshing
            ? 'bg-blue-50 text-blue-700 border-blue-300 cursor-wait ring-2 ring-blue-400/20'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white border-transparent shadow-blue-500/20'
        }`}
      >
        <RefreshCw
          className={`w-3.5 h-3.5 transition-transform ${
            isRefreshing ? 'animate-spin text-blue-600' : 'group-hover:rotate-180 duration-500'
          }`}
        />
        <span className="hidden xs:inline">
          {isRefreshing ? 'Menyinkronkan...' : label}
        </span>
      </button>

      {lastRefreshedAt && (
        <div className="hidden lg:flex items-center gap-1 px-2.5 py-1 bg-slate-100/80 rounded-lg text-[11px] text-slate-500 font-medium border border-slate-200/60" title="Waktu sinkronisasi data terakhir">
          <Clock className="w-3 h-3 text-slate-400" />
          <span>{formatTime(lastRefreshedAt)}</span>
        </div>
      )}
    </div>
  );
}
