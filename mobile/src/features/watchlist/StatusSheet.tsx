import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { ParticipationStatus } from '../../types/api';
import { PARTICIPATION_ICONS, PARTICIPATION_LABELS } from '../../lib/constants';
import { haptics } from '../../lib/haptics';

export interface StatusSheetProps {
  visible: boolean;
  onClose: () => void;
  currentStatus: ParticipationStatus | null;
  onSelectStatus: (status: ParticipationStatus) => void;
}

const STATUS_OPTIONS: ParticipationStatus[] = [
  'interested',
  'planning',
  'registered',
  'not_interested',
];

export const StatusSheet: React.FC<StatusSheetProps> = ({
  visible,
  onClose,
  currentStatus,
  onSelectStatus,
}) => {
  const { theme } = useTheme();

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={onClose}
      >
        <View style={[styles.sheetContent, { backgroundColor: theme.card, borderColor: theme.border }]}>
          <View style={[styles.dragHandle, { backgroundColor: theme.border }]} />
          <Text style={[styles.sheetTitle, { color: theme.text }]}>Update My Status</Text>

          {STATUS_OPTIONS.map((st) => {
            const isSelected = currentStatus === st;
            return (
              <TouchableOpacity
                key={st}
                accessibilityRole="button"
                onPress={() => {
                  haptics.medium();
                  onSelectStatus(st);
                  onClose();
                }}
                style={[
                  styles.optionRow,
                  {
                    backgroundColor: isSelected ? `${theme.primary}15` : 'transparent',
                    borderColor: isSelected ? theme.primary : theme.border,
                  },
                ]}
              >
                <Text style={styles.optionIcon}>{PARTICIPATION_ICONS[st]}</Text>
                <Text
                  style={[
                    styles.optionLabel,
                    { color: isSelected ? theme.primary : theme.text, fontWeight: isSelected ? '700' : '500' },
                  ]}
                >
                  {PARTICIPATION_LABELS[st]}
                </Text>
                {isSelected && <Text style={{ color: theme.primary, fontWeight: '700' }}>✓</Text>}
              </TouchableOpacity>
            );
          })}
        </View>
      </TouchableOpacity>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContent: {
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderWidth: 1,
    padding: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  dragHandle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: SPACING.md,
  },
  sheetTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    marginBottom: SPACING.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    marginVertical: 4,
    minHeight: 48,
    gap: SPACING.sm,
  },
  optionIcon: {
    fontSize: 20,
  },
  optionLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.md,
  },
});

