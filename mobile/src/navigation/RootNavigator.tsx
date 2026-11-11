import React, { useEffect } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { AuthStack } from './AuthStack';
import { OnboardingStack } from './OnboardingStack';
import { MainTabs } from './MainTabs';
import { EventFormModal } from '../features/events/EventFormModal';
import { EventDetailsSheet } from '../features/events/EventDetailsSheet';
import { TasksScreen } from '../features/tasks/TasksScreen';
import { NotificationCenterScreen } from '../features/notifications/NotificationCenterScreen';
import { GroupDetailsScreen } from '../features/group/GroupDetailsScreen';
import { SettingsScreen } from '../features/settings/SettingsScreen';
import { GoogleSyncScreen } from '../features/settings/GoogleSyncScreen';
import { linking } from './linking';
import { useAuthStore } from '../stores/authStore';
import { useUiStore } from '../stores/uiStore';
import { useTheme } from '../theme/useTheme';
import { authApi } from '../features/auth/api';
import { secureStorage } from '../lib/secureStorage';
import { startServerWarmup } from '../lib/serverStatus';
import { ServerWakeupBanner } from '../components/common/ServerWakeupBanner';
import { initSocket } from '../lib/socket';
import { setupNotificationListeners } from '../lib/push';

const Stack = createNativeStackNavigator<RootStackParamList>();

export const RootNavigator: React.FC = () => {
  const { theme } = useTheme();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const group = useAuthStore((s) => s.group);
  const isBootstrapping = useAuthStore((s) => s.isBootstrapping);
  const setSession = useAuthStore((s) => s.setSession);
  const setIsBootstrapping = useAuthStore((s) => s.setIsBootstrapping);
  const pendingDeepLink = useUiStore((s) => s.pendingDeepLink);

  useEffect(() => {
    let isMounted = true;

    // Bootstrapping auth & waking up Render server
    const bootstrap = async () => {
      try {
        const warmup = startServerWarmup();
        const refreshToken = await secureStorage.getRefreshToken();
        if (!refreshToken) {
          if (isMounted) setIsBootstrapping(false);
          return;
        }

        const awake = await warmup;
        if (!awake) {
          if (isMounted) setIsBootstrapping(false);
          return;
        }

        const meRes = await authApi.getMe();
        const accessToken = (await secureStorage.getAccessToken()) || '';
        if (isMounted) {
          await setSession(meRes.user, meRes.group, accessToken, refreshToken);
          await initSocket();
        }
      } catch (err) {
        await secureStorage.clearTokens();
      } finally {
        if (isMounted) setIsBootstrapping(false);
      }
    };

    bootstrap();
    const unsubNotifs = setupNotificationListeners();

    return () => {
      isMounted = false;
      unsubNotifs();
    };
  }, []);

  if (isBootstrapping) {
    return (
      <View style={[styles.bootContainer, { backgroundColor: theme.bg }]}>
        <ActivityIndicator size="large" color={theme.primary} />
        <View style={styles.bootBannerWrap}>
          <ServerWakeupBanner />
        </View>
      </View>
    );
  }

  const baseNavTheme = theme.isDark ? DarkTheme : DefaultTheme;
  const navTheme = {
    ...baseNavTheme,
    dark: theme.isDark,
    colors: {
      ...baseNavTheme.colors,
      primary: theme.primary,
      background: theme.bg,
      card: theme.card,
      text: theme.text,
      border: theme.border,
      notification: theme.destructive,
    },
  };

  return (
    <NavigationContainer
      linking={linking}
      theme={navTheme}
    >
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {!isAuthenticated ? (
          <Stack.Screen name="Auth" component={AuthStack} />
        ) : !group ? (
          <Stack.Screen name="Onboarding" component={OnboardingStack} />
        ) : (
          <>
            <Stack.Screen name="Main" component={MainTabs} />

            {/* Full-screen modal for event creation & edit */}
            <Stack.Screen
              name="EventForm"
              component={EventFormModal}
              options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
            />

            {/* Event details screen */}
            <Stack.Screen
              name="EventDetails"
              component={EventDetailsSheet}
              options={{ presentation: 'modal', animation: 'slide_from_bottom' }}
            />

            {/* Standalone pushed screens */}
            <Stack.Screen
              name="Tasks"
              component={TasksScreen}
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Notifications"
              component={NotificationCenterScreen}
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="GroupDetails"
              component={GroupDetailsScreen}
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="Settings"
              component={SettingsScreen}
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
            <Stack.Screen
              name="GoogleSync"
              component={GoogleSyncScreen}
              options={{ presentation: 'card', animation: 'slide_from_right' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  bootContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  bootBannerWrap: {
    width: '100%',
    maxWidth: 360,
    marginTop: 20,
  },
});
