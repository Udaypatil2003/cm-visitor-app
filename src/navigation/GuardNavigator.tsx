import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import { GuardStackParamList } from './types';

// Screens
import GuardHomeScreen from '../app/guard/GuardHomeScreen';
import QRScannerScreen from '../app/guard/QRScannerScreen';
import ScanResultScreen from '../app/guard/ScanResultScreen';

const Stack = createNativeStackNavigator<GuardStackParamList>();

export function GuardNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName="GuardHome"
    >
      <Stack.Screen
        name="GuardHome"
        component={GuardHomeScreen}
      />
      <Stack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <Stack.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{
          animation: 'slide_from_right',
          gestureEnabled: false,         // must use "Scan Next" button — no swipe back
        }}
      />
    </Stack.Navigator>
  );
}