import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { useUiStore } from '../../stores/uiStore';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Card } from '../../components/ui/Card';
import { Avatar } from '../../components/ui/Avatar';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { notificationsApi } from './api';
import { NotificationItem, NotificationType } from '../../types/api';
import { formatRelativeTime } from '../../lib/dates';
import { haptics } from '../../lib/haptics';

const TYPE_ICONS: Record<NotificationType, string> = {
  event_created: '📅',
  event_updated: '✏️',
  event_deleted: '🗑️',
  event_completed: '✅',
  reminder: '⏰',
  registration_deadline: '📝',
  pin_added: '📌',
  status_changed: '👀',
  member_joined: '👋',
  member_left: '🚶',
  google_sync_error: '⚠️',
};

export const NotificationCenterScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const setUnreadCount = useUiStore((s) => s.setUnreadNotificationsCount);
  const [activeTab, setActiveTab] = useState<'all' | 'unread'>('all');

  const { data: notifications = [], isLoading, refetch } = useQuery({
    queryKey: ['notifications', activeTab],
    queryFn: () =>
      notificationsApi.getNotifications(activeTab === 'unread' ? true : undefined),
  });

  const markReadMutation = useMutation({
    mutationFn: (id: string) => notificationsApi.markAsRead(id),
    onSuccess: (_, id) => {
      haptics.light();
      queryClient.setQueryData(['notifications', activeTab], (old: NotificationItem[] = []) =>
        old.map((n) => (n.id === id ? { ...n, readAt: new Date().toISOString() } : n))
      );
      useUiStore.getState().decrementUnreadCount();
    },
  });

  const markAllReadMutation = useMutation({
    mutationFn: () => notificationsApi.markAllAsRead(),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
      setUnreadCount(0);
      Toast.show({ type: 'success', text1: 'All notifications marked as read' });
    },
  });

  const handleNotificationPress = (notif: NotificationItem) => {
    if (!notif.readAt) {
      markReadMutation.mutate(notif.id);
    }

    if (notif.data?.eventId) {
      navigation.navigate('EventDetails', { eventId: notif.data.eventId });
    }
  };

  return (
    <Screen>
      <View style={styles.header}>
        <View style={styles.titleRow}>
          <Text style={[styles.title, { color: theme.text }]}>Notifications</Text>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => markAllReadMutation.mutate()}
            style={styles.markAllBtn}
          >
            <Text style={[styles.markAllText, { color: theme.primary }]}>Mark all as read</Text>
          </TouchableOpacity>
        </View>

        <SegmentedControl
          options={[
            { label: 'All', value: 'all' },
            { label: 'Unread', value: 'unread' },
          ]}
          selectedValue={activeTab}
          onValueChange={setActiveTab}
        />
      </View>

      {isLoading ? (
        <View style={{ padding: SPACING.md }}>
          <Skeleton height={60} style={{ marginVertical: SPACING.xs }} />
          <Skeleton height={60} style={{ marginVertical: SPACING.xs }} />
          <Skeleton height={60} style={{ marginVertical: SPACING.xs }} />
        </View>
      ) : notifications.length === 0 ? (
        <EmptyState
          title={activeTab === 'unread' ? 'No unread notifications' : 'No notifications yet'}
          description="You'll be alerted when group members create events, pin hackathons, or share updates."
        />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          refreshing={isLoading}
          onRefresh={refetch}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const isUnread = !item.readAt;
            const icon = TYPE_ICONS[item.type] || '🔔';

            return (
              <Card
                onPress={() => handleNotificationPress(item)}
                style={styles.notificationCard}
              >
                <View style={styles.iconContainer}>
                  <Text style={styles.typeIcon}>{icon}</Text>
                </View>

                <View style={styles.contentContainer}>
                  <View style={styles.titleRow}>
                    <Text
                      style={[
                        styles.notificationTitle,
                        { color: theme.text, fontWeight: isUnread ? '700' : '500' },
                      ]}
                    >
                      {item.title}
                    </Text>
                    {isUnread && (
                      <View style={[styles.unreadDot, { backgroundColor: theme.primary }]} />
                    )}
                  </View>

                  <Text style={[styles.notificationBody, { color: theme.muted }]}>
                    {item.body}
                  </Text>

                  <View style={styles.metaRow}>
                    {item.actor && <Avatar user={item.actor} size={18} />}
                    <Text style={[styles.timeText, { color: theme.muted }]}>
                      {formatRelativeTime(item.createdAt)}
                    </Text>
                  </View>
                </View>
              </Card>
            );
          }}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
  },
  markAllBtn: {
    minHeight: 44,
    justifyContent: 'center',
  },
  markAllText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  notificationCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  iconContainer: {
    marginRight: SPACING.md,
    marginTop: 2,
  },
  typeIcon: {
    fontSize: 24,
  },
  contentContainer: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: TYPOGRAPHY.sm,
    flex: 1,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 6,
  },
  notificationBody: {
    fontSize: TYPOGRAPHY.xs,
    lineHeight: 18,
    marginVertical: 4,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  timeText: {
    fontSize: TYPOGRAPHY.xs,
  },
});

