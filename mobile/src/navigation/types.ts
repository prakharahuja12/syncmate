import { NavigatorScreenParams } from '@react-navigation/native';
import { EventItem } from '../types/api';

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type OnboardingStackParamList = {
  CreateOrJoin: undefined;
  CreateGroup: undefined;
  JoinGroup: { initialCode?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Calendar: undefined;
  AddEventModalTrigger: undefined;
  Saved: undefined;
  More: undefined;
};

export type RootStackParamList = {
  Boot: undefined;
  Auth: NavigatorScreenParams<AuthStackParamList>;
  Onboarding: NavigatorScreenParams<OnboardingStackParamList>;
  Main: NavigatorScreenParams<MainTabParamList>;
  EventForm: { eventId?: string; initialDate?: string; initialCategory?: string };
  EventDetails: { eventId: string; initialEvent?: EventItem };
  Tasks: undefined;
  Notifications: undefined;
  GroupDetails: undefined;
  Settings: undefined;
  GoogleSync: undefined;
};

