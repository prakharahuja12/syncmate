import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { OnboardingStackParamList } from '../../navigation/types';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { groupApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { GroupPreview } from '../../types/api';
import { haptics } from '../../lib/haptics';
import { initSocket } from '../../lib/socket';

type Props = NativeStackScreenProps<OnboardingStackParamList, 'JoinGroup'>;

export const JoinGroupScreen: React.FC<Props> = ({ route }) => {
  const { theme } = useTheme();
  const setGroup = useAuthStore((s) => s.setGroup);
  const pendingCode = useUiStore((s) => s.pendingInviteCode);
  const setPendingCode = useUiStore((s) => s.setPendingInviteCode);

  const initialCode = route.params?.initialCode || pendingCode || '';
  const [code, setCode] = useState(initialCode.toUpperCase());
  const [preview, setPreview] = useState<GroupPreview | null>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [isJoining, setIsJoining] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCodeChange = (text: string) => {
    const formatted = text.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8);
    setCode(formatted);
    setError(null);
  };

  const handlePaste = async () => {
    const text = await Clipboard.getStringAsync();
    if (text) {
      haptics.light();
      handleCodeChange(text);
    }
  };

  // Auto-fetch preview once 8 characters are entered
  useEffect(() => {
    if (code.length === 8) {
      let isMounted = true;
      setIsLoadingPreview(true);
      setError(null);

      groupApi
        .previewInvite(code)
        .then((res) => {
          if (isMounted) setPreview(res);
        })
        .catch((err) => {
          if (isMounted) {
            setPreview(null);
            if (err.code === 'INVITE_INVALID') {
              setError('This invite code is invalid or has expired.');
            } else if (err.code === 'GROUP_FULL') {
              setError('This group is full (max 5 members).');
            } else {
              setError(err.message || 'Could not load group preview.');
            }
          }
        })
        .finally(() => {
          if (isMounted) setIsLoadingPreview(false);
        });

      return () => {
        isMounted = false;
      };
    } else {
      setPreview(null);
    }
  }, [code]);

  const handleJoin = async () => {
    if (code.length !== 8) {
      setError('Invite code must be 8 characters.');
      return;
    }

    setIsJoining(true);
    setError(null);
    try {
      const joinedGroup = await groupApi.joinGroup(code);
      haptics.success();
      setPendingCode(null);
      setGroup(joinedGroup);
      await initSocket();
    } catch (err: any) {
      if (err.code === 'GROUP_FULL') {
        setError('This group has reached its maximum limit of 5 members.');
      } else if (err.code === 'INVITE_INVALID') {
        setError('Invalid invite code. Please ask the owner for a fresh invite.');
      } else {
        setError(err.message || 'Failed to join group.');
      }
    } finally {
      setIsJoining(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={[styles.container, { backgroundColor: theme.bg }]}
    >
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={[styles.title, { color: theme.text }]}>Join a group</Text>
          <Text style={[styles.subtitle, { color: theme.muted }]}>
            Enter the 8-character invite code provided by your team
          </Text>
        </View>

        {error && (
          <View style={[styles.errorBox, { backgroundColor: `${theme.destructive}1A`, borderColor: theme.destructive }]}>
            <Text style={[styles.errorText, { color: theme.destructive }]}>{error}</Text>
          </View>
        )}

        <View style={styles.inputRow}>
          <Input
            label="Invite Code"
            placeholder="DEMO1234"
            value={code}
            onChangeText={handleCodeChange}
            autoCapitalize="characters"
            maxLength={8}
            containerStyle={styles.codeField}
            autoFocus
          />
          <Button
            title="Paste"
            onPress={handlePaste}
            variant="secondary"
            size="md"
            style={styles.pasteBtn}
          />
        </View>

        {isLoadingPreview && (
          <Text style={[styles.previewStatus, { color: theme.muted }]}>
            Checking invite code...
          </Text>
        )}

        {preview && (
          <Card style={styles.previewCard}>
            <Text style={styles.previewIcon}>👥</Text>
            <Text style={[styles.previewTitle, { color: theme.text }]}>
              {preview.groupName}
            </Text>
            <Text style={[styles.previewMembers, { color: theme.muted }]}>
              {preview.memberCount} / {preview.maxMembers} members
            </Text>
          </Card>
        )}

        <Button
          title={preview ? `Join ${preview.groupName}` : 'Join Group'}
          onPress={handleJoin}
          loading={isJoining}
          disabled={code.length !== 8}
          variant="primary"
          size="lg"
          style={styles.submitBtn}
        />
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
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  codeField: {
    flex: 1,
  },
  pasteBtn: {
    marginTop: 24, // align with input field below label
  },
  previewStatus: {
    fontSize: TYPOGRAPHY.sm,
    textAlign: 'center',
    marginVertical: SPACING.sm,
  },
  previewCard: {
    alignItems: 'center',
    padding: SPACING.lg,
    marginVertical: SPACING.md,
  },
  previewIcon: {
    fontSize: 32,
    marginBottom: SPACING.xs,
  },
  previewTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '700',
    marginBottom: 2,
  },
  previewMembers: {
    fontSize: TYPOGRAPHY.sm,
  },
  submitBtn: {
    marginTop: SPACING.md,
  },
});

