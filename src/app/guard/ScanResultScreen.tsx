/**
 * ScanResultScreen.tsx
 *
 * Receives:  route.params.result  (ApiResponse<QRVerifyResult>)
 * Displays:
 *   VALID   → green card, citizen photo, all appointment details, large ✓
 *   INVALID → red card, failure reason, large ✗
 *   EXPIRED → red card, expired message, large ✗
 *
 * Navigation:
 *   "Scan Next" → replaces back to QRScannerScreen
 *   No swipe-back (gestureEnabled: false set in GuardNavigator)
 *
 * Rules observed:
 *   • No API call — result passed as nav param from QRScannerScreen
 *   • No hardcoded colours — theme.ts only
 *   • TypeScript strict
 */

import React, { useCallback, useEffect, useRef } from 'react';
import {
  Animated,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp }                 from '@react-navigation/native';

import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
  Shadows,
} from '../../constants/theme';
import { Avatar }                from '../../components/common/Avatar';
import type { GuardStackParamList } from '../../navigation/types';
import type { QRVerifyResult, QRFailReason } from '../../types/guard.types';

type Nav   = NativeStackNavigationProp<GuardStackParamList>;
type Route = RouteProp<GuardStackParamList, 'ScanResult'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
  });
}

function failLabel(reason: QRFailReason | null): string {
  switch (reason) {
    case 'EXPIRED':      return 'QR Pass Expired';
    case 'NOT_APPROVED': return 'Appointment Not Approved';
    case 'INVALID':
    default:             return 'Invalid QR Code';
  }
}

