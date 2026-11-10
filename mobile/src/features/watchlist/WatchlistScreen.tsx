import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { WatchCard } from './WatchCard';
import { watchlistApi } from './api';
import { eventsApi } from '../events/api';
import { ParticipationStatus, WatchlistItem } from '../../types/api';
import { PARTICIPATION_LABELS } from '../../lib/constants';
import { haptics } from '../../lib/haptics';

type Scope = 'all' | 'mine' | 'group';

export const WatchlistScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const currentGroupId = useAuthStore((s) => s.group?.id);

  const [scope, setScope] = useState<Scope>('all');
  const [selectedStatus, setSelectedStatus] = useState<ParticipationStatus | 'all'>('all');
  const [closedCollapsed, setClosedCollapsed] = useState(true);

  const { data: watchlist, isLoading, error, refetch } = useQuery({
    queryKey: ['watchlist', currentGroupId, scope, selectedStatus],
    queryFn: () =>
      watchlistApi.getWatchlist(currentGroupId!, {
        scope,
        status: selectedStatus === 'all' ? undefined : selectedStatus,
      }),
    enabled: !!currentGroupId,
  });

  const statusMutation = useMutation({
    mutationFn: ({ eventId, status }: { eventId: string; status: ParticipationStatus }) =>
      eventsApi.setMyStatus(eventId, status),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      Toast.show({ type: 'success', text1: 'Status updated' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Could not update status', text2: err.message });
    },
  });

  const filterStatusOptions: Array<ParticipationStatus | 'all'> = [
    'all',
    'interested',
    'planning',
    'registered',
    'not_interested',
  ];

  return (
    <Screen scrollable refreshing={isLoading} onRefresh={refetch}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Saved Events</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          Track hackathons & competitions with your team
        </Text>

        <SegmentedControl
          options={[
            { label: 'All', value: 'all' },
            { label: 'Mine', value: 'mine' },
            { label: 'Group', value: 'group' },
          ]}
          selectedValue={scope}
          onValueChange={setScope}
        />

        {/* Status filter chips */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterChipsRow}>
          {filterStatusOptions.map((st) => {
            const isSelected = selectedStatus === st;
            const label = st === 'all' ? 'All Statuses' : PARTICIPATION_LABELS[st];
            return (
              <TouchableOpacity
                key={st}
                accessibilityRole="button"
                onPress={() => {
                  haptics.light();
                  setSelectedStatus(st);
                }}
                style={[
                  styles.filterChip,
                  {
                    backgroundColor: isSelected ? theme.primary : theme.surface,
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: isSelected ? theme.primaryForeground : theme.text },
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {isLoading && !watchlist ? (
        <View style={{ padding: SPACING.md }}>
          <Skeleton height={140} style={{ marginVertical: SPACING.xs }} />
          <Skeleton height={140} style={{ marginVertical: SPACING.xs }} />
        </View>
      ) : error ? (
        <ErrorState onRetry={() => refetch()} />
      ) : watchlist?.open.length === 0 && watchlist?.closed.length === 0 ? (
        <EmptyState
          title="Nothing saved yet"
          description="Save upcoming hackathons from Calendar or Dashboard to coordinate registrations."
          actionTitle="Browse Calendar"
          onAction={() => navigation.navigate('Calendar')}
        />
      ) : (
        <View style={styles.sectionsContainer}>
          {/* Open registrations section */}
          <Text style={[styles.sectionTitle, { color: theme.text }]}>
            Open Registrations ({watchlist?.open.length || 0})
          </Text>

          {watchlist?.open.map((item: WatchlistItem) => (
            <WatchCard
              key={item.id}
              item={item}
              onPress={() =>
                navigation.navigate('EventDetails', { eventId: item.id, initialEvent: item })
              }
              onStatusChange={(status) => statusMutation.mutate({ eventId: item.id, status })}
            />
          ))}

          {/* Closed / Past section */}
          {watchlist?.closed && watchlist.closed.length > 0 && (
            <View style={styles.closedSection}>
              <TouchableOpacity
                accessibilityRole="button"
                onPress={() => {
                  haptics.light();
                  setClosedCollapsed(!closedCollapsed);
                }}
                style={styles.collapseHeader}
              >
                <Text style={[styles.sectionTitle, { color: theme.muted }]}>
                  Past / Closed ({watchlist.closed.length})
                </Text>
                <Text style={{ color: theme.muted, fontSize: 16 }}>
                  {closedCollapsed ? '▼' : '▲'}
                </Text>
              </TouchableOpacity>

              {!closedCollapsed &&
                watchlist.closed.map((item: WatchlistItem) => (
                  <WatchCard
                    key={item.id}
                    item={item}
                    onPress={() =>
                      navigation.navigate('EventDetails', { eventId: item.id, initialEvent: item })
                    }
                    onStatusChange={(status) => statusMutation.mutate({ eventId: item.id, status })}
                  />
                ))}
            </View>
          )}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingVertical: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2,
    marginBottom: SPACING.md,
  },
  filterChipsRow: {
    marginVertical: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    marginRight: SPACING.xs,
    minHeight: 44,
    justifyContent: 'center',
  },
  filterChipText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  sectionsContainer: {
    marginBottom: SPACING.xxl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    marginVertical: SPACING.sm,
  },
  closedSection: {
    marginTop: SPACING.lg,
  },
  collapseHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    minHeight: 44,
  },
});

