import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { WatchlistItem, ParticipationStatus } from '../../types/api';
import { Card } from '../../components/ui/Card';
import { CategoryBadge } from '../../components/common/CategoryBadge';
import { ExternalLinkButton } from '../../components/common/ExternalLinkButton';
import { Avatar } from '../../components/ui/Avatar';
import { StatusSheet } from './StatusSheet';
import { formatDate, formatRelativeTime, formatDeadlineCountdown } from '../../lib/dates';
import { PARTICIPATION_ICONS, PARTICIPATION_LABELS } from '../../lib/constants';
import { haptics } from '../../lib/haptics';

export interface WatchCardProps {
  item: WatchlistItem;
  onPress: () => void;
  onStatusChange: (status: ParticipationStatus) => void;
}

export const WatchCard: React.FC<WatchCardProps> = ({
  item,
  onPress,
  onStatusChange,
}) => {
  const { theme } = useTheme();
  const [statusSheetVisible, setStatusSheetVisible] = useState(false);

  const regClosesAt = item.hackathon?.registrationClosesAt;
  const countdown = formatDeadlineCountdown(regClosesAt);
  const isRegistered = item.myStatus === 'registered';

  const pinnedByFirst = item.pinSummary.pinnedBy[0];
  const pinText = pinnedByFirst
    ? `Pinned by ${pinnedByFirst.user.name} • ${formatRelativeTime(pinnedByFirst.pinnedAt)}`
    : 'Saved to Watchlist';

  // Count participation
  const interestedCount = item.participation.filter((p) => p.status === 'interested').length;
  const registeredCount = item.participation.filter((p) => p.status === 'registered').length;
  const planningCount = item.participation.filter((p) => p.status === 'planning').length;

  const summaryText = `${interestedCount} interested • ${registeredCount} registered${
    planningCount > 0 ? ` • ${planningCount} planning` : ''
  }`;

  return (
    <Card isUrgent={countdown.isClose} onPress={onPress} style={styles.card}>
      {/* Top row: Category + Countdown */}
      <View style={styles.topRow}>
        <CategoryBadge category={item.category} />
        {regClosesAt && countdown.text ? (
          <View
            style={[
              styles.countdownBadge,
              {
                backgroundColor: countdown.isClose ? '#E5484D20' : theme.surface,
                borderColor: countdown.isClose ? '#E5484D' : theme.border,
              },
            ]}
          >
            <Text
              style={[
                styles.countdownText,
                { color: countdown.isClose ? '#E5484D' : theme.text },
              ]}
            >
              ⏰ {countdown.text}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Registered Ribbon */}
      {isRegistered && (
        <View style={styles.registeredRibbon}>
          <Text style={styles.registeredText}>✅ You are registered</Text>
        </View>
      )}

      {/* Title */}
      <Text style={[styles.title, { color: theme.text }]}>{item.title}</Text>

      {/* Event Date & Prize/Location */}
      <View style={styles.infoRow}>
        <Text style={[styles.infoText, { color: theme.muted }]}>
          📅 Event: {formatDate(item.startAt, 'MMM d, yyyy')}
        </Text>
        {item.hackathon?.prizePool && (
          <Text style={[styles.infoText, { color: '#30A46C' }]}>
            🏆 {item.hackathon.prizePool}
          </Text>
        )}
      </View>

      {/* Pinned by */}
      <Text style={[styles.pinMeta, { color: theme.muted }]}>📌 {pinText}</Text>

      {/* Links Row */}
      <View style={styles.linksRow}>
        {item.hackathon?.registrationUrl ? (
          <ExternalLinkButton
            url={item.hackathon.registrationUrl}
            label="Register"
            variant="primary"
          />
        ) : item.primaryUrl ? (
          <ExternalLinkButton url={item.primaryUrl} label="Register" variant="primary" />
        ) : null}

        {item.hackathon?.officialUrl && (
          <ExternalLinkButton
            url={item.hackathon.officialUrl}
            label="Official site"
            variant="secondary"
          />
        )}
      </View>

      {/* Participants Row */}
      <View style={[styles.participantsBox, { backgroundColor: theme.surface, borderColor: theme.border }]}>
        <View style={styles.avatarRow}>
          {item.participation.map((part) => (
            <View key={part.user.id} style={styles.participantItem}>
              <Avatar user={part.user} size={24} />
              <Text style={styles.glyphBadge}>
                {part.status ? PARTICIPATION_ICONS[part.status] : '○'}
              </Text>
            </View>
          ))}
        </View>
        <Text style={[styles.summaryText, { color: theme.muted }]}>{summaryText}</Text>
      </View>

      {/* My Status Trigger Button */}
      <TouchableOpacity
        accessibilityRole="button"
        onPress={() => {
          haptics.light();
          setStatusSheetVisible(true);
        }}
        style={[styles.statusTriggerBtn, { borderColor: theme.border }]}
      >
        <Text style={[styles.statusTriggerLabel, { color: theme.muted }]}>My Status:</Text>
        <Text style={[styles.statusTriggerVal, { color: theme.primary }]}>
          {item.myStatus
            ? `${PARTICIPATION_ICONS[item.myStatus]} ${PARTICIPATION_LABELS[item.myStatus]}`
            : 'Set your status...'}
        </Text>
      </TouchableOpacity>

      {/* Status Picker Sheet Modal */}
      <StatusSheet
        visible={statusSheetVisible}
        onClose={() => setStatusSheetVisible(false)}
        currentStatus={item.myStatus}
        onSelectStatus={onStatusChange}
      />
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: SPACING.md,
    marginVertical: SPACING.xs,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.xs,
  },
  countdownBadge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
  },
  countdownText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  registeredRibbon: {
    backgroundColor: '#30A46C20',
    borderColor: '#30A46C',
    borderWidth: 1,
    borderRadius: RADIUS.sm,
    paddingVertical: 3,
    paddingHorizontal: SPACING.sm,
    alignSelf: 'flex-start',
    marginVertical: 4,
  },
  registeredText: {
    color: '#30A46C',
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  title: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    marginBottom: 4,
  },
  infoRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginVertical: 2,
  },
  infoText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '500',
  },
  pinMeta: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 4,
    marginBottom: SPACING.sm,
  },
  linksRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.xs,
    marginVertical: SPACING.xs,
  },
  participantsBox: {
    padding: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginVertical: SPACING.xs,
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  participantItem: {
    alignItems: 'center',
  },
  glyphBadge: {
    fontSize: 10,
    marginTop: -4,
  },
  summaryText: {
    fontSize: TYPOGRAPHY.xs,
  },
  statusTriggerBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    paddingTop: SPACING.sm,
    marginTop: SPACING.xs,
    minHeight: 44,
  },
  statusTriggerLabel: {
    fontSize: TYPOGRAPHY.sm,
  },
  statusTriggerVal: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
  },
});

