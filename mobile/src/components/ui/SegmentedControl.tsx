import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { haptics } from '../../lib/haptics';

export interface SegmentOption<T extends string> {
  label: string;
  value: T;
  badge?: number | string;
}

export interface SegmentedControlProps<T extends string> {
  options: SegmentOption<T>[];
  selectedValue: T;
  onValueChange: (value: T) => void;
}

export function SegmentedControl<T extends string>({
  options,
  selectedValue,
  onValueChange,
}: SegmentedControlProps<T>) {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.surface, borderColor: theme.border }]}>
      {options.map((opt) => {
        const isSelected = opt.value === selectedValue;
        return (
          <TouchableOpacity
            key={opt.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: isSelected }}
            onPress={() => {
              if (!isSelected) {
                haptics.light();
                onValueChange(opt.value);
              }
            }}
            style={[
              styles.segment,
              {
                backgroundColor: isSelected ? theme.card : 'transparent',
                borderColor: isSelected ? theme.border : 'transparent',
              },
            ]}
          >
            <Text
              style={[
                styles.label,
                {
                  color: isSelected ? theme.text : theme.muted,
                  fontWeight: isSelected ? '600' : '400',
                },
              ]}
            >
              {opt.label}
            </Text>
            {opt.badge !== undefined && (
              <View
                style={[
                  styles.badge,
                  { backgroundColor: isSelected ? theme.primary : theme.border },
                ]}
              >
                <Text
                  style={[
                    styles.badgeText,
                    { color: isSelected ? theme.primaryForeground : theme.text },
                  ]}
                >
                  {opt.badge}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    padding: 3,
    minHeight: 44,
  },
  segment: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.sm,
    borderWidth: 1,
    paddingVertical: SPACING.xs,
    minHeight: 38,
  },
  label: {
    fontSize: TYPOGRAPHY.sm,
  },
  badge: {
    marginLeft: 6,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
});

