import React from 'react';
import { View, TouchableOpacity, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING } from '../../theme/tokens';
import { haptics } from '../../lib/haptics';

export interface CardProps {
  children: React.ReactNode;
  isUrgent?: boolean;
  onPress?: () => void;
  style?: ViewStyle;
  accessibilityLabel?: string;
}

export const Card: React.FC<CardProps> = ({
  children,
  isUrgent = false,
  onPress,
  style,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const cardStyle: ViewStyle = {
    backgroundColor: isUrgent ? theme.urgentBg : theme.card,
    borderColor: isUrgent ? theme.urgentBorder : theme.border,
    borderWidth: 1,
    borderLeftWidth: isUrgent ? 4 : 1,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
  };

  if (onPress) {
    return (
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={0.7}
        onPress={() => {
          haptics.light();
          onPress();
        }}
        style={[styles.container, cardStyle, style]}
      >
        {children}
      </TouchableOpacity>
    );
  }

  return <View style={[styles.container, cardStyle, style]}>{children}</View>;
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.xs,
  },
});

