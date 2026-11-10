import React from 'react';
import { View, Text, StyleSheet, ViewStyle, TextStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';

export interface BadgeProps {
  label: string;
  color?: string;
  bgColor?: string;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

export const Badge: React.FC<BadgeProps> = ({
  label,
  color,
  bgColor,
  icon,
  style,
  textStyle,
}) => {
  const { theme } = useTheme();

  const textColor = color || theme.text;
  const background = bgColor || (color ? `${color}20` : theme.surface);

  return (
    <View style={[styles.badge, { backgroundColor: background, borderColor: color || theme.border }, style]}>
      {icon && <View style={styles.icon}>{icon}</View>}
      <Text style={[styles.label, { color: textColor }, textStyle]}>{label}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderRadius: RADIUS.full,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  icon: {
    marginRight: 4,
  },
  label: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
});

