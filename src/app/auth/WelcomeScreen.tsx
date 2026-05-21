import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';
import {Button} from '../../components/common/Button';
import { AuthStackParamList } from '../../navigation/types';

type Props = NativeStackScreenProps<AuthStackParamList, 'Welcome'>;

export default function WelcomeScreen({ navigation }: Props) {
  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.background} />

      <View style={styles.container}>
        {/* Hero Section */}
        <View style={styles.heroSection}>
          <View style={styles.logoPlaceholder}>
            <Text style={styles.logoText}>CM</Text>
          </View>
          <Text style={styles.appName}>CM Bungalow</Text>
          <Text style={styles.tagline}>
            Book your appointment with the{'\n'}Chief Minister's Office
          </Text>
        </View>

        {/* Feature highlights */}
        <View style={styles.featuresSection}>
          <FeatureRow icon="📅" label="Book appointments online" />
          <FeatureRow icon="🔐" label="Secure QR-based entry" />
          <FeatureRow icon="🔔" label="Real-time status updates" />
        </View>

        {/* CTA Buttons */}
        <View style={styles.ctaSection}>
          <Text style={styles.ctaLabel}>Select your role to continue</Text>

          <Button
            label="I am a Citizen"
            onPress={() => navigation.navigate('CitizenLogin')}
            variant="primary"
            fullWidth
          />

          <View style={styles.dividerRow}>
            <View style={styles.divider} />
            <Text style={styles.dividerText}>or</Text>
            <View style={styles.divider} />
          </View>

          <Button
            label="I am a Security Guard"
            onPress={() => navigation.navigate('GuardLogin')}
            variant="secondary"
            fullWidth
          />
        </View>

        <Text style={styles.footer}>
          © Maharashtra Government · CM Bungalow
        </Text>
      </View>
    </SafeAreaView>
  );
}

// ─── Sub-component ────────────────────────────────────────────────────────────

function FeatureRow({ icon, label }: { icon: string; label: string }) {
  return (
    <View style={featureStyles.row}>
      <Text style={featureStyles.icon}>{icon}</Text>
      <Text style={featureStyles.label}>{label}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    justifyContent: 'space-between',
    paddingBottom: Spacing.lg,
  },
  heroSection: {
    alignItems: 'center',
    paddingTop: Spacing.xxl,
  },
  logoPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  logoText: {
    color: Colors.white,
    fontSize: 32,
    fontWeight: '800',
  },
  appName: {
    fontSize: FontSizes.xxl,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginBottom: Spacing.sm,
  },
  tagline: {
    fontSize: FontSizes.md,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  featuresSection: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    gap: Spacing.sm,
  },
  ctaSection: {
    gap: Spacing.sm,
  },
  ctaLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginVertical: Spacing.xs,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: Colors.border,
  },
  dividerText: {
    fontSize: FontSizes.sm,
    color: Colors.textTertiary,
  },
  footer: {
    textAlign: 'center',
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing.md,
  },
});

const featureStyles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  icon: {
    fontSize: 20,
  },
  label: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: '500',
  },
});