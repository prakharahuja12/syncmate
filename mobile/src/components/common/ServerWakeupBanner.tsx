import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Clock, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react-native';
import { useTheme } from '../../theme/useTheme';
import { SPACING, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import {
  ESTIMATED_COLD_START_SECONDS,
  formatElapsedTimer,
  startServerWarmup,
  useServerStatusStore,
} from '../../lib/serverStatus';

export const ServerWakeupBanner: React.FC = () => {
  const { theme } = useTheme();
  const status = useServerStatusStore((s) => s.status);
  const elapsedSeconds = useServerStatusStore((s) => s.elapsedSeconds);
  const hasAcceptedFirstRequest = useServerStatusStore((s) => s.hasAcceptedFirstRequest);
  const lastError = useServerStatusStore((s) => s.lastError);

  if (status === 'idle') {
    return null;
  }

  if (hasAcceptedFirstRequest || status === 'ready') {
    return (
      <View
        style={[
          styles.readyBox,
          {
            backgroundColor: 'rgba(48, 164, 108, 0.12)',
            borderColor: 'rgba(48, 164, 108, 0.35)',
          },
        ]}
      >
        <View style={styles.rowBetween}>
          <View style={styles.rowLeft}>
            <CheckCircle2 size={14} color="#30A46C" />
            <Text style={styles.readyText}>
              {elapsedSeconds >= 2
                ? `Server connected (${elapsedSeconds}s wake-up)`
                : 'Server online • Ready'}
            </Text>
          </View>
          <Text style={styles.readyTag}>LIVE</Text>
        </View>
      </View>
    );
  }

  if (status === 'error') {
    return (
      <View
        style={[
          styles.box,
          {
            backgroundColor: `${theme.destructive}1A`,
            borderColor: theme.destructive,
          },
        ]}
      >
        <View style={styles.rowLeft}>
          <AlertTriangle size={16} color={theme.destructive} />
          <Text style={[styles.titleText, { color: theme.destructive }]}>
            Server wake-up timed out
          </Text>
        </View>
        <Text style={[styles.bodyText, { color: theme.text }]}>
          {lastError || 'Render free tier is still starting up.'}
        </Text>
        <TouchableOpacity
          onPress={() => void startServerWarmup(true)}
          style={[styles.retryBtn, { backgroundColor: `${theme.destructive}26` }]}
          accessibilityRole="button"
        >
          <RefreshCw size={12} color={theme.destructive} />
          <Text style={[styles.retryText, { color: theme.destructive }]}>Retry connection</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const isColdStart = elapsedSeconds >= 2;
  const progressPct = Math.min(
    95,
    Math.max(6, Math.round((elapsedSeconds / ESTIMATED_COLD_START_SECONDS) * 100))
  );
  const accentColor = isColdStart ? '#F5A524' : theme.primary;

  return (
    <View
      style={[
        styles.box,
        {
          backgroundColor: isColdStart ? 'rgba(245, 165, 36, 0.12)' : theme.surface,
          borderColor: isColdStart ? 'rgba(245, 165, 36, 0.35)' : theme.border,
        },
      ]}
    >
      <View style={styles.rowBetween}>
        <View style={styles.rowLeft}>
          <Clock size={14} color={accentColor} />
          <Text style={[styles.titleText, { color: isColdStart ? '#F5A524' : theme.text }]}>
            {isColdStart ? 'Waking up Render server...' : 'Connecting to server...'}
          </Text>
        </View>
        <View
          style={[
            styles.timerBadge,
            {
              backgroundColor: isColdStart ? 'rgba(245, 165, 36, 0.2)' : theme.card,
              borderColor: isColdStart ? 'rgba(245, 165, 36, 0.4)' : theme.border,
            },
          ]}
        >
          <Text style={[styles.timerText, { color: isColdStart ? '#F5A524' : theme.text }]}>
            {formatElapsedTimer(elapsedSeconds)}
          </Text>
        </View>
      </View>

      {isColdStart && (
        <>
          <Text style={[styles.bodyText, { color: theme.muted }]}>
            Render free tier sleeps after 15m of inactivity. Waiting for the first request to be
            accepted (~30–50s)...
          </Text>
          <View style={styles.progressTrack}>
            <View style={[styles.progressFill, { width: `${progressPct}%` }]} />
          </View>
        </>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  readyBox: {
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    marginBottom: SPACING.lg,
  },
  box: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    gap: SPACING.xs,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 1,
  },
  titleText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  bodyText: {
    fontSize: 11,
    lineHeight: 16,
  },
  readyText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    color: '#30A46C',
  },
  readyTag: {
    fontSize: 10,
    fontWeight: '700',
    color: '#30A46C',
  },
  timerBadge: {
    borderWidth: 1,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  timerText: {
    fontSize: 11,
    fontWeight: '700',
  },
  progressTrack: {
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(245, 165, 36, 0.2)',
    overflow: 'hidden',
    marginTop: 4,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#F5A524',
    borderRadius: 3,
  },
  retryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
    marginTop: 4,
  },
  retryText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
});
