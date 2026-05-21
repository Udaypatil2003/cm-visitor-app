import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { View, ActivityIndicator, StyleSheet } from 'react-native';

import { useAuthStore } from '../store/authStore';
import { Colors } from '../constants/theme';

// Navigators
import { CitizenNavigator } from './CitizenNavigator';
import { GuardNavigator } from './GuardNavigator';

// Auth Screens — lazy imports keep bundle clean
import SplashScreen from '../app/auth/SplashScreen';
import WelcomeScreen from '../app/auth/WelcomeScreen';
import CitizenOnboardingScreen from '../app/auth/CitizenOnboardingScreen';
import LoginScreen from '../app/auth/LoginScreen';


import { AuthStackParamList } from './types';

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator();

// ─── Auth Stack ───────────────────────────────────────────────────────────────

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen
        name="CitizenOnboarding"
        component={CitizenOnboardingScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,
        }}
      />
    </AuthStack.Navigator>
  );
}

// ─── Boot Loader ──────────────────────────────────────────────────────────────
// Shown while hydrateFromStorage() runs on first launch

function BootLoader() {
  return (
    <View style={styles.bootLoader}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

// ─── Root Navigator ───────────────────────────────────────────────────────────

export default function RootNavigator() {
  const { isAuthenticated, isLoading, role, hydrateFromStorage } = useAuthStore();

  useEffect(() => {
    hydrateFromStorage();
  }, []);

  return (
    <NavigationContainer>
      <RootStack.Navigator screenOptions={{ headerShown: false }}>
        {isLoading ? (
          <RootStack.Screen name="Boot" component={BootLoader} />
        ) : !isAuthenticated ? (
          <RootStack.Screen name="Auth" component={AuthNavigator} />
        ) : role === 'citizen' ? (
          <RootStack.Screen name="Citizen" component={CitizenNavigator} />
        ) : (
          <RootStack.Screen name="Guard" component={GuardNavigator} />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  bootLoader: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.white,
  },
});