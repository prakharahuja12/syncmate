import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { haptics } from '../../lib/haptics';

export interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'destructive' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  icon?: React.ReactNode;
  style?: ViewStyle;
  textStyle?: TextStyle;
  accessibilityLabel?: string;
}

export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon,
  style,
  textStyle,
  accessibilityLabel,
}) => {
  const { theme } = useTheme();

  const handlePress = () => {
    if (disabled || loading) return;
    haptics.light();
    onPress();
  };

  const getContainerStyle = (): ViewStyle => {
    let bg = theme.primary;
    let borderColor = 'transparent';
    let borderWidth = 0;

    if (variant === 'secondary') {
      bg = theme.surface;
      borderColor = theme.border;
      borderWidth = 1;
    } else if (variant === 'destructive') {
      bg = theme.destructive;
    } else if (variant === 'outline') {
      bg = 'transparent';
      borderColor = theme.border;
      borderWidth = 1;
    } else if (variant === 'ghost') {
      bg = 'transparent';
    }

    const minHeight = size === 'sm' ? 44 : size === 'lg' ? 52 : 48;
    const paddingHorizontal = size === 'sm' ? SPACING.md : SPACING.lg;

    return {
      backgroundColor: bg,
      borderColor,
      borderWidth,
      minHeight,
      paddingHorizontal,
      borderRadius: RADIUS.md,
      opacity: disabled ? 0.5 : 1,
    };
  };

  const getTextColor = (): string => {
    if (variant === 'primary') return theme.primaryForeground;
    if (variant === 'destructive') return '#FFFFFF';
    if (variant === 'secondary' || variant === 'outline') return theme.text;
    if (variant === 'ghost') return theme.primary;
    return theme.text;
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel || title}
      accessibilityState={{ disabled: disabled || loading }}
      activeOpacity={0.8}
      onPress={handlePress}
      disabled={disabled || loading}
      style={[styles.base, getContainerStyle(), style]}
    >
      {loading ? (
        <ActivityIndicator color={getTextColor()} size="small" />
      ) : (
        <>
          {icon}
          <Text
            style={[
              styles.text,
              {
                color: getTextColor(),
                fontSize: size === 'sm' ? TYPOGRAPHY.sm : TYPOGRAPHY.md,
                marginLeft: icon ? SPACING.sm : 0,
              },
              textStyle,
            ]}
          >
            {title}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    fontWeight: '600',
  },
});

