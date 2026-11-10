import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { RootStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { PriorityBadge } from '../../components/common/PriorityBadge';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { PinButton } from '../../components/common/PinButton';
import { ExternalLinkButton } from '../../components/common/ExternalLinkButton';
import { Avatar, AvatarStack } from '../../components/ui/Avatar';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { eventsApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { formatDate, formatTime, formatRelativeTime, computeIsUrgent } from '../../lib/dates';
import { PARTICIPATION_ICONS, PARTICIPATION_LABELS } from '../../lib/constants';
import { ParticipationStatus } from '../../types/api';
import { haptics } from '../../lib/haptics';

type Props = NativeStackScreenProps<RootStackParamList, 'EventDetails'>;

export const EventDetailsSheet: React.FC<Props> = ({ navigation, route }) => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const eventId = route.params.eventId;

  const { data: event, isLoading, error, refetch } = useQuery({
    queryKey: ['event', eventId],
    queryFn: () => eventsApi.getEventById(eventId),
    initialData: route.params.initialEvent,
  });

  const completeMutation = useMutation({
    mutationFn: () =>
      event?.status === 'completed'
        ? eventsApi.uncompleteEvent(eventId)
        : eventsApi.completeEvent(eventId),
    onSuccess: (updated) => {
      haptics.success();
      queryClient.setQueryData(['event', eventId], updated);
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    },
  });

  const pinMutation = useMutation({
    mutationFn: (vis: 'group' | 'private') => eventsApi.pinEvent(eventId, vis),
    onSuccess: () => {
      haptics.medium();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const unpinMutation = useMutation({
    mutationFn: () => eventsApi.unpinEvent(eventId),
    onSuccess: () => {
      haptics.light();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    },
  });

  const statusMutation = useMutation({
    mutationFn: (st: ParticipationStatus) => eventsApi.setMyStatus(eventId, st),
    onSuccess: () => {
      haptics.success();
      refetch();
      queryClient.invalidateQueries({ queryKey: ['watchlist'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: () => eventsApi.deleteEvent(eventId),
    onSuccess: () => {
      haptics.warning();
      queryClient.invalidateQueries({ queryKey: ['events'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      navigation.goBack();
    },
  });

  const isUrgent = event ? computeIsUrgent(event) : false;
  const isCompleted = event?.status === 'completed';

  const handleStatusSelect = (st: ParticipationStatus) => {
    statusMutation.mutate(st);
  };

  const handleDelete = () => {
    Alert.alert('Delete Event', 'Are you sure you want to delete this event?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteMutation.mutate() },
    ]);
  };

  if (isLoading && !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg, padding: SPACING.lg }]}>
        <Skeleton height={32} style={{ marginBottom: SPACING.md }} />
        <Skeleton height={20} width="60%" style={{ marginBottom: SPACING.lg }} />
        <Skeleton height={120} />
      </View>
    );
  }

  if (error || !event) {
    return (
      <View style={[styles.container, { backgroundColor: theme.bg }]}>
        <ErrorState onRetry={() => refetch()} />
      </View>
    );
  }

  const primaryLink = event.primaryUrl || event.url;
  const isOwnerOrCreator =
    currentUser?.id === event.createdBy.id || currentUser?.groupId;

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      {/* Top action header */}
      <View style={[styles.topBar, { borderBottomColor: theme.border }]}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
        >
          <Text style={{ color: theme.muted, fontSize: TYPOGRAPHY.md }}>Close</Text>
        </TouchableOpacity>

        <View style={styles.topActions}>
          <PinButton
            pinSummary={event.pinSummary}
            onPin={(vis) => pinMutation.mutate(vis)}
            onUnpin={() => unpinMutation.mutate()}
            size={40}
          />
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.navigate('EventForm', { eventId })}
            style={[styles.editBtn, { borderColor: theme.border }]}
          >
            <Text style={{ color: theme.text, fontSize: TYPOGRAPHY.sm, fontWeight: '600' }}>
              Edit
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Urgent banner if applicable */}
        {isUrgent && (
          <View style={[styles.urgentBanner, { backgroundColor: theme.urgentBg, borderColor: theme.urgentBorder }]}>
            <Text style={[styles.urgentText, { color: theme.destructive }]}>
              ⚠️ Urgent Attention Needed
            </Text>
          </View>
        )}

        {/* Badges row */}
        <View style={styles.badgeRow}>
          <CategoryBadge category={event.category} />
          <PriorityBadge priority={event.priority} />
          {isCompleted && (
            <View style={[styles.completedBadge, { backgroundColor: '#30A46C20' }]}>
              <Text style={{ color: '#30A46C', fontSize: TYPOGRAPHY.xs, fontWeight: '700' }}>
                COMPLETED
              </Text>
            </View>
          )}
        </View>

        {/* Title */}
        <Text
          style={[
            styles.title,
            {
              color: theme.text,
              textDecorationLine: isCompleted ? 'line-through' : 'none',
              opacity: isCompleted ? 0.6 : 1,
            },
          ]}
        >
          {event.title}
        </Text>

        {/* Added by */}
        <View style={styles.creatorRow}>
          <Avatar user={event.createdBy} size={22} />
          <Text style={[styles.creatorText, { color: theme.muted }]}>
            Added by {event.createdBy.name} • {formatRelativeTime(event.createdAt)}
          </Text>
        </View>

        {/* Date and Time Card */}
        <Card style={styles.infoCard}>
          <Text style={[styles.cardLabel, { color: theme.muted }]}>DATE & TIME</Text>
          <Text style={[styles.dateText, { color: theme.text }]}>
            {formatDate(event.startAt, 'EEEE, MMMM d, yyyy')}
          </Text>
          <Text style={[styles.timeText, { color: theme.muted }]}>
            {event.allDay ? 'All Day' : `${formatTime(event.startAt)} – ${formatTime(event.endAt)}`}
          </Text>
        </Card>

        {/* Primary Link Button (Spec requirement) */}
        {primaryLink && (
          <View style={styles.ctaContainer}>
            <ExternalLinkButton
              url={primaryLink}
              label={
                event.category === 'hackathon' || event.category === 'competition'
                  ? 'Open registration page'
                  : 'Open event link'
              }
              variant="primary"
              style={styles.ctaButton}
            />
          </View>
        )}

        {/* Description */}
        {event.description ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Description</Text>
            <Text style={[styles.descText, { color: theme.text }]}>{event.description}</Text>
          </View>
        ) : null}

        {/* Hackathon metadata if present */}
        {event.hackathon && (
          <Card style={styles.hackCard}>
            <Text style={[styles.hackHeader, { color: theme.primary }]}>🏆 Hackathon Information</Text>
            {event.hackathon.prizePool && (
              <Text style={[styles.hackDetail, { color: theme.text }]}>
                💰 Prize Pool: <Text style={{ fontWeight: '700' }}>{event.hackathon.prizePool}</Text>
              </Text>
            )}
            {event.hackathon.location && (
              <Text style={[styles.hackDetail, { color: theme.text }]}>
                📍 Location: {event.hackathon.location} ({event.hackathon.mode})
              </Text>
            )}
            {event.hackathon.registrationClosesAt && (
              <Text style={[styles.hackDetail, { color: theme.destructive }]}>
                ⏰ Registration Closes: {formatDate(event.hackathon.registrationClosesAt, 'MMM d, yyyy h:mm a')}
              </Text>
            )}
            {event.hackathon.officialUrl && (
              <ExternalLinkButton
                url={event.hackathon.officialUrl}
                label="Official website"
                variant="secondary"
                style={{ marginTop: SPACING.sm }}
              />
            )}
          </Card>
        )}

        {/* Participation Status Row */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>My Participation</Text>
          <View style={styles.statusGrid}>
            {(['interested', 'planning', 'registered', 'not_interested'] as ParticipationStatus[]).map((st) => {
              const isSelected = event.myStatus === st;
              return (
                <TouchableOpacity
                  key={st}
                  accessibilityRole="button"
                  onPress={() => {
                    haptics.medium();
                    handleStatusSelect(st);
                  }}
                  style={[
                    styles.statusPill,
                    {
                      backgroundColor: isSelected ? theme.primary : theme.surface,
                      borderColor: isSelected ? theme.primary : theme.border,
                    },
                  ]}
                >
                  <Text style={styles.statusIcon}>{PARTICIPATION_ICONS[st]}</Text>
                  <Text
                    style={[
                      styles.statusPillText,
                      { color: isSelected ? theme.primaryForeground : theme.text },
                    ]}
                  >
                    {PARTICIPATION_LABELS[st]}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {/* Team Participation Avatars */}
        {event.participation && event.participation.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>Team Statuses</Text>
            {event.participation.map((part) => (
              <View key={part.user.id} style={styles.teamMemberRow}>
                <Avatar user={part.user} size={28} />
                <Text style={[styles.memberName, { color: theme.text }]}>{part.user.name}</Text>
                <Text style={[styles.memberStatusText, { color: theme.muted }]}>
                  {part.status ? `${PARTICIPATION_ICONS[part.status]} ${PARTICIPATION_LABELS[part.status]}` : 'No response'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Complete Toggle */}
        <Button
          title={isCompleted ? 'Mark as Pending' : 'Mark as Complete ✓'}
          onPress={() => completeMutation.mutate()}
          loading={completeMutation.isPending}
          variant={isCompleted ? 'secondary' : 'primary'}
          size="lg"
          style={styles.completeBtn}
        />

        {/* Delete */}
        <TouchableOpacity
          accessibilityRole="button"
          onPress={handleDelete}
          style={styles.deleteTouch}
        >
          <Text style={{ color: theme.destructive, fontSize: TYPOGRAPHY.sm, fontWeight: '600' }}>
            Delete Event
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.sm,
    borderBottomWidth: 1,
  },
  closeBtn: {
    minHeight: 44,
    justifyContent: 'center',
    minWidth: 60,
  },
  topActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
  },
  editBtn: {
    borderWidth: 1,
    borderRadius: RADIUS.md,
    minHeight: 40,
    paddingHorizontal: SPACING.md,
    justifyContent: 'center',
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl * 2,
  },
  urgentBanner: {
    borderWidth: 1,
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    marginBottom: SPACING.md,
  },
  urgentText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    textAlign: 'center',
  },
  badgeRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  completedBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
  },
  title: {
    fontSize: TYPOGRAPHY.xl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  creatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: SPACING.lg,
  },
  creatorText: {
    fontSize: TYPOGRAPHY.xs,
  },
  infoCard: {
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  cardLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 4,
  },
  dateText: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
  },
  timeText: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2,
  },
  ctaContainer: {
    marginVertical: SPACING.sm,
  },
  ctaButton: {
    width: '100%',
  },
  section: {
    marginVertical: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  descText: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 22,
  },
  hackCard: {
    padding: SPACING.md,
    marginVertical: SPACING.sm,
  },
  hackHeader: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  hackDetail: {
    fontSize: TYPOGRAPHY.sm,
    marginVertical: 2,
  },
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    minHeight: 44,
    gap: 6,
  },
  statusIcon: {
    fontSize: 16,
  },
  statusPillText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  teamMemberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    gap: SPACING.sm,
  },
  memberName: {
    flex: 1,
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '500',
  },
  memberStatusText: {
    fontSize: TYPOGRAPHY.xs,
  },
  completeBtn: {
    marginTop: SPACING.xl,
  },
  deleteTouch: {
    minHeight: 44,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: SPACING.md,
  },
});

