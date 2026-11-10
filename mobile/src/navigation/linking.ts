import { LinkingOptions } from '@react-navigation/native';
import * as Linking from 'expo-linking';
import { RootStackParamList } from './types';

const prefix = Linking.createURL('/');

export const linking: LinkingOptions<RootStackParamList> = {
  prefixes: [prefix, 'syncmate://', 'https://syncmate.app'],
  config: {
    screens: {
      Onboarding: {
        screens: {
          JoinGroup: 'join/:initialCode',
        },
      },
      EventDetails: 'event/:eventId',
      Main: {
        screens: {
          Saved: 'watchlist',
          Home: 'home',
          Calendar: 'calendar',
          More: 'more',
        },
      },
      Notifications: 'notifications',
      GoogleSync: 'integrations',
    },
  },
};

