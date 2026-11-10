import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RADIUS, TYPOGRAPHY } from '../../theme/tokens';
import { UserSummary } from '../../types/api';

export interface AvatarProps {
  user?: UserSummary | null;
  name?: string;
  color?: string;
  size?: number;
}

export const Avatar: React.FC<AvatarProps> = ({
  user,
  name,
  color,
  size = 32,
}) => {
  const displayName = user?.name || name || 'User';
  const avatarBg = user?.avatarColor || color || '#5B5BD6';

  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <View
      style={[
        styles.avatar,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: avatarBg,
        },
      ]}
    >
      <Text style={[styles.initials, { fontSize: size * 0.4 }]}>{initials}</Text>
    </View>
  );
};

export interface AvatarStackProps {
  users: UserSummary[];
  maxVisible?: number;
  size?: number;
}

export const AvatarStack: React.FC<AvatarStackProps> = ({
  users,
  maxVisible = 3,
  size = 28,
}) => {
  const visibleUsers = users.slice(0, maxVisible);
  const remaining = users.length - maxVisible;

  return (
    <View style={styles.stackContainer}>
      {visibleUsers.map((user, idx) => (
        <View
          key={user.id || idx}
          style={[
            styles.stackedAvatar,
            {
              marginLeft: idx === 0 ? 0 : -size * 0.35,
              zIndex: visibleUsers.length - idx,
            },
          ]}
        >
          <Avatar user={user} size={size} />
        </View>
      ))}

      {remaining > 0 && (
        <View
          style={[
            styles.stackedAvatar,
            styles.remainingBadge,
            {
              width: size,
              height: size,
              borderRadius: size / 2,
              marginLeft: -size * 0.35,
              zIndex: 0,
            },
          ]}
        >
          <Text style={[styles.remainingText, { fontSize: size * 0.38 }]}>+{remaining}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  avatar: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  stackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stackedAvatar: {
    borderWidth: 2,
    borderColor: '#0F0F11',
    borderRadius: RADIUS.full,
  },
  remainingBadge: {
    backgroundColor: '#3F3F46',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingText: {
    color: '#EDEDEF',
    fontWeight: '700',
  },
});

