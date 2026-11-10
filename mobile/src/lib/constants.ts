import { Platform } from 'react-native';

const DEFAULT_LOCAL_HOST = Platform.OS === 'android' ? '10.0.2.2' : 'localhost';

export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL || 'https://syncmate-2d9o.onrender.com/api/v1';

export const SOCKET_URL =
  process.env.EXPO_PUBLIC_SOCKET_URL || 'https://syncmate-2d9o.onrender.com';

export const WEB_URL =
  process.env.EXPO_PUBLIC_WEB_URL || 'https://syncmate.app';

export const SECURE_KEYS = {
  ACCESS_TOKEN: 'syncmate_access_token',
  REFRESH_TOKEN: 'syncmate_refresh_token',
  DEVICE_ID: 'syncmate_device_id',
} as const;

export const CATEGORY_LABELS = {
  hackathon: 'Hackathon',
  college: 'College',
  personal: 'Personal',
  meeting: 'Meeting',
  competition: 'Competition',
  other: 'Other',
} as const;

export const PRIORITY_LABELS = {
  high: 'High',
  medium: 'Medium',
  low: 'Low',
} as const;

export const PRIORITY_ICONS = {
  high: '🔴',
  medium: '🟡',
  low: '🟢',
} as const;

export const PARTICIPATION_LABELS = {
  interested: 'Interested',
  planning: 'Planning to register',
  registered: 'Registered',
  not_interested: 'Not interested',
} as const;

export const PARTICIPATION_ICONS = {
  interested: '👀',
  planning: '🗓️',
  registered: '✅',
  not_interested: '✖️',
} as const;

