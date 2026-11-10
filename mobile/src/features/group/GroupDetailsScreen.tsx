import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import Toast from 'react-native-toast-message';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { Skeleton } from '../../components/ui/Skeleton';
import { ErrorState } from '../../components/ui/ErrorState';
import { groupApi } from './api';
import { useAuthStore } from '../../stores/authStore';
import { WEB_URL } from '../../lib/constants';
import { haptics } from '../../lib/haptics';

export const GroupDetailsScreen: React.FC = () => {
  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const currentUser = useAuthStore((s) => s.user);
  const setGroup = useAuthStore((s) => s.setGroup);

  const { data: group, isLoading, error, refetch } = useQuery({
    queryKey: ['group'],
    queryFn: () => groupApi.getMyGroup(),
  });

  const isOwner = group?.ownerId === currentUser?.id;

  const copyCode = async () => {
    if (!group) return;
    haptics.medium();
    await Clipboard.setStringAsync(group.inviteCode);
    Toast.show({
      type: 'success',
      text1: 'Invite code copied!',
      text2: group.inviteCode,
    });
  };

  const shareInvite = async () => {
    if (!group) return;
    haptics.light();
    try {
      await Share.share({
        message: `Join my SyncMate group "${group.name}": ${WEB_URL}/join/${group.inviteCode} (Code: ${group.inviteCode})`,
      });
    } catch {}
  };

  const regenerateMutation = useMutation({
    mutationFn: () => groupApi.regenerateInvite(group!.id),
    onSuccess: (res) => {
      haptics.success();
      queryClient.setQueryData(['group'], (old: any) => ({
        ...old,
        inviteCode: res.inviteCode,
      }));
      Toast.show({ type: 'success', text1: 'Invite code regenerated!' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Failed to regenerate code', text2: err.message });
    },
  });

  const removeMemberMutation = useMutation({
    mutationFn: (userId: string) => groupApi.removeMember(group!.id, userId),
    onSuccess: () => {
      haptics.success();
      queryClient.invalidateQueries({ queryKey: ['group'] });
      Toast.show({ type: 'success', text1: 'Member removed' });
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Failed to remove member', text2: err.message });
    },
  });

  const leaveMutation = useMutation({
    mutationFn: () => groupApi.leaveGroup(group!.id),
    onSuccess: () => {
      haptics.warning();
      setGroup(null);
    },
    onError: (err: any) => {
      Toast.show({ type: 'error', text1: 'Cannot leave group', text2: err.message });
    },
  });

  const handleRegenerate = () => {
    Alert.alert(
      'Regenerate Invite Code?',
      'The current code will immediately stop working for new members.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Regenerate', style: 'destructive', onPress: () => regenerateMutation.mutate() },
      ]
    );
  };

  const handleRemove = (userId: string, name: string) => {
    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${name} from ${group?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Remove', style: 'destructive', onPress: () => removeMemberMutation.mutate(userId) },
      ]
    );
  };

  const handleLeave = () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave ${group?.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Leave', style: 'destructive', onPress: () => leaveMutation.mutate() },
      ]
    );
  };

  if (isLoading) {
    return (
      <Screen scrollable>
        <Skeleton height={140} style={{ marginVertical: SPACING.md }} />
        <Skeleton height={60} style={{ marginVertical: SPACING.xs }} />
        <Skeleton height={60} style={{ marginVertical: SPACING.xs }} />
      </Screen>
    );
  }

  if (error || !group) {
    return (
      <Screen>
        <ErrorState onRetry={() => refetch()} />
      </Screen>
    );
  }

  return (
    <Screen scrollable refreshing={isLoading} onRefresh={refetch}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>{group.name}</Text>
        <Text style={[styles.memberCount, { color: theme.muted }]}>
          {group.members.length} / {group.maxMembers} members
        </Text>
      </View>

      <Card style={styles.inviteCard}>
        <View style={styles.inviteRow}>
          <View>
            <Text style={[styles.inviteLabel, { color: theme.muted }]}>INVITE CODE</Text>
            <Text style={[styles.inviteCode, { color: theme.primary }]}>{group.inviteCode}</Text>
          </View>
          <View style={styles.btnRow}>
            <Button title="Copy" onPress={copyCode} variant="secondary" size="sm" />
            <Button title="Share ↗" onPress={shareInvite} variant="primary" size="sm" />
          </View>
        </View>
        {isOwner && (
          <TouchableOpacity
            accessibilityRole="button"
            onPress={handleRegenerate}
            style={styles.regenerateBtn}
          >
            <Text style={[styles.regenerateText, { color: theme.muted }]}>
              Regenerate invite code
            </Text>
          </TouchableOpacity>
        )}
      </Card>

      <Text style={[styles.sectionTitle, { color: theme.text }]}>Members</Text>

      {group.members.map((member) => {
        const isMe = member.id === currentUser?.id;
        const memberIsOwner = member.role === 'owner';

        return (
          <Card key={member.id} style={styles.memberCard}>
            <View style={styles.memberInfo}>
              <Avatar user={member} size={38} />
              <View style={styles.memberNameContainer}>
                <View style={styles.nameRow}>
                  <Text style={[styles.memberName, { color: theme.text }]}>{member.name}</Text>
                  {isMe && (
                    <View style={[styles.youBadge, { backgroundColor: `${theme.primary}20` }]}>
                      <Text style={[styles.youText, { color: theme.primary }]}>You</Text>
                    </View>
                  )}
                  {memberIsOwner && (
                    <View style={[styles.ownerBadge, { backgroundColor: `${theme.muted}20` }]}>
                      <Text style={[styles.ownerText, { color: theme.muted }]}>Owner</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.memberEmail, { color: theme.muted }]}>{member.email}</Text>
              </View>
            </View>

            {isOwner && !isMe && (
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={`Remove ${member.name}`}
                onPress={() => handleRemove(member.id, member.name)}
                style={styles.removeTouch}
              >
                <Text style={{ color: theme.destructive, fontSize: TYPOGRAPHY.sm }}>Remove</Text>
              </TouchableOpacity>
            )}
          </Card>
        );
      })}

      {!isOwner && (
        <Button
          title="Leave Group"
          onPress={handleLeave}
          variant="destructive"
          size="md"
          style={styles.leaveBtn}
        />
      )}
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginVertical: SPACING.lg,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
  },
  memberCount: {
    fontSize: TYPOGRAPHY.sm,
    marginTop: 2,
  },
  inviteCard: {
    padding: SPACING.md,
    marginBottom: SPACING.lg,
  },
  inviteRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  inviteLabel: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
    letterSpacing: 1,
  },
  inviteCode: {
    fontSize: 24,
    fontWeight: '800',
    letterSpacing: 2,
    marginTop: 2,
  },
  btnRow: {
    flexDirection: 'row',
    gap: SPACING.xs,
  },
  regenerateBtn: {
    marginTop: SPACING.sm,
    paddingVertical: 4,
  },
  regenerateText: {
    fontSize: TYPOGRAPHY.xs,
    textDecorationLine: 'underline',
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.lg,
    fontWeight: '600',
    marginBottom: SPACING.sm,
  },
  memberCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    marginBottom: SPACING.xs,
  },
  memberInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  memberNameContainer: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  memberName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  memberEmail: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 1,
  },
  youBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  youText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
  ownerBadge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  ownerText: {
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '600',
  },
  removeTouch: {
    minHeight: 44,
    minWidth: 44,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: SPACING.sm,
  },
  leaveBtn: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl,
  },
});

