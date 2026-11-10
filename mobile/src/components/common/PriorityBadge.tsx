import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EventPriority } from '../../types/api';
import { PRIORITY_COLORS, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { PRIORITY_LABELS } from '../../lib/constants';

export interface PriorityBadgeProps {
  priority: EventPriority;
  showLabel?: boolean;
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({
  priority,
  showLabel = true,
}) => {
  const color = PRIORITY_COLORS[priority];
  const label = PRIORITY_LABELS[priority];

  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      {showLabel && <Text style={[styles.label, { color }]}>{label}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
    marginLeft: 4,
  },
});

