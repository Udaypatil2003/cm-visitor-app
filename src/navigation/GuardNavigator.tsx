import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator }   from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet }     from 'react-native';

import { GuardStackParamList }   from './types';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '../constants/theme';

import GuardHomeScreen       from '../app/guard/GuardHomeScreen';
import QRScannerScreen       from '../app/guard/QRScannerScreen';
import ScanResultScreen      from '../app/guard/ScanResultScreen';
import GuardBookVisitorScreen from '../app/guard/GuardBookVisitorScreen';

// ─── Tab param list (two root tabs) ───────────────────────────────────────────

type GuardTabParamList = {
  ScanTab: undefined;
  BookTab: undefined;
};

// ─── Scan stack (Home → Scanner → Result) ────────────────────────────────────

type ScanStackParamList = Pick<GuardStackParamList, 'GuardHome' | 'QRScanner' | 'ScanResult'>;
const ScanStack = createNativeStackNavigator<ScanStackParamList>();

function ScanNavigator() {
  return (
    <ScanStack.Navigator screenOptions={{ headerShown: false }}>
      <ScanStack.Screen name="GuardHome"   component={GuardHomeScreen} />
      <ScanStack.Screen
        name="QRScanner"
        component={QRScannerScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <ScanStack.Screen
        name="ScanResult"
        component={ScanResultScreen}
        options={{ animation: 'slide_from_right', gestureEnabled: false }}
      />
    </ScanStack.Navigator>
  );
}

// ─── Book stack (single screen for now) ──────────────────────────────────────

type BookStackParamList = Pick<GuardStackParamList, 'GuardBookVisitor'>;
const BookStack = createNativeStackNavigator<BookStackParamList>();

function BookNavigator() {
  return (
    <BookStack.Navigator screenOptions={{ headerShown: false }}>
      <BookStack.Screen name="GuardBookVisitor" component={GuardBookVisitorScreen} />
    </BookStack.Navigator>
  );
}

// ─── Tab navigator ────────────────────────────────────────────────────────────

const Tab = createBottomTabNavigator<GuardTabParamList>();

export function GuardNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <GuardTabBar {...props} />}
    >
      <Tab.Screen name="ScanTab" component={ScanNavigator} />
      <Tab.Screen name="BookTab" component={BookNavigator} />
    </Tab.Navigator>
  );
}

// ─── Custom tab bar ───────────────────────────────────────────────────────────

function GuardTabBar({ state, navigation }: any) {
  const TABS = [
    { route: 'ScanTab', icon: '📷', label: 'Scan QR'       },
    { route: 'BookTab', icon: '📋', label: 'Book Visitor'  },
  ];

  return (
    <View style={tb.bar}>
      {TABS.map((tab, i) => {
        const focused = state.index === i;
        return (
          <View key={tab.route} style={tb.tab}>
            <Text
              style={[tb.icon, focused && tb.iconActive]}
              onPress={() => navigation.navigate(tab.route)}
            >
              {tab.icon}
            </Text>
            <Text style={[tb.label, focused && tb.labelActive]}>
              {tab.label}
            </Text>
            {focused && <View style={tb.dot} />}
          </View>
        );
      })}
    </View>
  );
}

const tb = StyleSheet.create({
  bar: {
    flexDirection:   'row',
    backgroundColor: Colors.navy,
    paddingVertical: Spacing[3],
    borderTopWidth:  1,
    borderTopColor:  Colors.navyMid,
  },
  tab: {
    flex:       1,
    alignItems: 'center',
    gap:        4,
  },
  icon: {
    fontSize: 24,
    opacity:  0.45,
  },
  iconActive: {
    opacity: 1,
  },
  label: {
    fontSize:   FontSizes.xs,
    fontWeight: FontWeights.medium,
    color:      Colors.gray500,
  },
  labelActive: {
    color:      Colors.gold,
    fontWeight: FontWeights.bold,
  },
  dot: {
    width:           4,
    height:          4,
    borderRadius:    BorderRadius.full,
    backgroundColor: Colors.gold,
    marginTop:       2,
  },
});