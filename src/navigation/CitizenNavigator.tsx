import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { Colors, FontSizes, FontWeights, Spacing } from '../constants/theme';
import { CitizenStackParamList, CitizenTabParamList } from './types';

// Screens
import CitizenHomeScreen from '../app/citizen/CitizenHomeScreen';
import MyAppointmentsScreen from '../app/citizen/MyAppointmentsScreen';
import EditProfileScreen from '../app/citizen/EditProfileScreen';
import BookAppointmentScreen from '../app/citizen/BookAppointmentScreen';
import AppointmentConfirmScreen from '../app/citizen/AppointmentConfirmScreen';
import AppointmentDetailScreen from '../app/citizen/AppointmentDetailScreen';

const Tab = createBottomTabNavigator<CitizenTabParamList>();
const Stack = createNativeStackNavigator<CitizenStackParamList>();

// ─── Tab Icons (text-based, no icon lib dependency) ───────────────────────────

interface TabIconProps {
  emoji: string;
  label: string;
  focused: boolean;
}

function TabIcon({ emoji, label, focused }: TabIconProps) {
  return (
    <View style={tabStyles.iconContainer}>
      <Text style={tabStyles.emoji}>{emoji}</Text>
      <Text
        style={[
          tabStyles.label,
          { color: focused ? Colors.primary : Colors.gray500 },
        ]}
      >
        {label}
      </Text>
    </View>
  );
}

const tabStyles = StyleSheet.create({
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    paddingTop: Spacing[1],
  },
  emoji: {
    fontSize: 22,
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.medium,
  },
});

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

function CitizenTabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: Colors.white,
          borderTopColor: Colors.border,
          borderTopWidth: 1,
          height: Platform.OS === 'ios' ? 84 : 64,
          paddingBottom: Platform.OS === 'ios' ? 24 : 8,
        },
      }}
    >
      <Tab.Screen
        name="CitizenHome"
        component={CitizenHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="📋" label="Appointments" focused={focused} />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={EditProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Citizen Stack (tabs + modals + push screens) ─────────────────────────────

export function CitizenNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs root */}
      <Stack.Screen name="CitizenTabs" component={CitizenTabs} />

      {/* Modal screens — slide up from bottom */}
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="AppointmentConfirm"
        component={AppointmentConfirmScreen}
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
          gestureEnabled: false,
        }}
      />

      {/* Push screen — slide from right */}
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />

      {/* Push screen */}
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </Stack.Navigator>
  );
}