/**
 * GuardHomeScreen.tsx
 *
 * Simple entry screen for the Guard role.
 *   • Shows guard name from authStore
 *   • Large "Scan QR" CTA → QRScannerScreen
 *   • Logout in header → clears authStore → RootNavigator sends to Auth
 *
 * Rules observed:
 *   • Zero hardcoded colours — theme.ts only
 *   • No business logic — navigation + store actions only
 *   • TypeScript strict
 */

import React, { useCallback } from 'react';
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation }     from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
  Shadows,
} from '../../constants/theme';
import { useAuthStore }  from '../../store/authStore';
import type { GuardStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<GuardStackParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GuardHomeScreen() {
  const navigation = useNavigation<Nav>();
  const insets     = useSafeAreaInsets();

  const guardUser = useAuthStore((s) => s.guardUser);
  const logout    = useAuthStore((s) => s.logout);

  const handleLogout = useCallback(() => {
    logout();
    // RootNavigator watches isAuthenticated — will redirect to AuthStack automatically
  }, [logout]);

  const handleScan = useCallback(() => {
    navigation.navigate('QRScanner');
  }, [navigation]);

  // First name only for the greeting
  const firstName = guardUser?.fullName?.split(' ')[0] ?? 'Guard';

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>

      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          {/* Gate badge */}
          <View style={styles.gateBadge}>
            <Text style={styles.gateBadgeText}>🛡 GATE</Text>
          </View>
          <Text style={styles.headerTitle}>CM Bungalow</Text>
        </View>
        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          hitSlop={12}
          activeOpacity={0.75}
        >
          <Text style={styles.logoutText}>Logout</Text>
        </TouchableOpacity>
      </View>

      {/* ── Body ── */}
      <View style={styles.body}>

        {/* Greeting card */}
        <View style={styles.greetingCard}>
          <View style={styles.greetingIconCircle}>
            <Text style={styles.greetingIcon}>👮</Text>
          </View>
          <Text style={styles.greetingLabel}>ON DUTY</Text>
          <Text style={styles.greetingName}>Welcome, {firstName}</Text>
          <Text style={styles.greetingRole}>Security Guard · Main Gate</Text>
        </View>

        {/* Instructions card */}
        <View style={styles.instructionCard}>
          <Text style={styles.instructionTitle}>How to verify entry</Text>
          {STEPS.map((step, i) => (
            <View key={i} style={styles.stepRow}>
              <View style={styles.stepBadge}>
                <Text style={styles.stepNum}>{i + 1}</Text>
              </View>
              <Text style={styles.stepText}>{step}</Text>
            </View>
          ))}
        </View>

        {/* Scan CTA */}
        <TouchableOpacity
          style={styles.scanBtn}
          onPress={handleScan}
          activeOpacity={0.88}
        >
          <Text style={styles.scanBtnIcon}>📷</Text>
          <Text style={styles.scanBtnLabel}>Scan Visitor QR</Text>
          <Text style={styles.scanBtnArrow}>›</Text>
        </TouchableOpacity>

        <Text style={styles.hint}>
          Tap to open the camera and scan a visitor's QR pass
        </Text>
      </View>
    </View>
  );
}

// ─── Data ─────────────────────────────────────────────────────────────────────

const STEPS = [
  'Ask visitor to open their QR pass on their phone.',
  'Tap "Scan Visitor QR" to open the camera.',
  'Align the QR code inside the frame.',
  'Confirm the visitor details on the result screen.',
];

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navyLight,
  },

  // ── Header ──
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    backgroundColor: Colors.navy,
    paddingHorizontal: Spacing[4],
    paddingVertical:   Spacing[4],
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[2],
  },
  gateBadge: {
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing[2],
    paddingVertical:   3,
    borderRadius:      BorderRadius.sm,
  },
  gateBadgeText: {
    fontSize:   FontSizes.xs,
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
  },
  headerTitle: {
    fontSize:   FontSizes.lg,
    fontWeight: FontWeights.bold,
    color:      Colors.white,
  },
  logoutBtn: {
    backgroundColor: Colors.navyMid,
    paddingHorizontal: Spacing[3],
    paddingVertical:   Spacing[2],
    borderRadius:      BorderRadius.full,
  },
  logoutText: {
    fontSize:   FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color:      Colors.gray400,
  },

  // ── Body ──
  body: {
    flex:              1,
    paddingHorizontal: Spacing[4],
    paddingTop:        Spacing[6],
    gap:               Spacing[4],
  },

  // ── Greeting card ──
  greetingCard: {
    backgroundColor: Colors.navy,
    borderRadius:    BorderRadius.lg,
    alignItems:      'center',
    paddingVertical: Spacing[6],
    gap:             Spacing[1],
    ...Shadows.md,
  },
  greetingIconCircle: {
    width:           64,
    height:          64,
    borderRadius:    BorderRadius.full,
    backgroundColor: Colors.navyMid,
    alignItems:      'center',
    justifyContent:  'center',
    marginBottom:    Spacing[2],
  },
  greetingIcon:  { fontSize: 32 },
  greetingLabel: {
    fontSize:        FontSizes.xs,
    fontWeight:      FontWeights.bold,
    color:           Colors.gold,
    letterSpacing:   1.5,
    marginBottom:    Spacing[1],
  },
  greetingName: {
    fontSize:   FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color:      Colors.white,
  },
  greetingRole: {
    fontSize: FontSizes.sm,
    color:    Colors.gray400,
  },

  // ── Instruction card ──
  instructionCard: {
    backgroundColor: Colors.white,
    borderRadius:    BorderRadius.md,
    padding:         Spacing[4],
    gap:             Spacing[3],
    ...Shadows.base,
  },
  instructionTitle: {
    fontSize:   FontSizes.base,
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
    marginBottom: Spacing[1],
  },
  stepRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing[3],
  },
  stepBadge: {
    width:           24,
    height:          24,
    borderRadius:    BorderRadius.full,
    backgroundColor: Colors.goldLight,
    alignItems:      'center',
    justifyContent:  'center',
    flexShrink:      0,
  },
  stepNum: {
    fontSize:   FontSizes.xs,
    fontWeight: FontWeights.bold,
    color:      Colors.goldDark,
  },
  stepText: {
    flex:       1,
    fontSize:   FontSizes.sm,
    color:      Colors.textSecondary,
    lineHeight: 20,
  },

  // ── Scan CTA ──
  scanBtn: {
    flexDirection:     'row',
    alignItems:        'center',
    backgroundColor:   Colors.gold,
    borderRadius:      BorderRadius.lg,
    paddingVertical:   Spacing[5],
    paddingHorizontal: Spacing[6],
    gap:               Spacing[3],
    ...Shadows.md,
  },
  scanBtnIcon: {
    fontSize: 28,
  },
  scanBtnLabel: {
    flex:       1,
    fontSize:   FontSizes.xl,
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
  },
  scanBtnArrow: {
    fontSize:   FontSizes['3xl'],
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
  },

  hint: {
    fontSize:  FontSizes.sm,
    color:     Colors.textSecondary,
    textAlign: 'center',
    marginTop: -Spacing[2],
  },
});