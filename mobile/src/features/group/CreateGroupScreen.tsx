import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Share,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { groupApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { Group } from '../../types/api';
import { WEB_URL } from '../../lib/constants';
import { haptics } from '../../lib/haptics';
import { initSocket } from '../../lib/socket';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'CreateGroup'>;

export const CreateGroupScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const setGroup = useAuthStore((s) => s.setGroup);

  const [groupName, setGroupName] = useState('');
  const [createdGroup, setCreatedGroup] = useState<Group | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!groupName.trim()) {
      setError('Please provide a group name');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const newGroup = await groupApi.createGroup(groupName.trim());
      setCreatedGroup(newGroup);
      haptics.success();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!createdGroup) return;
    haptics.medium();
    await Clipboard.setStringAsync(createdGroup.inviteCode);
    Toast.show({
      type: 'success',
      text1: 'Invite code copied!',
      text2: createdGroup.inviteCode,
    });
  };

  const handleShare = async () => {
    if (!createdGroup) return;
    haptics.light();
    const inviteLink = `${WEB_URL}/join/${createdGroup.inviteCode}`;
    try {
      await Share.share({
        message: `Join my SyncMate group "${createdGroup.name}": ${inviteLink} (Code: ${createdGroup.inviteCode})`,
      });
    } catch (err) {
      console.warn('Share error:', err);
    }
  };

  const handleFinish = async () => {
    if (createdGroup) {
      setGroup(createdGroup);
      await initSocket();
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {!createdGroup ? (
          <>
            <View style={styles.header}>
              <Text style={[styles.title, { color: theme.text }]}>Create your group</Text>
              <Text style={[styles.subtitle, { color: theme.muted }]}>
                Give your shared workspace a name (e.g., Team Alpha, Hackathon Squad)
              </Text>
            </View>

            {error && (
              <View style={[styles.errorBox, { backgroundColor: `${theme.destructive}1A`, borderColor: theme.destructive }]}>
                <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
              </View>
            )}

            <Input
              label="Group Name"
              placeholder="Team Alpha"
              value={groupName}
              onChangeText={setGroupName}
              autoFocus
            />

            <Button
              title="Create Group"
              onPress={handleCreate}
              loading={isLoading}
              variant="primary"
              size="lg"
              style={styles.submitBtn}
            />
          </>
        ) : (
          <View style={styles.successContainer}>
            <Text style={styles.successIcon}>🎉</Text>
            <Text style={[styles.title, { color: theme.text }]}>{createdGroup.name} is ready!</Text>
            <Text style={[styles.subtitle, { color: theme.muted }]}>
              Share this invite code with 3–5 team members to start synchronizing calendars.
            </Text>

            <Card style={styles.codeCard}>
              <Text style={[styles.codeLabel, { color: theme.muted }]}>GROUP INVITE CODE</Text>
              <Text style={[styles.codeText, { color: theme.primary }]}>
                {createdGroup.inviteCode}
              </Text>
              <Button
                title="Copy Code"
                onPress={handleCopyCode}
                variant="secondary"
                size="sm"
                style={styles.copyBtn}
              />
            </Card>

            <Button
              title="Share Invite Link ↗"
              onPress={handleShare}
              variant="outline"
              size="md"
              style={styles.shareBtn}
            />

            <Button
              title="Enter Calendar"
              onPress={handleFinish}
              variant="primary"
              size="lg"
              style={styles.continueBtn}
            />
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.xxl,
    justifyContent: 'center',
  },
  header: {
    marginBottom: SPACING.xl,
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
  errorBox: {
    borderWidth: 1,
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '500',
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
  successContainer: {
    alignItems: 'center',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  codeCard: {
    width: '100%',
    alignItems: 'center',
    padding: SPACING.lg,
    marginVertical: SPACING.lg,
  },
  codeLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  codeText: {
    fontSize: 32,
    fontWeight: '800',
    letterSpacing: 4,
    marginVertical: SPACING.sm,
  },
  copyBtn: {
    minWidth: 140,
    marginTop: SPACING.xs,
  },
  shareBtn: {
    width: '100%',
    marginBottom: SPACING.md,
  },
  continueBtn: {
    width: '100%',
  },
});

