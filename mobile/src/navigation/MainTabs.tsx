import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MainTabParamList } from './types';
import { HomeScreen } from '../features/dashboard/HomeScreen';
import { CalendarScreen } from '../features/calendar/CalendarScreen';
import { WatchlistScreen } from '../features/watchlist/WatchlistScreen';
import { MoreScreen } from '../features/dashboard/MoreScreen';
import { useTheme } from '../theme/useTheme';
import { RADIUS, TYPOGRAPHY } from '../theme/tokens';
import { haptics } from '../lib/haptics';

const Tab = createBottomTabNavigator<MainTabParamList>();

// Empty placeholder for modal trigger
const EmptyComponent = () => null;

export const MainTabs: React.FC = () => {
  const { theme } = useTheme();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: theme.tabBarBg,
          borderTopColor: theme.tabBarBorder,
          height: Platform.OS === 'ios' ? 88 : 64,
          paddingBottom: Platform.OS === 'ios' ? 28 : 10,
          paddingTop: 8,
        },
        tabBarActiveTintColor: theme.primary,
        tabBarInactiveTintColor: theme.muted,
        tabBarLabelStyle: {
          fontSize: TYPOGRAPHY.xs,
          fontWeight: '600',
        },
      }}
    >
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>🏠</Text>,
        }}
      />

      <Tab.Screen
        name="Calendar"
        component={CalendarScreen}
        options={{
          tabBarLabel: 'Calendar',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📅</Text>,
        }}
      />

      <Tab.Screen
        name="AddEventModalTrigger"
        component={EmptyComponent}
        options={({ navigation }) => ({
          tabBarLabel: '',
          tabBarButton: () => (
            <TouchableOpacity
              accessibilityRole="button"
              accessibilityLabel="Add new event"
              activeOpacity={0.85}
              onPress={() => {
                haptics.medium();
                (navigation as any).navigate('EventForm', {});
              }}
              style={styles.centerBtnContainer}
            >
              <View style={[styles.centerBtn, { backgroundColor: theme.primary }]}>
                <Text style={styles.centerPlus}>＋</Text>
              </View>
            </TouchableOpacity>
          ),
        })}
      />

      <Tab.Screen
        name="Saved"
        component={WatchlistScreen}
        options={{
          tabBarLabel: 'Saved',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>📌</Text>,
        }}
      />

      <Tab.Screen
        name="More"
        component={MoreScreen}
        options={{
          tabBarLabel: 'More',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 20 }}>⋯</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  centerBtnContainer: {
    top: -16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  centerBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  centerPlus: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
});
