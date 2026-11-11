import * as React from 'react';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import {
  ESTIMATED_COLD_START_SECONDS,
  formatElapsedTimer,
  startServerWarmup,
  useServerStatusStore,
} from '../../lib/serverStatus';

export interface ServerWakeupBannerProps {
  className?: string;
}

export const ServerWakeupBanner: React.FC<ServerWakeupBannerProps> = ({ className = '' }) => {
  const status = useServerStatusStore((s) => s.status);
  const elapsedSeconds = useServerStatusStore((s) => s.elapsedSeconds);
  const hasAcceptedFirstRequest = useServerStatusStore((s) => s.hasAcceptedFirstRequest);
  const lastError = useServerStatusStore((s) => s.lastError);

  if (status === 'idle') {
    return null;
  }

  if (hasAcceptedFirstRequest || status === 'ready') {
    return (
      <div
        className={`rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-2.5 text-xs flex items-center justify-between gap-2 ${className}`}
      >
        <div className="flex items-center gap-2 text-emerald-400 font-medium">
          <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
          <span>
            {elapsedSeconds >= 2
              ? `Server connected (${elapsedSeconds}s wake-up)`
              : 'Server online • Ready'}
          </span>
        </div>
        <span className="font-mono text-[10px] text-emerald-400/80">LIVE</span>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div
        className={`rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-xs space-y-2 ${className}`}
      >
        <div className="flex items-start gap-2 text-red-400">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold">Server wake-up timed out</p>
            <p className="text-[11px] text-red-300/90 mt-0.5">
              {lastError || 'Render free tier is still starting up.'}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void startServerWarmup(true)}
          className="inline-flex items-center gap-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/30 px-2.5 py-1 text-[11px] font-semibold text-red-300 transition-colors cursor-pointer"
        >
          <RefreshCw className="h-3 w-3" />
          <span>Retry connection</span>
        </button>
      </div>
    );
  }

  const isColdStart = elapsedSeconds >= 2;
  const progressPct = Math.min(
    95,
    Math.max(6, Math.round((elapsedSeconds / ESTIMATED_COLD_START_SECONDS) * 100))
  );

  return (
    <div
      className={`rounded-xl border p-3.5 text-xs space-y-2.5 transition-colors ${
        isColdStart
          ? 'border-amber-500/35 bg-amber-500/10 text-amber-300'
          : 'border-[#222E3C] bg-[#0E151D] text-muted'
      } ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 font-semibold">
          <Clock className={`h-3.5 w-3.5 shrink-0 ${isColdStart ? 'animate-pulse text-amber-400' : 'text-primary'}`} />
          <span className={isColdStart ? 'text-amber-300' : 'text-foreground'}>
            {isColdStart ? 'Waking up Render server...' : 'Connecting to server...'}
          </span>
        </div>

        <span
          data-testid="server-wakeup-timer"
          className={`font-mono text-[11px] font-bold px-2 py-0.5 rounded-md border ${
            isColdStart
              ? 'bg-amber-500/20 border-amber-500/30 text-amber-200'
              : 'bg-[#161F28] border-[#222E3C] text-foreground'
          }`}
        >
          {formatElapsedTimer(elapsedSeconds)}
        </span>
      </div>

      {isColdStart && (
        <>
          <p className="text-[11px] leading-relaxed text-amber-200/85">
            Render free tier sleeps after 15m of inactivity. Waiting for the first request to be accepted (~30–50s)...
          </p>
          <div className="h-1.5 w-full rounded-full bg-amber-950/60 overflow-hidden">
            <div
              className="h-full rounded-full bg-amber-400 transition-all duration-700 ease-out"
              style={{ width: `${progressPct}%` }}
            />
          </div>
        </>
      )}
    </div>
  );
};
