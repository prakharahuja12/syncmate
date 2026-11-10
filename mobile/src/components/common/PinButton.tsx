import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Alert, View } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { PinSummary, PinVisibility } from '../../types/api';
import { haptics } from '../../lib/haptics';
import { RADIUS, TYPOGRAPHY } from '../../theme/tokens';

export interface PinButtonProps {
  pinSummary: PinSummary;
  onPin: (visibility: PinVisibility) => void;
  onUnpin: () => void;
  size?: number;
  showCount?: boolean;
}

export const PinButton: React.FC<PinButtonProps> = ({
  pinSummary,
  onPin,
  onUnpin,
  size = 44,
  showCount = false,
}) => {
  const { theme } = useTheme();
  const isPinned = pinSummary.isPinnedByMe;
  const pinCount = pinSummary.pinnedBy.length;

  const handlePress = () => {
    haptics.medium();
    if (isPinned) {
      onUnpin();
    } else {
      onPin('group');
    }
  };

  const handleLongPress = () => {
    haptics.heavy();
    Alert.alert(
      'Pin Options',
      'Choose how you want to save this event to the watchlist',
      [
        {
          text: 'Pin for Group',
          onPress: () => onPin('group'),
        },
        {
          text: 'Pin Privately',
          onPress: () => onPin('private'),
        },
        ...(isPinned
          ? [
              {
                text: 'Unpin',
                style: 'destructive' as const,
                onPress: () => onUnpin(),
              },
            ]
          : []),
        {
          text: 'Cancel',
          style: 'cancel' as const,
        },
      ]
    );
  };

  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={isPinned ? 'Unpin event' : 'Pin event to watchlist'}
      accessibilityHint="Long press for private pin options"
      activeOpacity={0.7}
      onPress={handlePress}
      onLongPress={handleLongPress}
      style={[
        styles.button,
        {
          minWidth: size,
          minHeight: size,
          backgroundColor: isPinned ? `${theme.primary}20` : 'transparent',
          borderColor: isPinned ? theme.primary : theme.border,
        },
      ]}
    >
      <Text style={[styles.icon, { fontSize: size * 0.45 }]}>
        {isPinned ? '📌' : '📍'}
      </Text>
      {showCount && pinCount > 0 && (
        <View style={styles.countWrapper}>
          <Text style={[styles.countText, { color: theme.text }]}>{pinCount}</Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
    borderWidth: 1,
    paddingHorizontal: 8,
  },
  icon: {
    textAlign: 'center',
  },
  countWrapper: {
    marginLeft: 4,
  },
  countText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
});

