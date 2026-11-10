import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { settingsApi } from './api';
import { GoogleSyncMode } from '../../types/api';
import { formatDate } from '../../lib/dates';
import { haptics } from '../../lib/haptics';

export const GoogleSyncScreen: React.FC = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const [isConnecting, setIsConnecting] = useState(false);

  const { data: status, isLoading, refetch } = useQuery({
    queryKey: ['google-status'],
    queryFn: () => settingsApi.getGoogleStatus(),
  });

  const preferencesMutation = useMutation({
    mutationFn: (prefs: any) => settingsApi.updateGooglePreferences(prefs),
    onSuccess: (updated) => {
      haptics.success();
      queryClient.setQueryData(['google-status'], (old: any) => ({
        ...old,
        preferences: updated,
      }));
      Toast.show({ type: 'success', text1: 'Preferences updated' });
    },
  });

  const syncNowMutation = useMutation({
    mutationFn: () => settingsApi.syncGoogleNow(),
    onSuccess: () => {
      haptics.success();
      refetch();
      Toast.show({ type: 'success', text1: 'Sync triggered successfully!' });
    },
  });

  const disconnectMutation = useMutation({
    mutationFn: (removeEvents: boolean) => settingsApi.disconnectGoogle(removeEvents),
    onSuccess: () => {
      haptics.warning();
      refetch();
      Toast.show({ type: 'info', text1: 'Google Calendar disconnected' });
    },
  });

  const handleConnect = async () => {
    setIsConnecting(true);
    try {
      const authUrl = await settingsApi.getGoogleAuthUrl();
      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        'syncmate://integrations'
      );

      if (result.type === 'success') {
        haptics.success();
        await refetch();
        Toast.show({ type: 'success', text1: 'Connected to Google Calendar!' });
      }
    } catch (err: any) {
      Toast.show({ type: 'error', text1: 'Connection failed', text2: err.message });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = () => {
    Alert.alert(
      'Disconnect Google Calendar',
      'Choose whether to keep or remove synced SyncMate events from your Google Calendar.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Keep in Google',
          onPress: () => disconnectMutation.mutate(false),
        },
        {
          text: 'Remove from Google',
          style: 'destructive',
          onPress: () => disconnectMutation.mutate(true),
        },
      ]
    );
  };

  const currentMode = status?.preferences?.mode || 'all';

  const setMode = (mode: GoogleSyncMode) => {
    haptics.light();
    preferencesMutation.mutate({ mode });
  };

  if (isLoading) {
    return (
      <Screen scrollable>
        <Skeleton height={120} style={{ marginVertical: SPACING.md }} />
        <Skeleton height={180} style={{ marginVertical: SPACING.md }} />
      </Screen>
    );
  }

  return (
    <Screen scrollable refreshing={isLoading} onRefresh={refetch}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Google Calendar Sync</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          One-way synchronization from SyncMate to your personal Google Calendar
        </Text>
      </View>

      {!status?.connected ? (
        <Card style={styles.connectCard}>
          <Text style={styles.calendarIcon}>🗓️</Text>
          <Text style={[styles.connectTitle, { color: theme.text }]}>Connect your Calendar</Text>
          <Text style={[styles.connectDesc, { color: theme.muted }]}>
            Events and deadlines from SyncMate will automatically sync to your personal Google Calendar.
            Sync is strictly one-way and never creates duplicates.
          </Text>

          <Button
            title="Connect Google Calendar"
            onPress={handleConnect}
            loading={isConnecting}
            variant="primary"
            size="lg"
            style={styles.connectBtn}
          />
        </Card>
      ) : (
        <>
          <Card style={styles.statusCard}>
            <View style={styles.statusRow}>
              <View>
                <Text style={[styles.statusLabel, { color: '#30A46C' }]}>● CONNECTED</Text>
                <Text style={[styles.emailText, { color: theme.text }]}>{status.email}</Text>
                <Text style={[styles.lastSync, { color: theme.muted }]}>
                  Last synced: {status.lastSyncAt ? formatDate(status.lastSyncAt, 'MMM d, h:mm a') : 'Never'}
                </Text>
              </View>

              <Button
                title="Sync now"
                onPress={() => syncNowMutation.mutate()}
                loading={syncNowMutation.isPending}
                variant="secondary"
                size="sm"
              />
            </View>
          </Card>

          {/* Sync Preferences */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Sync Mode</Text>

          <Card style={styles.optionsCard}>
            {(
              [
                { mode: 'all', label: 'All group events', desc: 'Sync all events created in the group' },
                { mode: 'assigned_to_me', label: 'Only events assigned to me', desc: 'Only sync events where you are in assignees' },
                { mode: 'none', label: 'Pause sync', desc: 'Keep existing events but pause new updates' },
              ] as const
            ).map((opt) => {
              const isSelected = currentMode === opt.mode;
              return (
                <TouchableOpacity
                  key={opt.mode}
                  accessibilityRole="radio"
                  accessibilityState={{ selected: isSelected }}
                  onPress={() => setMode(opt.mode)}
                  style={[styles.radioRow, { borderColor: theme.border }]}
                >
                  <View
                    style={[
                      styles.radioCircle,
                      {
                        borderColor: isSelected ? theme.primary : theme.border,
                        backgroundColor: isSelected ? theme.primary : 'transparent',
                      },
                    ]}
                  />
                  <View style={styles.radioTextContainer}>
                    <Text style={[styles.radioLabel, { color: theme.text }]}>{opt.label}</Text>
                    <Text style={[styles.radioDesc, { color: theme.muted }]}>{opt.desc}</Text>
                  </View>
                </TouchableOpacity>
              );
            })}

            {/* Registration deadlines switch */}
            <View style={[styles.switchRow, { borderTopColor: theme.border }]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchLabel, { color: theme.text }]}>
                  Registration deadlines as all-day events
                </Text>
                <Text style={[styles.switchDesc, { color: theme.muted }]}>
                  Adds hackathon registration close dates to Google Calendar
                </Text>
              </View>
              <Switch
                value={status.preferences?.includeRegistrationDeadlines ?? true}
                onValueChange={(val) => preferencesMutation.mutate({ includeRegistrationDeadlines: val })}
                trackColor={{ false: theme.border, true: theme.primary }}
              />
            </View>
          </Card>

          {/* Disconnect button */}
          <Button
            title="Disconnect Google Calendar"
            onPress={handleDisconnect}
            loading={disconnectMutation.isPending}
            variant="destructive"
            size="md"
            style={styles.disconnectBtn}
          />
        </>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 4,
    lineHeight: 20,
  },
  connectCard: {
    padding: SPACING.xl,
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  calendarIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  connectTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  connectDesc: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: SPACING.lg,
  },
  connectBtn: {
    width: '100%',
  },
  statusCard: {
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 2,
  },
  emailText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  lastSync: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  optionsCard: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
  },
  radioCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: SPACING.md,
  },
  radioTextContainer: {
    flex: 1,
  },
  radioLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  radioDesc: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: SPACING.md,
    marginTop: SPACING.xs,
  },
  switchLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  switchDesc: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  disconnectBtn: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
});

