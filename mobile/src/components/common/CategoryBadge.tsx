import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { EventCategory } from '../../types/api';
import { CATEGORY_COLORS, RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { CATEGORY_LABELS } from '../../lib/constants';

export interface CategoryBadgeProps {
  category: EventCategory;
}

export const CategoryBadge: React.FC<CategoryBadgeProps> = ({ category }) => {
  const color = CATEGORY_COLORS[category] || '#8B8D98';
  const label = CATEGORY_LABELS[category] || category;

  return (
    <View style={[styles.badge, { backgroundColor: `${color}1A`, borderColor: `${color}40` }]}>
      <Text style={[styles.label, { color }]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
});