function failDescription(reason: QRFailReason | null): string {
  switch (reason) {
    case 'EXPIRED':
      return 'The visitor\'s QR pass was valid for a different date. Entry is not permitted today.';
    case 'NOT_APPROVED':
      return 'This appointment has not been approved by the Minister\'s office. Entry is not permitted.';
    case 'INVALID':
    default:
      return 'This QR code was not issued by the CM Bungalow system. Do not permit entry.';
  }
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScanResultScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
const { result } = route.params; 
const isValid    = result.isValid;  const insets     = useSafeAreaInsets();

  // Animate result card in
  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1, duration: 350, useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1, tension: 70, friction: 9, useNativeDriver: true,
      }),
    ]).start();
  }, [fadeAnim, scaleAnim]);

  const handleScanNext = useCallback(() => {
    // Replace current screen — guard stays in the scanner loop
    navigation.replace('QRScanner');
  }, [navigation]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER
  // ─────────────────────────────────────────────────────────────────────────

  return (
    <View
      style={[
        styles.root,
        { backgroundColor: isValid ? Colors.successLight : Colors.dangerLight },
        { paddingTop: insets.top },
      ]}
    >
      {/* ── Header ── */}
      <View
        style={[
          styles.header,
          { backgroundColor: isValid ? Colors.success : Colors.danger },
        ]}
      >
        <Text style={styles.headerTitle}>
          {isValid ? 'Entry Permitted' : 'Entry Denied'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            opacity:   fadeAnim,
            transform: [{ scale: scaleAnim }],
          }}
        >
          {/* ── Result icon ── */}
          <View
            style={[
              styles.resultIconCircle,
              { backgroundColor: isValid ? Colors.success : Colors.danger },
            ]}
          >
            <Text style={styles.resultIcon}>{isValid ? '✓' : '✕'}</Text>
          </View>

          <Text
            style={[
              styles.resultTitle,
              { color: isValid ? Colors.success : Colors.danger },
            ]}
          >
           {isValid ? 'APPROVED' : failLabel(result.failReason)}
          </Text>

         {/* ── Valid card ── */}
{isValid && result.fullname ? (
  <View style={styles.card}>
    {/* Visitor identity */}
    <View style={styles.visitorRow}>
      <Avatar uri={result.visitorphoto} size={64} />   {/* was: data.citizen.profilePhotoUrl */}
      <View style={styles.visitorInfo}>
        <Text style={styles.visitorName}>{result.fullname}</Text>
        <Text style={styles.visitorId}>
          Aadhaar ···· {result.aadharnumber?.slice(-4) ?? '····'}
        </Text>
        <Text style={styles.visitorAddress} numberOfLines={2}>
          📍 {result.address}
        </Text>
      </View>
    </View>

    <View style={styles.divider} />

    <Text style={styles.sectionLabel}>APPOINTMENT DETAILS</Text>

    <DetailRow icon="📅" label="Date"       value={formatDate(result.appointmentdate)} />
    <DetailRow icon="👥" label="Companions"
      value={
        result.companionscount === 0
          ? 'Visitor only'
          : `${result.companionscount} companion${(result.companionscount ?? 0) > 1 ? 's' : ''}`
      }
    />
    <DetailRow icon="📄" label="Purpose"    value={result.purposeofvisit ?? '—'} />

    <View style={styles.permitStrip}>
      <Text style={styles.permitStripText}>✓  Identity verified — permit entry</Text>
    </View>
  </View>
) : (
  <View style={[styles.card, styles.cardDanger]}>
    <Text style={styles.failTitle}>{failLabel(result.failReason)}</Text>
    <Text style={styles.failDesc}>{failDescription(result.failReason)}</Text>
  </View>
)}
        </Animated.View>
      </ScrollView>

      {/* ── Scan Next button — pinned to bottom ── */}
      <View
        style={[
          styles.bottomBar,
          { paddingBottom: insets.bottom + Spacing[4] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.scanNextBtn,
            { backgroundColor: isValid ? Colors.success : Colors.danger },
          ]}
          onPress={handleScanNext}
          activeOpacity={0.88}
        >
          <Text style={styles.scanNextText}>📷  Scan Next Visitor</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── DetailRow ────────────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: string;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <Text style={styles.detailIcon}>{icon}</Text>
      <View style={styles.detailTextBlock}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },

  // ── Header ──
  header: {
    paddingHorizontal: Spacing[4],
    paddingVertical:   Spacing[4],
    alignItems:        'center',
  },
  headerTitle: {
    fontSize:   FontSizes.xl,
    fontWeight: FontWeights.bold,
    color:      Colors.white,
    letterSpacing: 0.5,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing[4],
    paddingTop:        Spacing[5],
    alignItems:        'center',
    gap:               Spacing[3],
  },

  // ── Result icon ──
  resultIconCircle: {
    width:           80,
    height:          80,
    borderRadius:    BorderRadius.full,
    alignItems:      'center',
    justifyContent:  'center',
    alignSelf:       'center',
    marginBottom:    Spacing[3],
    ...Shadows.md,
  },
  resultIcon: {
    fontSize:   36,
    color:      Colors.white,
    fontWeight: FontWeights.extrabold,
  },
  resultTitle: {
    fontSize:     FontSizes.xxl,
    fontWeight:   FontWeights.extrabold,
    textAlign:    'center',
    letterSpacing: 1,
    marginBottom:  Spacing[4],
  },

  // ── Card ──
  card: {
    width:           '100%',
    backgroundColor: Colors.white,
    borderRadius:    BorderRadius.lg,
    padding:         Spacing[4],
    gap:             Spacing[3],
    ...Shadows.md,
  },
  cardDanger: {
    borderWidth:  2,
    borderColor:  Colors.danger,
  },

  // ── Visitor row (valid) ──
  visitorRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing[3],
  },
  visitorInfo: {
    flex: 1,
    gap:  Spacing[1],
  },
  visitorName: {
    fontSize:   FontSizes.xl,
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
  },
  visitorId: {
    fontSize: FontSizes.sm,
    color:    Colors.textSecondary,
  },
  visitorAddress: {
    fontSize:   FontSizes.sm,
    color:      Colors.textSecondary,
    lineHeight: 18,
  },

  divider: {
    height:          1,
    backgroundColor: Colors.border,
    marginVertical:  Spacing[1],
  },

  sectionLabel: {
    fontSize:     FontSizes.xs,
    fontWeight:   FontWeights.bold,
    color:        Colors.textTertiary,
    letterSpacing: 1,
    marginBottom:  -Spacing[1],
  },

  // ── Detail rows ──
  detailRow: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    gap:           Spacing[3],
  },
  detailIcon: { fontSize: 16, marginTop: 1 },
  detailTextBlock: { flex: 1 },
  detailLabel: {
    fontSize:   FontSizes.xs,
    color:      Colors.textTertiary,
    fontWeight: FontWeights.semibold,
    marginBottom: 1,
  },
  detailValue: {
    fontSize:   FontSizes.base,
    color:      Colors.navy,
    fontWeight: FontWeights.medium,
  },

  // ── Permit strip ──
  permitStrip: {
    backgroundColor: Colors.successLight,
    borderRadius:    BorderRadius.base,
    paddingVertical: Spacing[3],
    alignItems:      'center',
    marginTop:       Spacing[1],
  },
  permitStripText: {
    fontSize:   FontSizes.base,
    fontWeight: FontWeights.bold,
    color:      Colors.success,
  },

  // ── Fail card ──
  failTitle: {
    fontSize:   FontSizes.xl,
    fontWeight: FontWeights.bold,
    color:      Colors.danger,
    textAlign:  'center',
  },
  failDesc: {
    fontSize:   FontSizes.base,
    color:      Colors.textSecondary,
    textAlign:  'center',
    lineHeight: 22,
  },
  denyStrip: {
    backgroundColor: Colors.dangerLight,
    borderRadius:    BorderRadius.base,
    paddingVertical: Spacing[3],
    alignItems:      'center',
    marginTop:       Spacing[1],
  },
  denyStripText: {
    fontSize:   FontSizes.base,
    fontWeight: FontWeights.bold,
    color:      Colors.danger,
  },

  // ── Bottom bar ──
  bottomBar: {
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing[4],
    paddingTop:        Spacing[4],
    borderTopWidth:    1,
    borderTopColor:    Colors.border,
    ...Shadows.md,
  },
  scanNextBtn: {
    borderRadius:    BorderRadius.lg,
    paddingVertical: Spacing[4],
    alignItems:      'center',
  },
  scanNextText: {
    fontSize:   FontSizes.lg,
    fontWeight: FontWeights.bold,
    color:      Colors.white,
  },
});