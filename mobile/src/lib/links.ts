import * as WebBrowser from 'expo-web-browser';
import { Linking, Alert } from 'react-native';

export const isValidHttpUrl = (url: string): boolean => {
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return /^https?:\/\/.+/i.test(url);
  }
};

export const openExternalLink = async (url?: string | null, inApp = true): Promise<boolean> => {
  if (!url || !url.trim()) {
    Alert.alert('Invalid URL', 'No link was provided for this event.');
    return false;
  }

  const cleanUrl = url.trim();
  if (!isValidHttpUrl(cleanUrl)) {
    Alert.alert('Security Warning', 'Only http:// and https:// URLs can be opened.');
    return false;
  }

  try {
    if (inApp) {
      await WebBrowser.openBrowserAsync(cleanUrl, {
        presentationStyle: WebBrowser.WebBrowserPresentationStyle.PAGE_SHEET,
        controlsColor: '#5B5BD6',
      });
      return true;
    }

    const canOpen = await Linking.canOpenURL(cleanUrl);
    if (canOpen) {
      await Linking.openURL(cleanUrl);
      return true;
    } else {
      Alert.alert('Cannot Open Link', 'Your device does not support opening this web link.');
      return false;
    }
  } catch (err) {
    console.warn('Error opening link:', err);
    try {
      await Linking.openURL(cleanUrl);
      return true;
    } catch {
      Alert.alert('Error', 'Failed to open the requested link.');
      return false;
    }
  }
};

