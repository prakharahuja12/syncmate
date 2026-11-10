import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  SectionList,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { RADIUS, SPACING, TYPOGRAPHY, PRIORITY_COLORS } from '../../theme/tokens';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { Input } from '../../components/ui/Input';
import { Card } from '../../components/ui/Card';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { EmptyState } from '../../components/ui/EmptyState';
import { Skeleton } from '../../components/ui/Skeleton';
import { eventsApi } from '../events/api';
import { EventItem, EventPriority } from '../../types/api';
import { formatRelativeTime, computeIsUrgent } from '../../lib/dates';
import { haptics } from '../../lib/haptics';

type TaskTab = 'pending' | 'completed' | 'deadlines';

export const TasksScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const currentGroupId = useAuthStore((s) => s.group?.id);

  const [activeTab, setActiveTab] = useState<TaskTab>('pending');
  const [searchQuery, setSearchQuery] = useState('');

  // Fetch all group events
  const { data: events = [], isLoading, refetch } = useQuery({
    queryKey: ['tasks', currentGroupId],
    queryFn: () =>
      eventsApi.getEvents(currentGroupId!, {
        from: new Date(Date.now() - 30 * 86400000).toISOString(),
        to: new Date(Date.now() + 60 * 86400000).toISOString(),
      }),
    enabled: !!currentGroupId,
  });

  const completeMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.completeEvent(eventId),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Toast.show({ type: 'success', text1: 'Task completed!' });
    },
  });

  const uncompleteMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.uncompleteEvent(eventId),
    onSuccess: () => {
      haptics.medium();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Toast.show({ type: 'info', text1: 'Task restored to pending' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (eventId: string) => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      haptics.warning();
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['events'] });
      Toast.show({ type: 'success', text1: 'Task deleted' });
    },
  });

  const filteredEvents = useMemo(() => {
    return events.filter((e) => {
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (!e.title.toLowerCase().includes(q) && !e.category.toLowerCase().includes(q)) {
          return false;
        }
      }

      if (activeTab === 'pending') {
        return e.status === 'pending';
      }
      if (activeTab === 'completed') {
        return e.status === 'completed';
      }
      if (activeTab === 'deadlines') {
        return e.status === 'pending' && (e.kind === 'deadline' || !!e.hackathon?.registrationClosesAt);
      }
      return true;
    });
  }, [events, activeTab, searchQuery]);

  // Group by priority for SectionList
  const sections = useMemo(() => {
    const high = filteredEvents.filter((e) => e.priority === 'high');
    const medium = filteredEvents.filter((e) => e.priority === 'medium');
    const low = filteredEvents.filter((e) => e.priority === 'low');

    const result = [];
    if (high.length > 0) result.push({ title: 'High Priority', priority: 'high' as EventPriority, data: high });
    if (medium.length > 0) result.push({ title: 'Medium Priority', priority: 'medium' as EventPriority, data: medium });
    if (low.length > 0) result.push({ title: 'Low Priority', priority: 'low' as EventPriority, data: low });

    return result;
  }, [filteredEvents]);

  const handleDelete = (eventId: string) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate(eventId) },
    ]);
  };

  return (
    <Screen>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Tasks & Priorities</Text>

        <SegmentedControl
          options={[
            { label: 'Pending', value: 'pending' },
            { label: 'Completed', value: 'completed' },
            { label: 'Deadlines', value: 'deadlines' },
          ]}
          selectedValue={activeTab}
          onValueChange={setActiveTab}
        />

        <Input
          placeholder="Search tasks..."
          value={searchQuery}
          onChangeText={setSearchQuery}
          containerStyle={styles.searchBar}
        />
      </View>

      {isLoading ? (
        <View style={{ padding: SPACING.md }}>
          <Skeleton height={50} style={{ marginVertical: SPACING.xs }} />
          <Skeleton height={50} style={{ marginVertical: SPACING.xs }} />
          <Skeleton height={50} style={{ marginVertical: SPACING.xs }} />
        </View>
      ) : sections.length === 0 ? (
        <EmptyState
          title={`No ${activeTab} tasks`}
          description="Create tasks and deadlines to organize your group priorities"
          actionTitle="Create Task"
          onAction={() => navigation.navigate('EventForm', {})}
        />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshing={isLoading}
          onRefresh={refetch}
          renderSectionHeader={({ section: { title, priority, data } }) => {
            const pColor = PRIORITY_COLORS[priority];
            return (
              <View style={[styles.sectionHeader, { backgroundColor: theme.bg }]}>
                <View style={[styles.priorityIndicator, { backgroundColor: pColor }]} />
                <Text style={[styles.sectionTitle, { color: theme.text }]}>{title}</Text>
                <View style={[styles.countBadge, { backgroundColor: theme.surface }]}>
                  <Text style={[styles.countText, { color: theme.muted }]}>{data.length}</Text>
                </View>
              </View>
            );
          }}
          renderItem={({ item }) => {
            const isCompleted = item.status === 'completed';
            const isUrgent = computeIsUrgent(item);

            return (
              <Card
                isUrgent={isUrgent}
                onPress={() => navigation.navigate('EventDetails', { eventId: item.id, initialEvent: item })}
                style={styles.taskCard}
              >
                <TouchableOpacity
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: isCompleted }}
                  onPress={() => {
                    if (isCompleted) {
                      uncompleteMutation.mutate(item.id);
                    } else {
                      completeMutation.mutate(item.id);
                    }
                  }}
                  style={styles.checkTouch}
                >
                  <View
                    style={[
                      styles.checkBox,
                      {
                        backgroundColor: isCompleted ? '#30A46C' : 'transparent',
                        borderColor: isCompleted ? '#30A46C' : theme.border,
                      },
                    ]}
                  >
                    {isCompleted && <Text style={styles.checkMark}>✓</Text>}
                  </View>
                </TouchableOpacity>

                <View style={styles.taskDetails}>
                  <Text
                    style={[
                      styles.taskTitle,
                      {
                        color: theme.text,
                        textDecorationLine: isCompleted ? 'line-through' : 'none',
                        opacity: isCompleted ? 0.6 : 1,
                      },
                    ]}
                  >
                    {item.title}
                  </Text>

                  <View style={styles.badgeRow}>
                    <CategoryBadge category={item.category} />
                    <Text style={[styles.dueText, { color: theme.muted }]}>
                      Due {formatRelativeTime(item.startAt)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  accessibilityRole="button"
                  accessibilityLabel="Delete task"
                  onPress={() => handleDelete(item.id)}
                  style={styles.deleteTouch}
                >
                  <Text style={{ color: theme.muted, fontSize: 18 }}>✕</Text>
                </TouchableOpacity>
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
  },
  title: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  searchBar: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  listContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xxl * 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    gap: SPACING.xs,
  },
  priorityIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  countBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
    marginLeft: 4,
  },
  countText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  checkTouch: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.xs,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkMark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },
  taskDetails: {
    flex: 1,
  },
  taskTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    marginBottom: 4,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
  },
  dueText: {
    fontSize: TYPOGRAPHY.xs,
  },
  deleteTouch: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: SPACING.xs,
  },
});

