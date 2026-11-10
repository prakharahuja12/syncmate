import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { PinButton } from '../../components/common/PinButton';
import { ExternalLinkButton } from '../../components/common/ExternalLinkButton';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { EmptyState } from '../../components/ui/EmptyState';
import { dashboardApi } from './api';
import { eventsApi } from '../events/api';
import { formatDate, formatTime, formatRelativeTime, formatDeadlineCountdown } from '../../lib/dates';
import { openExternalLink } from '../../lib/links';
import { haptics } from '../../lib/haptics';
import { EventItem } from '../../types/api';

export const HomeScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const group = useAuthStore((s) => s.group);
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);
  const tapHackathonOpensLink = useUiStore((s) => s.tapHackathonOpensLinkDirectly);

  const { data: dashboard, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard', group?.id],
    queryFn: () => dashboardApi.getDashboard(group!.id),
    enabled: !!group?.id,
  });

  const completeMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.completeEvent(eventId),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.pinEvent(eventId, 'group'),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.unpinEvent(eventId),
    onSuccess: () => {
      haptics.light();
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const handleEventPress = (event: EventItem) => {
    haptics.light();
    const isHack = event.category === 'hackathon' || event.category === 'competition';
    if (tapHackathonOpensLink && isHack && event.primaryUrl) {
      openExternalLink(event.primaryUrl);
    } else {
      navigation.navigate('EventDetails', { eventId: event.id, initialEvent: event });
    }
  };

  if (isLoading && !dashboard) {
    return (
      <Screen scrollable>
        <Skeleton height={60} style={{ marginVertical: SPACING.md }} />
        <Skeleton height={140} style={{ marginVertical: SPACING.md }} />
        <Skeleton height={200} style={{ marginVertical: SPACING.md }} />
      </Screen>
    );
  }

  if (error || !dashboard) {
    return (
      <Screen>
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scrollable refreshing={isLoading} onRefresh={refetch}>
      {/* Header bar: Greeting + Group name + Notification Bell */}
      <View style={styles.headerRow}>
        <View>
          <Text style={[styles.greeting, { color: theme.muted }]}>Hello, {user?.name.split(' ')[0]}</Text>
          <Text style={[styles.groupTitle, { color: theme.text }]}>{group?.name || 'SyncMate'}</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Notifications"
          onPress={() => navigation.navigate('Notifications')}
          style={[styles.bellBtn, { backgroundColor: theme.surface, borderColor: theme.border }]}
        >
          <Text style={styles.bellIcon}>🔔</Text>
          {unreadCount > 0 && (
            <View style={[styles.unreadBadge, { backgroundColor: theme.destructive }]}>
              <Text style={styles.unreadCountText}>
                {unreadCount > 9 ? '9+' : unreadCount}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Stat chips row */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.statsScroll}>
        <View style={[styles.statChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: theme.text }]}>{dashboard.stats.pending}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Pending</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#E5484D' }]}>{dashboard.stats.urgent}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Urgent</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#30A46C' }]}>{dashboard.stats.completed}</Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Completed</Text>
        </View>
        <View style={[styles.statChip, { backgroundColor: theme.surface, borderColor: theme.border }]}>
          <Text style={[styles.statNum, { color: '#8E4EC6' }]}>
            {dashboard.upcomingHackathons.length}
          </Text>
          <Text style={[styles.statLabel, { color: theme.muted }]}>Hackathons</Text>
        </View>
      </ScrollView>

      {/* 1. Next High-Priority Hero Card */}
      {dashboard.nextHighPriority && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Next High Priority</Text>
          <Card
            isUrgent
            onPress={() => handleEventPress(dashboard.nextHighPriority!)}
            style={styles.heroCard}
          >
            <View style={styles.cardTop}>
              <CategoryBadge category={dashboard.nextHighPriority.category} />
              <PriorityBadge priority="high" />
            </View>
            <Text style={[styles.heroTitle, { color: theme.text }]}>
              {dashboard.nextHighPriority.title}
            </Text>
            <Text style={[styles.heroDate, { color: theme.muted }]}>
              {formatDate(dashboard.nextHighPriority.startAt, 'EEEE, MMM d • h:mm a')}
            </Text>
            {dashboard.nextHighPriority.primaryUrl && (
              <ExternalLinkButton
                url={dashboard.nextHighPriority.primaryUrl}
                label="Registration Link"
                variant="primary"
                style={{ marginTop: SPACING.sm }}
              />
            )}
          </Card>
        </View>
      )}

      {/* 2. Today's Timeline */}
      <View style={styles.section}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Today</Text>
          <Text style={[styles.sectionSubtitle, { color: theme.muted }]}>
            {dashboard.today.length} items
          </Text>
        </View>

        {dashboard.today.length === 0 ? (
          <Card style={styles.emptyCard}>
            <Text style={[styles.emptyCardText, { color: theme.muted }]}>
              No events scheduled for today. Enjoy your day!
            </Text>
          </Card>
        ) : (
          dashboard.today.map((event) => (
            <Card key={event.id} onPress={() => handleEventPress(event)} style={styles.eventRowCard}>
              <View style={styles.eventRowHeader}>
                <CategoryBadge category={event.category} />
                <Text style={[styles.eventRowTime, { color: theme.muted }]}>
                  {event.allDay ? 'All Day' : formatTime(event.startAt)}
                </Text>
              </View>
              <Text style={[styles.eventRowTitle, { color: theme.text }]}>{event.title}</Text>
            </Card>
          ))
        )}
      </View>

      {/* 3. Upcoming Hackathons Carousel */}
      {dashboard.upcomingHackathons.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeaderRow}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Upcoming Hackathons</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Saved')}>
              <Text style={{ color: theme.primary, fontSize: TYPOGRAPHY.sm, fontWeight: '600' }}>
                Watchlist ↗
              </Text>
            </TouchableOpacity>
          </View>

          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.carousel}>
            {dashboard.upcomingHackathons.map((hack) => {
              const countdown = formatDeadlineCountdown(hack.hackathon?.registrationClosesAt);
              return (
                <Card
                  key={hack.id}
                  onPress={() => handleEventPress(hack)}
                  style={styles.carouselCard}
                >
                  <View style={styles.carouselCardHeader}>
                    <CategoryBadge category={hack.category} />
                    <PinButton
                      pinSummary={hack.pinSummary}
                      onPin={() => pinMutation.mutate(hack.id)}
                      onUnpin={() => unpinMutation.mutate(hack.id)}
                      size={36}
                    />
                  </View>

                  <Text style={[styles.carouselTitle, { color: theme.text }]} numberOfLines={2}>
                    {hack.title}
                  </Text>

                  {countdown.text ? (
                    <Text style={[styles.countdownText, { color: countdown.isClose ? '#E5484D' : theme.muted }]}>
                      ⏰ {countdown.text}
                    </Text>
                  ) : null}

                  {hack.hackathon?.prizePool && (
                    <Text style={[styles.prizeText, { color: '#30A46C' }]}>
                      🏆 {hack.hackathon.prizePool}
                    </Text>
                  )}

                  {hack.primaryUrl && (
                    <ExternalLinkButton
                      url={hack.primaryUrl}
                      label="Register"
                      variant="primary"
                      style={styles.carouselBtn}
                    />
                  )}
                </Card>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* 4. Important Deadlines */}
      {dashboard.deadlines.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Important Deadlines</Text>
          {dashboard.deadlines.map((dl, idx) => {
            const countdown = formatDeadlineCountdown(dl.deadlineAt);
            return (
              <Card
                key={idx}
                isUrgent={countdown.isClose}
                onPress={() => handleEventPress(dl.event)}
                style={styles.deadlineCard}
              >
                <View style={styles.deadlineRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.deadlineType, { color: theme.muted }]}>
                      {dl.deadlineType === 'registration' ? '📝 REGISTRATION CLOSES' : '🎯 EVENT DEADLINE'}
                    </Text>
                    <Text style={[styles.deadlineTitle, { color: theme.text }]}>{dl.event.title}</Text>
                  </View>
                  <View style={[styles.countdownPill, { backgroundColor: countdown.isClose ? '#E5484D20' : theme.surface }]}>
                    <Text style={[styles.countdownPillText, { color: countdown.isClose ? '#E5484D' : theme.text }]}>
                      {countdown.text || formatDate(dl.deadlineAt, 'MMM d')}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          })}
        </View>
      )}

      {/* 5. High-Priority Tasks */}
      {dashboard.highPriority.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>High Priority Tasks</Text>
          {dashboard.highPriority.map((task) => (
            <Card key={task.id} onPress={() => handleEventPress(task)} style={styles.taskCard}>
              <TouchableOpacity
                accessibilityRole="checkbox"
                onPress={() => completeMutation.mutate(task.id)}
                style={styles.checkboxTouch}
              >
                <View style={[styles.checkCircle, { borderColor: theme.primary }]}>
                  <Text style={{ color: theme.primary, fontSize: 12 }}>✓</Text>
                </View>
              </TouchableOpacity>
              <View style={styles.taskInfo}>
                <Text style={[styles.taskTitle, { color: theme.text }]}>{task.title}</Text>
                <Text style={[styles.taskDue, { color: theme.muted }]}>
                  Due: {formatDate(task.startAt, 'MMM d, h:mm a')}
                </Text>
              </View>
            </Card>
          ))}
        </View>
      )}

      {/* 6. Group Activity Feed */}
      {dashboard.recentActivity.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Recent Activity</Text>
          {dashboard.recentActivity.slice(0, 5).map((act) => (
            <View key={act.id} style={[styles.activityItem, { borderBottomColor: theme.border }]}>
              <Avatar user={act.actor} size={28} />
              <View style={styles.activityContent}>
                <Text style={[styles.activitySummary, { color: theme.text }]}>{act.summary}</Text>
                <Text style={[styles.activityTime, { color: theme.muted }]}>
                  {formatRelativeTime(act.createdAt)}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: SPACING.md,
  },
  greeting: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '500',
  },
  groupTitle: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
  },
  bellBtn: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bellIcon: {
    fontSize: 20,
  },
  unreadBadge: {
    position: 'absolute',
    top: 4,
    right: 4,
    minWidth: 18,
    height: 18,
    borderRadius: 9,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  unreadCountText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700',
  },
  statsScroll: {
    marginVertical: SPACING.sm,
  },
  statChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginRight: SPACING.sm,
    alignItems: 'center',
    minWidth: 90,
  },
  statNum: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '800',
  },
  statLabel: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.xs,
  },
  heroCard: {
    padding: SPACING.lg,
  },
  cardTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  heroTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroDate: {
    fontSize: TYPOGRAPHY.sm,
  },
  emptyCard: {
    padding: SPACING.md,
    alignItems: 'center',
  },
  emptyCardText: {
    fontSize: TYPOGRAPHY.sm,
  },
  eventRowCard: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  eventRowHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  eventRowTime: {
    fontSize: TYPOGRAPHY.xs,
  },
  eventRowTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  carousel: {
    marginVertical: SPACING.xs,
  },
  carouselCard: {
    width: 220,
    padding: SPACING.md,
    marginRight: SPACING.md,
  },
  carouselCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  carouselTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
    minHeight: 40,
    marginBottom: 4,
  },
  countdownText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    marginBottom: 2,
  },
  prizeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    marginBottom: SPACING.sm,
  },
  carouselBtn: {
    width: '100%',
  },
  deadlineCard: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  deadlineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  deadlineType: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  deadlineTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  countdownPill: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: RADIUS.full,
  },
  countdownPillText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  checkboxTouch: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  taskInfo: {
    flex: 1,
    marginLeft: SPACING.sm,
  },
  taskTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  taskDue: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    gap: SPACING.sm,
  },
  activityContent: {
    flex: 1,
  },
  activitySummary: {
    fontSize: TYPOGRAPHY.sm,
  },
  activityTime: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
});

