import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '../../components/common/AppHeader';
import { Colors, FontSizes, FontWeights, Spacing, BorderRadius } from '../../constants/theme';

/**
 * AlertsPlaceholderScreen
 *
 * Placeholder for Step 45 (push notifications / useNotifications hook).
 * Will be replaced with real notification list when that phase is built.
 */
export default function AlertsPlaceholderScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.root}>
      <AppHeader title="Alerts" />
      <View style={[styles.center, { paddingBottom: insets.bottom }]}>
        <Text style={styles.icon}>🔔</Text>
        <Text style={styles.title}>No Alerts Yet</Text>
        <Text style={styles.subtitle}>
          Appointment status updates and reminders will appear here.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[8],
  },
  icon: {
    fontSize: 56,
    marginBottom: Spacing[4],
  },
  title: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginBottom: Spacing[2],
    textAlign: 'center',
  },
  subtitle: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});