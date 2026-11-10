import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ViewStyle } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { openExternalLink } from '../../lib/links';
import { haptics } from '../../lib/haptics';

export interface ExternalLinkButtonProps {
  url?: string | null;
  label?: string;
  variant?: 'primary' | 'secondary' | 'outline';
  inApp?: boolean;
  style?: ViewStyle;
}

export const ExternalLinkButton: React.FC<ExternalLinkButtonProps> = ({
  url,
  label = 'Open link',
  variant = 'primary',
  inApp = true,
  style,
}) => {
  const { theme } = useTheme();

  if (!url) return null;

  const handlePress = async () => {
    haptics.light();
    await openExternalLink(url, inApp);
  };

  const isPrimary = variant === 'primary';

  return (
    <TouchableOpacity
      accessibilityRole="link"
      accessibilityLabel={`${label}, opens external link`}
      activeOpacity={0.8}
      onPress={handlePress}
      style={[
        styles.button,
        {
          backgroundColor: isPrimary ? theme.primary : theme.surface,
          borderColor: isPrimary ? theme.primary : theme.border,
        },
        style,
      ]}
    >
      <Text
        style={[
          styles.text,
          { color: isPrimary ? theme.primaryForeground : theme.text },
        ]}
      >
        {label} ↗
      </Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
});

