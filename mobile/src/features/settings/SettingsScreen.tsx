import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Toast from 'react-native-toast-message';
import { Screen } from '../../components/common/Screen';
import { useTheme } from '../../theme/useTheme';
import { useAuthStore } from '../../stores/authStore';
import { useUiStore } from '../../stores/uiStore';
import { RADIUS, SPACING, TYPOGRAPHY } from '../../theme/tokens';
import { Card } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Avatar } from '../../components/ui/Avatar';
import { SegmentedControl } from '../../components/ui/SegmentedControl';
import { settingsApi } from './api';
import { authApi } from '../auth/api';
import { disconnectSocket } from '../../lib/socket';
import { unregisterPushToken } from '../../lib/push';
import { haptics } from '../../lib/haptics';

export const SettingsScreen: React.FC<{ navigation: any }> = ({ navigation }) => {
  const { theme, themePreference, setThemePreference } = useTheme();
  const queryClient = useQueryClient();
  const user = useAuthStore((s) => s.user);
  const clearSession = useAuthStore((s) => s.clearSession);

  const tapHackathonDirectly = useUiStore((s) => s.tapHackathonOpensLinkDirectly);
  const setTapHackathonDirectly = useUiStore((s) => s.setTapHackathonOpensLinkDirectly);

  const [pushNotifs, setPushNotifs] = useState(user?.settings?.pushNotifications ?? true);
  const [inAppNotifs, setInAppNotifs] = useState(user?.settings?.inAppNotifications ?? true);
  const [emailNotifs, setEmailNotifs] = useState(user?.settings?.emailNotifications ?? true);

  const updateSettingsMutation = useMutation({
    mutationFn: (newSettings: any) =>
      settingsApi.updateUser({ settings: newSettings }),
    onSuccess: () => {
      haptics.light();
      Toast.show({ type: 'success', text1: 'Preferences saved' });
    },
  });

  const handleTogglePush = (val: boolean) => {
    setPushNotifs(val);
    updateSettingsMutation.mutate({ pushNotifications: val });
  };

  const handleToggleInApp = (val: boolean) => {
    setInAppNotifs(val);
    updateSettingsMutation.mutate({ inAppNotifications: val });
  };

  const handleToggleEmail = (val: boolean) => {
    setEmailNotifs(val);
    updateSettingsMutation.mutate({ emailNotifications: val });
  };

  const handleLogout = () => {
    Alert.alert('Sign Out', 'Are you sure you want to log out of SyncMate?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          haptics.warning();
          await unregisterPushToken();
          await authApi.logout();
          disconnectSocket();
          queryClient.clear();
          await clearSession();
        },
      },
    ]);
  };

  return (
    <Screen scrollable>
      <View style={styles.header}>
        <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
      </View>

      {/* Profile Card */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Profile</Text>
      <Card style={styles.profileCard}>
        <Avatar user={user} size={50} />
        <View style={styles.profileInfo}>
          <Text style={[styles.profileName, { color: theme.text }]}>{user?.name}</Text>
          <Text style={[styles.profileEmail, { color: theme.muted }]}>{user?.email}</Text>
          <Text style={[styles.timezoneText, { color: theme.muted }]}>
            🌍 {user?.timezone || 'Asia/Kolkata'}
          </Text>
        </View>
      </Card>

      {/* Appearance */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Appearance</Text>
      <Card style={styles.card}>
        <Text style={[styles.settingLabel, { color: theme.text, marginBottom: SPACING.sm }]}>
          Theme Preference
        </Text>
        <SegmentedControl
          options={[
            { label: 'System', value: 'system' },
            { label: 'Dark', value: 'dark' },
            { label: 'Light', value: 'light' },
          ]}
          selectedValue={themePreference}
          onValueChange={setThemePreference}
        />
      </Card>

      {/* Hackathon Tap Behavior */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Event Interactions</Text>
      <Card style={styles.card}>
        <View style={styles.switchRow}>
          <View style={{ flex: 1, paddingRight: SPACING.md }}>
            <Text style={[styles.settingLabel, { color: theme.text }]}>
              Tapping hackathon opens link directly
            </Text>
            <Text style={[styles.settingDesc, { color: theme.muted }]}>
              Opens the official registration page via in-app browser instead of details sheet
            </Text>
          </View>
          <Switch
            value={tapHackathonDirectly}
            onValueChange={setTapHackathonDirectly}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </Card>

      {/* Notifications */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Notifications</Text>
      <Card style={styles.card}>
        <View style={[styles.switchRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Push Notifications</Text>
          <Switch
            value={pushNotifs}
            onValueChange={handleTogglePush}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
        <View style={[styles.switchRow, { borderBottomWidth: 1, borderBottomColor: theme.border }]}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>In-App Notifications</Text>
          <Switch
            value={inAppNotifs}
            onValueChange={handleToggleInApp}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
        <View style={styles.switchRow}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Email Notifications</Text>
          <Switch
            value={emailNotifs}
            onValueChange={handleToggleEmail}
            trackColor={{ false: theme.border, true: theme.primary }}
          />
        </View>
      </Card>

      {/* Integrations */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>Integrations</Text>
      <Card
        onPress={() => navigation.navigate('GoogleSync')}
        style={styles.card}
      >
        <View style={styles.rowBetween}>
          <View>
            <Text style={[styles.settingLabel, { color: theme.text }]}>Google Calendar</Text>
            <Text style={[styles.settingDesc, { color: theme.muted }]}>
              Manage one-way sync to your personal calendar
            </Text>
          </View>
          <Text style={{ color: theme.muted, fontSize: 18 }}>›</Text>
        </View>
      </Card>

      {/* About & Logout */}
      <Text style={[styles.sectionTitle, { color: theme.text }]}>App Information</Text>
      <Card style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={[styles.settingLabel, { color: theme.text }]}>Version</Text>
          <Text style={{ color: theme.muted }}>1.0.0 (Expo SDK 52)</Text>
        </View>
      </Card>

      <Button
        title="Sign Out"
        onPress={handleLogout}
        variant="destructive"
        size="lg"
        style={styles.logoutBtn}
      />
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
  sectionTitle: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
  },
  profileInfo: {
    marginLeft: SPACING.md,
    flex: 1,
  },
  profileName: {
    fontSize: TYPOGRAPHY.md,
    fontWeight: '700',
  },
  profileEmail: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
  },
  timezoneText: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 4,
  },
  card: {
    padding: SPACING.md,
  },
  settingLabel: {
    fontSize: TYPOGRAPHY.sm,
    fontWeight: '600',
  },
  settingDesc: {
    fontSize: TYPOGRAPHY.xs,
    marginTop: 2,
    lineHeight: 16,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
    minHeight: 44,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    minHeight: 44,
  },
  logoutBtn: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.xxl * 2,
  },
});

