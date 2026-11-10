import * as React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  Calendar,
  RefreshCw,
  Unlink,
  CheckCircle2,
  AlertCircle,
  ExternalLink,
  ShieldCheck,
  Clock,
} from 'lucide-react';
import { settingsApi } from './api';
import { formatDate, formatRelativeTime } from '../../lib/dates';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { GoogleSyncMode } from '../../types/api';

export const GoogleCalendarCard: React.FC = () => {
  const queryClient = useQueryClient();
  const [showDisconnectModal, setShowDisconnectModal] = React.useState(false);
  const [removeEventsOnDisconnect, setRemoveEventsOnDisconnect] = React.useState(false);

  const { data: status, isLoading, error } = useQuery({
    queryKey: ['googleStatus'],
    queryFn: () => settingsApi.getGoogleStatus(),
  });

  // Connect mutation
  const connectMutation = useMutation({
    mutationFn: () => settingsApi.getGoogleAuthUrl('web'),
    onSuccess: (data) => {
      window.location.href = data.url;
    },
    onError: () => {
      toast.error('Failed to initiate Google Calendar connection');
    },
  });

  // Sync Now mutation
  const syncNowMutation = useMutation({
    mutationFn: () => settingsApi.syncGoogleNow(),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['googleStatus'] });
      toast.success(`Synced ${res.syncedCount} events to Google Calendar`);
    },
    onError: () => {
      toast.error('Failed to sync to Google Calendar');
    },
  });

  // Disconnect mutation
  const disconnectMutation = useMutation({
    mutationFn: () => settingsApi.disconnectGoogle(removeEventsOnDisconnect),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleStatus'] });
      toast.success('Disconnected Google Calendar');
      setShowDisconnectModal(false);
    },
    onError: () => {
      toast.error('Failed to disconnect');
    },
  });

  // Update preferences mutation
  const prefMutation = useMutation({
    mutationFn: (prefs: any) => settingsApi.updateGooglePreferences(prefs),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['googleStatus'] });
      toast.success('Preferences saved');
    },
  });

  if (isLoading) {
    return <div className="h-48 rounded-xl border border-border bg-card animate-pulse" />;
  }

  const isConnected = status?.connected;
  const prefs = status?.preferences || {
    mode: 'all' as GoogleSyncMode,
    categories: [],
    priorities: [],
    includeRegistrationDeadlines: true,
  };

  return (
    <div className="rounded-xl border border-border bg-card p-6 space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <Calendar className="h-6 w-6 text-primary" />
            <h3 className="text-lg font-bold text-foreground">Google Calendar Integration</h3>
            {isConnected ? (
              <Badge variant="outline" className="border-emerald-500/40 text-emerald-500 bg-emerald-500/10 text-xs">
                Connected
              </Badge>
            ) : (
              <Badge variant="outline" className="text-muted text-xs">
                Not Connected
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted max-w-lg">
            One-way sync from SyncMate into your personal Google Calendar. Never miss a hackathon deadline or group event.
          </p>
        </div>

        {isConnected ? (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => syncNowMutation.mutate()}
              isLoading={syncNowMutation.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
              <span>Sync now</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDisconnectModal(true)}
              className="text-red-500 hover:text-red-600 hover:bg-red-500/10 border-red-500/20"
            >
              <Unlink className="h-3.5 w-3.5 mr-1.5" />
              <span>Disconnect</span>
            </Button>
          </div>
        ) : (
          <Button
            variant="primary"
            size="sm"
            onClick={() => connectMutation.mutate()}
            isLoading={connectMutation.isPending}
          >
            <span>Connect Google Calendar</span>
            <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
          </Button>
        )}
      </div>

      {isConnected && (
        <>
          {/* Account Details */}
          <div className="p-4 rounded-xl border border-border bg-surface/50 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="text-muted block">Google Account</span>
              <strong className="text-foreground text-sm font-semibold">{status.email}</strong>
            </div>
            <div>
              <span className="text-muted block">Last Synchronized</span>
              <span className="text-foreground font-medium">
                {status.lastSyncAt ? formatRelativeTime(status.lastSyncAt) : 'Never synced'}
              </span>
            </div>
          </div>

          {/* Sync Preferences Mode */}
          <div className="space-y-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted">
              Sync Scope
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {[
                { id: 'all', title: 'All group events', desc: 'Sync everything created by your group' },
                { id: 'assigned_to_me', title: 'Only assigned to me', desc: 'Only sync events you are assigned to' },
                { id: 'categories', title: 'Specific categories', desc: 'Sync events matching your preferred categories' },
                { id: 'none', title: 'Pause sync', desc: 'Temporarily stop syncing new events' },
              ].map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => prefMutation.mutate({ mode: opt.id as GoogleSyncMode })}
                  className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                    prefs.mode === opt.id
                      ? 'border-primary bg-primary/5 ring-1 ring-primary'
                      : 'border-border bg-surface hover:bg-surface/80'
                  }`}
                >
                  <span className="text-xs font-bold text-foreground block">{opt.title}</span>
                  <span className="text-[11px] text-muted block mt-0.5">{opt.desc}</span>
                </button>
              ))}
            </div>

            {/* Additional Options */}
            <div className="pt-2">
              <label className="flex items-center gap-2.5 text-xs font-medium text-foreground cursor-pointer">
                <input
                  type="checkbox"
                  checked={prefs.includeRegistrationDeadlines}
                  onChange={(e) =>
                    prefMutation.mutate({
                      includeRegistrationDeadlines: e.target.checked,
                    })
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                <span>Also add hackathon registration deadlines as all-day events</span>
              </label>
            </div>
          </div>

          {/* Sync Guarantee Notice */}
          <div className="p-3.5 rounded-lg border border-border bg-surface/30 text-xs text-muted flex items-start gap-2.5">
            <ShieldCheck className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              Sync is strictly one-way. Duplicate prevention ensures existing events in Google Calendar are never re-created. Changes made to SyncMate events inside Google Calendar will be overwritten on next reconcile.
            </p>
          </div>
        </>
      )}

      {/* Disconnect Confirmation Modal */}
      {showDisconnectModal && (
        <div className="p-4 rounded-xl border border-red-500/30 bg-red-500/5 space-y-3">
          <h4 className="text-xs font-bold text-red-500">Disconnect Google Calendar?</h4>
          <p className="text-xs text-muted">
            New events created in SyncMate will no longer be added to your Google Calendar.
          </p>

          <label className="flex items-center gap-2 text-xs text-foreground cursor-pointer">
            <input
              type="checkbox"
              checked={removeEventsOnDisconnect}
              onChange={(e) => setRemoveEventsOnDisconnect(e.target.checked)}
              className="rounded border-border text-red-500 focus:ring-red-500"
            />
            <span>Also remove previously synced SyncMate events from my Google Calendar</span>
          </label>

          <div className="flex justify-end gap-2 pt-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowDisconnectModal(false)}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              variant="danger"
              onClick={() => disconnectMutation.mutate()}
              isLoading={disconnectMutation.isPending}
            >
              Confirm Disconnect
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
