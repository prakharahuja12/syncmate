import * as SecureStore from 'expo-secure-store';
import { SECURE_KEYS } from './constants';

export const secureStorage = {
  async getAccessToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.ACCESS_TOKEN);
    } catch {
      return null;
    }
  },

  async setAccessToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_KEYS.ACCESS_TOKEN, token);
    } catch (err) {
      console.warn('Failed to store access token:', err);
    }
  },

  async getRefreshToken(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } catch {
      return null;
    }
  },

  async setRefreshToken(token: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_KEYS.REFRESH_TOKEN, token);
    } catch (err) {
      console.warn('Failed to store refresh token:', err);
    }
  },

  async clearTokens(): Promise<void> {
    try {
      await SecureStore.deleteItemAsync(SECURE_KEYS.ACCESS_TOKEN);
      await SecureStore.deleteItemAsync(SECURE_KEYS.REFRESH_TOKEN);
    } catch (err) {
      console.warn('Failed to clear tokens:', err);
    }
  },

  async getDeviceId(): Promise<string | null> {
    try {
      return await SecureStore.getItemAsync(SECURE_KEYS.DEVICE_ID);
    } catch {
      return null;
    }
  },

  async setDeviceId(deviceId: string): Promise<void> {
    try {
      await SecureStore.setItemAsync(SECURE_KEYS.DEVICE_ID, deviceId);
    } catch (err) {
      console.warn('Failed to store deviceId:', err);
    }
  },
};

