/**
 * ScanResultScreen.tsx — Full-page guard view, no cards, all details spread across page
 * Photo: large, tappable, full preview modal
 * Aadhaar: full number shown (guard needs it for verification)
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Image,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';

import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
  Shadows,
} from '../../constants/theme';
import type { GuardStackParamList } from '../../navigation/types';
import type { QRVerifyResult, QRFailReason } from '../../types/guard.types';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

type Nav   = NativeStackNavigationProp<GuardStackParamList>;
type Route = RouteProp<GuardStackParamList, 'ScanResult'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '—';
  return d.toLocaleDateString('en-IN', {
    weekday: 'long', day: '2-digit', month: 'long', year: 'numeric',
  });
}

function failLabel(reason: QRFailReason | null): string {
  switch (reason) {
    case 'EXPIRED':      return 'QR Pass Expired';
    case 'NOT_APPROVED': return 'Not Approved';
    case 'INVALID':
    default:             return 'Invalid QR Code';
  }
}

function failDescription(reason: QRFailReason | null): string {
  switch (reason) {
    case 'EXPIRED':
      return 'This QR pass was valid for a different date. Entry is not permitted today.';
    case 'NOT_APPROVED':
      return 'This appointment has not been approved by the Minister\'s office. Do not permit entry.';
    case 'INVALID':
    default:
      return 'This QR code was not issued by the CM Bungalow system. Do not permit entry.';
  }
}

// ─── Photo Preview Modal ───────────────────────────────────────────────────────

function PhotoPreviewModal({
  uri,
  visible,
  onClose,
}: {
  uri: string;
  visible: boolean;
  onClose: () => void;
}) {
  const scaleAnim = useRef(new Animated.Value(0.85)).current;
  const fadeAnim  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.spring(scaleAnim, { toValue: 1, tension: 80, friction: 8, useNativeDriver: true }),
      ]).start();
    } else {
      fadeAnim.setValue(0);
      scaleAnim.setValue(0.85);
    }
  }, [visible]);

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <Animated.View style={[previewStyles.overlay, { opacity: fadeAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View style={[previewStyles.imageWrap, { transform: [{ scale: scaleAnim }] }]}>
              <Image
                source={{ uri }}
                style={previewStyles.image}
                resizeMode="contain"
              />
              <TouchableOpacity style={previewStyles.closeBtn} onPress={onClose}>
                <Text style={previewStyles.closeBtnText}>✕  Close</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ScanResultScreen() {
  const navigation = useNavigation<Nav>();
  const route      = useRoute<Route>();
  const { result } = route.params;
  const isValid    = result.isValid;
  const insets     = useSafeAreaInsets();

  const [photoModalVisible, setPhotoModalVisible] = useState(false);

  const fadeAnim  = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 55, friction: 9, useNativeDriver: true }),
    ]).start();
  }, []);

  const handleScanNext = useCallback(() => {
    navigation.replace('QRScanner');
  }, [navigation]);

  // ── Status bar color strip ─────────────────────────────────────────────────
  const accentColor = isValid ? Colors.success : Colors.danger;
  const accentLight = isValid ? Colors.successLight : Colors.dangerLight;

  return (
    <View style={[styles.root, { backgroundColor: Colors.white }]}>

      {/* ── Top status strip ── */}
      <View style={[styles.statusStrip, { backgroundColor: accentColor, paddingTop: insets.top }]}>
        <Text style={styles.statusStripIcon}>{isValid ? '✓' : '✕'}</Text>
        <Text style={styles.statusStripText}>
          {isValid ? 'ENTRY PERMITTED' : 'ENTRY DENIED'}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {isValid && result.fullname ? (
            <>
              {/* ── PHOTO — large, tappable ── */}
              {result.visitorphoto ? (
                <TouchableOpacity
                  style={styles.photoBlock}
                  onPress={() => setPhotoModalVisible(true)}
                  activeOpacity={0.9}
                >
                  <Image
                    source={{ uri: result.visitorphoto }}
                    style={styles.visitorPhoto}
                    resizeMode="cover"
                  />
                  <View style={styles.tapHint}>
                    <Text style={styles.tapHintText}>👁  Tap to enlarge</Text>
                  </View>
                </TouchableOpacity>
              ) : (
                <View style={[styles.photoBlock, styles.noPhotoBlock]}>
                  <Text style={styles.noPhotoIcon}>👤</Text>
                  <Text style={styles.noPhotoText}>No photo on file</Text>
                </View>
              )}

              {/* ── NAME ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>VISITOR NAME</Text>
                <Text style={styles.nameValue}>{result.fullname}</Text>
              </View>

              <View style={styles.separator} />

              {/* ── AADHAAR — full number ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>AADHAAR NUMBER</Text>
                <Text style={styles.aadhaarValue}>
                  {result.aadharnumber
                    ? result.aadharnumber.replace(/(\d{4})(\d{4})(\d{4})/, '$1  $2  $3')
                    : '————  ————  ————'}
                </Text>
              </View>

              {/* ── PURPOSE ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>PURPOSE OF VISIT</Text>
                <Text style={styles.fieldValue}>{result.purposeofvisit ?? '—'}</Text>
              </View>
              <View style={styles.separator} />

              {/* ── WHOM TO VISIT — NEW ────────────────────────────── */}
              {result.whomtovisit ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.fieldLabel}>WHOM TO VISIT</Text>
                    <Text style={styles.fieldValue}>{result.whomtovisit}</Text>
                  </View>
                  <View style={styles.separator} />
                </>
              ) : null}

              {result.referencename ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.fieldLabel}>REFERENCE</Text>
                    <Text style={styles.fieldValue}>{result.referencename}</Text>
                  </View>
                  <View style={styles.separator} />
                </>
              ) : null}

              {/* ── VEHICLE NUMBER — NEW (optional) ───────────────── */}
              {result.vehiclenumber ? (
                <>
                  <View style={styles.row}>
                    <Text style={styles.fieldLabel}>VEHICLE NO.</Text>
                    <Text style={styles.fieldValue}>{result.vehiclenumber}</Text>
                  </View>
                  <View style={styles.separator} />
                </>
              ) : null}

              <View style={styles.separator} />

              {/* ── ADDRESS ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>ADDRESS</Text>
                <Text style={styles.fieldValue}>{result.address ?? '—'}</Text>
              </View>

              <View style={styles.separator} />

              {/* ── APPOINTMENT DATE ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>APPOINTMENT DATE</Text>
                <Text style={styles.fieldValue}>{formatDate(result.appointmentdate)}</Text>
              </View>

              <View style={styles.separator} />

              {/* ── COMPANIONS ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>COMPANIONS</Text>
                <Text style={styles.fieldValue}>
                  {result.companionscount === 0
                    ? 'Visitor only — no companions'
                    : `${result.companionscount} companion${(result.companionscount ?? 0) > 1 ? 's' : ''} accompanying`}
                </Text>
              </View>

              <View style={styles.separator} />

              {/* ── PURPOSE ── */}
              <View style={styles.row}>
                <Text style={styles.fieldLabel}>PURPOSE OF VISIT</Text>
                <Text style={styles.fieldValue}>{result.purposeofvisit ?? '—'}</Text>
              </View>

              <View style={styles.separator} />

              {/* ── PERMIT BANNER ── */}
              <View style={[styles.permitBanner, { backgroundColor: accentLight }]}>
                <Text style={[styles.permitBannerIcon, { color: accentColor }]}>✓</Text>
                <View>
                  <Text style={[styles.permitBannerTitle, { color: accentColor }]}>
                    Identity Verified
                  </Text>
                  <Text style={[styles.permitBannerSub, { color: accentColor }]}>
                    Permit entry — escort to reception
                  </Text>
                </View>
              </View>
            </>
          ) : (
            <>
              {/* ── DENIED ── */}
              <View style={[styles.deniedBlock, { backgroundColor: accentLight }]}>
                <Text style={[styles.deniedIcon, { color: accentColor }]}>✕</Text>
                <Text style={[styles.deniedTitle, { color: accentColor }]}>
                  {failLabel(result.failReason)}
                </Text>
                <Text style={styles.deniedDesc}>
                  {failDescription(result.failReason)}
                </Text>
              </View>
            </>
          )}

        </Animated.View>
      </ScrollView>

      {/* ── Scan Next — pinned bottom ── */}
      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + Spacing[3] }]}>
        <TouchableOpacity
          style={[styles.scanNextBtn, { backgroundColor: accentColor }]}
          onPress={handleScanNext}
          activeOpacity={0.88}
        >
          <Text style={styles.scanNextText}>📷  Scan Next Visitor</Text>
        </TouchableOpacity>
      </View>

      {/* ── Photo preview modal ── */}
      {result.visitorphoto ? (
        <PhotoPreviewModal
          uri={result.visitorphoto}
          visible={photoModalVisible}
          onClose={() => setPhotoModalVisible(false)}
        />
      ) : null}

    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },

  // ── Status strip ──
  statusStrip: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'center',
    paddingVertical: Spacing[4],
    gap:             Spacing[3],
  },
  statusStripIcon: {
    fontSize:   22,
    color:      Colors.white,
    fontWeight: FontWeights.extrabold,
  },
  statusStripText: {
    fontSize:      FontSizes.lg,
    fontWeight:    FontWeights.extrabold,
    color:         Colors.white,
    letterSpacing: 2,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing[5],
    paddingTop:        Spacing[2],
  },

  // ── Photo ──
  photoBlock: {
    marginVertical: Spacing[5],
    alignItems:     'center',
  },
  visitorPhoto: {
    width:        SCREEN_WIDTH - Spacing[5] * 2,
    height:       SCREEN_WIDTH - Spacing[5] * 2,  // square, full width
    borderRadius: BorderRadius.lg,
    backgroundColor: Colors.gray200,
  },
  tapHint: {
    marginTop:       Spacing[2],
    backgroundColor: Colors.gray200,
    borderRadius:    BorderRadius.full,
    paddingHorizontal: Spacing[4],
    paddingVertical:   Spacing[1],
  },
  tapHintText: {
    fontSize:  FontSizes.sm,
    color:     Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  noPhotoBlock: {
    width:           SCREEN_WIDTH - Spacing[5] * 2,
    height:          200,
    backgroundColor: Colors.gray200,
    borderRadius:    BorderRadius.lg,
    justifyContent:  'center',
  },
  noPhotoIcon: { fontSize: 48, textAlign: 'center' },
  noPhotoText: {
    textAlign:  'center',
    fontSize:   FontSizes.base,
    color:      Colors.textSecondary,
    marginTop:  Spacing[2],
  },

  // ── Field rows ──
  row: {
    paddingVertical: Spacing[4],
  },
  fieldLabel: {
    fontSize:      FontSizes.xs,
    fontWeight:    FontWeights.bold,
    color:         Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom:  Spacing[2],
  },
  nameValue: {
    fontSize:   FontSizes['3xl'],
    fontWeight: FontWeights.extrabold,
    color:      Colors.navy,
  },
  aadhaarValue: {
    fontSize:      FontSizes.xxl,
    fontWeight:    FontWeights.bold,
    color:         Colors.navy,
    letterSpacing: 3,
    fontVariant:   ['tabular-nums'],
  },
  fieldValue: {
    fontSize:   FontSizes.xl,
    fontWeight: FontWeights.medium,
    color:      Colors.navy,
    lineHeight: 28,
  },
  separator: {
    height:          1,
    backgroundColor: Colors.gray200,
  },

  // ── Permit banner ──
  permitBanner: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             Spacing[4],
    borderRadius:    BorderRadius.lg,
    padding:         Spacing[5],
    marginVertical:  Spacing[5],
  },
  permitBannerIcon: {
    fontSize:   36,
    fontWeight: FontWeights.extrabold,
  },
  permitBannerTitle: {
    fontSize:   FontSizes.lg,
    fontWeight: FontWeights.extrabold,
  },
  permitBannerSub: {
    fontSize:  FontSizes.base,
    marginTop: 2,
    opacity:   0.8,
  },

  // ── Denied ──
  deniedBlock: {
    borderRadius:    BorderRadius.lg,
    padding:         Spacing[6],
    marginTop:       Spacing[6],
    alignItems:      'center',
    gap:             Spacing[3],
  },
  deniedIcon: {
    fontSize:   56,
    fontWeight: FontWeights.extrabold,
  },
  deniedTitle: {
    fontSize:   FontSizes.xxl,
    fontWeight: FontWeights.extrabold,
    textAlign:  'center',
  },
  deniedDesc: {
    fontSize:   FontSizes.lg,
    color:      Colors.textSecondary,
    textAlign:  'center',
    lineHeight: 26,
  },

  // ── Bottom bar ──
  bottomBar: {
    position:          'absolute',
    bottom:            0,
    left:              0,
    right:             0,
    backgroundColor:   Colors.white,
    paddingHorizontal: Spacing[5],
    paddingTop:        Spacing[3],
    borderTopWidth:    1,
    borderTopColor:    Colors.gray200,
  },
  scanNextBtn: {
    borderRadius:    BorderRadius.lg,
    paddingVertical: Spacing[5],
    alignItems:      'center',
  },
  scanNextText: {
    fontSize:   FontSizes.lg,
    fontWeight: FontWeights.extrabold,
    color:      Colors.white,
    letterSpacing: 0.5,
  },
});

// ─── Photo Preview Styles ─────────────────────────────────────────────────────

const previewStyles = StyleSheet.create({
  overlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.92)',
    alignItems:      'center',
    justifyContent:  'center',
  },
  imageWrap: {
    width:  SCREEN_WIDTH,
    height: SCREEN_HEIGHT * 0.8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing[4],
  },
  image: {
    width:        SCREEN_WIDTH - Spacing[8],
    height:       SCREEN_HEIGHT * 0.68,
    borderRadius: BorderRadius.lg,
  },
  closeBtn: {
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius:    BorderRadius.full,
    paddingHorizontal: Spacing[6],
    paddingVertical:   Spacing[3],
  },
  closeBtnText: {
    color:      Colors.white,
    fontSize:   FontSizes.base,
    fontWeight: FontWeights.semibold,
  },
});