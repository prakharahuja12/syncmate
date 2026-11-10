import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { secureStorage } from './secureStorage';
import { apiClient } from './api';
import { useUiStore } from '../stores/uiStore';

// Configure foreground notification presentation
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
  }),
});

export const setupPushChannels = async () => {
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('syncmate-default', {
      name: 'SyncMate Default',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#5B5BD6',
    });

    await Notifications.setNotificationChannelAsync('syncmate-reminders', {
      name: 'SyncMate Reminders',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 500, 250, 500],
      lightColor: '#E5484D',
    });
  }
};

export const registerForPushNotifications = async (): Promise<string | null> => {
  try {
    await setupPushChannels();

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return null;
    }

    const tokenData = await Notifications.getDevicePushTokenAsync();
    const token = tokenData.data;

    let deviceId = await secureStorage.getDeviceId();
    if (!deviceId) {
      deviceId = `dev_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
      await secureStorage.setDeviceId(deviceId);
    }

    const platform = Platform.OS === 'ios' ? 'ios' : 'android';

    // Register token with backend
    await apiClient.post('/users/me/push-tokens', {
      token,
      platform,
      deviceId,
    });

    return token;
  } catch (err) {
    console.warn('Push registration error:', err);
    return null;
  }
};

export const unregisterPushToken = async (): Promise<void> => {
  try {
    const tokenData = await Notifications.getDevicePushTokenAsync();
    if (tokenData?.data) {
      await apiClient.delete('/users/me/push-tokens', {
        data: { token: tokenData.data },
      });
    }
  } catch (err) {
    console.warn('Push unregistration error:', err);
  }
};

export const setupNotificationListeners = () => {
  // Cold-start notification check
  Notifications.getLastNotificationResponseAsync().then((response) => {
    const deepLink = response?.notification?.request?.content?.data?.deepLink;
    if (deepLink) {
      useUiStore.getState().setPendingDeepLink(deepLink as string);
    }
  });

  // Warm-start / running notification response
  const responseSubscription = Notifications.addNotificationResponseReceivedListener((response) => {
    const deepLink = response?.notification?.request?.content?.data?.deepLink;
    if (deepLink) {
      useUiStore.getState().setPendingDeepLink(deepLink as string);
    }
  });

  return () => {
    responseSubscription.remove();
  };
};

