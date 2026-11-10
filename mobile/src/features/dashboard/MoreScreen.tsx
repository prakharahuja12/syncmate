import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { useUiStore } from '../../stores/uiStore';
import { haptics } from '../../lib/haptics';

export const MoreScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme } = useTheme();
  const unreadCount = useUiStore((s) => s.unreadNotificationsCount);

  const menuItems = [
    {
      title: 'Tasks & Priority',
      subtitle: 'Organize high, medium, and low priority to-dos',
      icon: '✅',
      route: 'Tasks',
    },
    {
      title: 'Notifications',
      subtitle: 'View activity logs and calendar alerts',
      icon: '🔔',
      route: 'Notifications',
      badge: unreadCount > 0 ? unreadCount : undefined,
    },
    {
      title: 'Group & Members',
      subtitle: 'Manage group code, members, and invite link',
      icon: '👥',
      route: 'GroupDetails',
    },
    {
      title: 'Google Calendar Sync',
      subtitle: 'Sync events to your personal Google Calendar',
      icon: '🗓️',
      route: 'GoogleSync',
    },
    {
      title: 'Settings',
      subtitle: 'Theme, notification preferences, profile, and sign out',
      icon: '⚙️',
      route: 'Settings',
    },
  ];

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>More Options</Text>
      </View>

      <View style={styles.list}>
        {menuItems.map((item) => (
          <Card
            key={item.route}
            onPress={() => {
              haptics.light();
              navigation.navigate(item.route);
            }}
            style={styles.card}
          >
            <View style={styles.cardRow}>
              <View style={[styles.iconBox, { backgroundColor: theme.surface }]}>
                <Text style={styles.icon}>{item.icon}</Text>
              </View>

              <View style={styles.textContainer}>
                <View style={styles.titleRow}>
                  <Text style={[styles.itemTitle, { color: theme.text }]}>{item.title}</Text>
                  {item.badge !== undefined && (
                    <View style={[styles.badge, { backgroundColor: theme.destructive }]}>
                      <Text style={styles.badgeText}>{item.badge}</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.itemSub, { color: theme.muted }]}>{item.subtitle}</Text>
              </View>

              <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
            </View>
          </Card>
        ))}
      </View>
    </Screen>
  );
};

const styles = StyleSheet.create({
  header: {
    marginVertical: SPACING.md,
  },
  title: {
    fontSize: TYPOGRAPHY.xxl,
    fontWeight: '700',
  },
  list: {
    gap: SPACING.xs,
  },
  card: {
    padding: SPACING.md,
  },
  cardRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: RADIUS.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 22,
  },
  textContainer: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  itemTitle: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '600',
  },
  itemSub: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: RADIUS.full,
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: TYPOGRAPHY.xs,
    fontWeight: '700',
  },
});

