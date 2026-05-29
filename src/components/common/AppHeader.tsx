import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSizes, FontWeights, Spacing, Layout, Shadows } from '../../constants/theme';

// ─── Props ────────────────────────────────────────────────────────────────────

interface AppHeaderProps {
  /** Main title shown next to the logo. Defaults to "Book Darshan Portal" */
  title?: string;
  /** Optional element rendered on the right side (e.g. logout button) */
  rightElement?: React.ReactNode;
  /** Whether to show bottom border/shadow. Default true */
  showShadow?: boolean;
}

// ─── Logo Mark — matches the PDF's gold lotus/emblem icon ─────────────────────

function LogoMark() {
  return (
    <View style={styles.logoMark}>
      {/* Gold rounded square with a stylised emblem glyph */}
      <Text style={styles.logoGlyph}>꧁</Text>
    </View>
  );
}

// ─── AppHeader ────────────────────────────────────────────────────────────────

export function AppHeader({
  title = 'Book Appointment Portal',
  rightElement,
  showShadow = true,
}: AppHeaderProps) {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        showShadow && Shadows.sm,
        { paddingTop: insets.top > 0 ? insets.top : Platform.OS === 'android' ? (StatusBar.currentHeight ?? 0) + 8 : 8 },
      ]}
    >
      {/* Left — Logo + Title */}
      <View style={styles.left}>
        <LogoMark />
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* Right — optional slot */}
      {rightElement ? (
        <View style={styles.right}>{rightElement}</View>
      ) : (
        // Spacer so title stays left-aligned even without right element
        <View style={styles.rightSpacer} />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    paddingHorizontal: Layout.screenPaddingH,
    paddingBottom: Spacing[3],
    height: 'auto' as any,
    minHeight: Layout.headerHeight,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  left: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    flex: 1,
  },
  logoMark: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoGlyph: {
    fontSize: 16,
    color: Colors.white,
    lineHeight: 20,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    flexShrink: 1,
  },
  right: {
    marginLeft: Spacing[2],
  },
  rightSpacer: {
    width: 36,
  },
});