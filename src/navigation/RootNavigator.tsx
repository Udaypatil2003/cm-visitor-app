import React, { useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { View, ActivityIndicator, StyleSheet } from "react-native";

import { useAuthStore } from "../store/authStore";
import { Colors } from "../constants/theme";

import { CitizenNavigator } from "./CitizenNavigator";
import { GuardNavigator } from "./GuardNavigator";
import SplashScreen from "../app/auth/SplashScreen";
import LoginScreen from "../app/auth/LoginScreen";
import CitizenOnboardingScreen from "../app/auth/CitizenOnboardingScreen";
import { AuthStackParamList } from "./types";

// ─── Typed root param list ────────────────────────────────────────────────────

type RootStackParamList = {
  Boot: undefined;
  Auth: undefined;
  Onboarding: undefined;
  Citizen: undefined;
  Guard: undefined;
};

const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="Splash"
    >
      <AuthStack.Screen name="Splash" component={SplashScreen} />
      <AuthStack.Screen name="Login" component={LoginScreen} />
      {/* CitizenOnboarding removed — RootStack owns it now */}
    </AuthStack.Navigator>
  );
}

function BootLoader() {
  return (
    <View style={styles.bootLoader}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );
}

export default function RootNavigator() {
  const {
    isAuthenticated,
    isLoading,
    role,
    needsOnboarding,
    hydrateFromStorage,
  } = useAuthStore();

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
        ) : needsOnboarding ? (
          <RootStack.Screen name="Onboarding" component={CitizenOnboardingScreen} />
        ) : role === "citizen" ? (
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
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.white,
  },
});