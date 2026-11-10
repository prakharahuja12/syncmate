import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { haptics } from '../../lib/haptics';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'CreateOrJoin'>;

export const CreateOrJoinScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: theme.bg }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Welcome to SyncMate</Text>
        <Text style={[styles.subtitle, { color: theme.muted }]}>
          To get started, create a shared workspace for your team or join an existing one.
        </Text>
      </View>

      <View style={styles.cardList}>
        <Card
          onPress={() => {
            haptics.light();
            navigation.navigate('CreateGroup');
          }}
          style={styles.card}
          accessibilityLabel="Create a new group"
        >
          <Text style={styles.icon}>🚀</Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Create a group</Text>
          <Text style={[styles.cardDesc, { color: theme.muted }]}>
            Start a new group calendar for up to 5 members and invite your teammates.
          </Text>
        </Card>

        <Card
          onPress={() => {
            haptics.light();
            navigation.navigate('JoinGroup', {});
          }}
          style={styles.card}
          accessibilityLabel="Join with an invite code"
        >
          <Text style={styles.icon}>🔑</Text>
          <Text style={[styles.cardTitle, { color: theme.text }]}>Join with code</Text>
          <Text style={[styles.cardDesc, { color: theme.muted }]}>
            Enter an 8-character invite code from your teammate or open an invite link.
          </Text>
        </Card>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: SPACING.xl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xxl,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
    marginBottom: SPACING.xs,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 22,
  },
  cardList: {
    gap: SPACING.md,
  },
  card: {
    padding: SPACING.xl,
  },
  icon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  cardTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    marginBottom: SPACING.xs,
  },
  cardDesc: {
    fontSize: TYPOGRAPHY.sm,
    lineHeight: 20,
  },
});

