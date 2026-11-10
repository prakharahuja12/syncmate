import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Button } from './Button';

export interface ErrorStateProps {
  message?: string;
  onRetry?: () => void;
  style?: ViewStyle;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  message = 'Failed to load content. Please check your network and try again.',
  onRetry,
  style,
}) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, style]}>
      <Text style={[styles.icon, { color: theme.destructive }]}>⚠️</Text>
      <Text style={[styles.title, { color: theme.text }]}>Something went wrong</Text>
      <Text style={[styles.message, { color: theme.muted }]}>{message}</Text>
      {onRetry && (
        <Button
          title="Try again"
          onPress={onRetry}
          variant="secondary"
          size="sm"
          style={styles.retryBtn}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xl,
    paddingHorizontal: SPACING.lg,
  },
  icon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  message: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: SPACING.md,
  },
  retryBtn: {
    marginTop: SPACING.xs,
  },
});

