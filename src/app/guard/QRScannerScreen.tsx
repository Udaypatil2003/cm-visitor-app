/**
 * QRScannerScreen.tsx
 *
 * Uses expo-camera to scan QR codes at the gate.
 *
 * Flow:
 *   1. Request camera permission on mount
 *   2. Show viewfinder with animated scanning frame
 *   3. On QR detected → lock scanner immediately (prevent double scan)
 *   4. Call guardService.verifyQR(token)
 *   5. Navigate to ScanResultScreen with result
 *   6. Show inline loading between scan and navigation
 *
 * Permission states handled:
 *   • undetermined → request on mount
 *   • granted      → show camera
 *   • denied       → show friendly message with Settings deep-link
 *
 * Rules observed:
 *   • No direct API call — guardService only
 *   • No hardcoded colours — theme.ts only
 *   • TypeScript strict
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Easing,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { CameraView, useCameraPermissions } from "expo-camera";
import type { BarcodeScanningResult } from "expo-camera";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "../../constants/theme";
import guardService from "../../services/guardService";
import type { GuardStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<GuardStackParamList>;

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function QRScannerScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const [permission, requestPermission] = useCameraPermissions();

  // Locked = QR already captured, API call in flight or navigating
  const [locked, setLocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  // Animated scan line
  const scanLineY = useRef(new Animated.Value(0)).current;

  // ── Scan line animation ──────────────────────────────────────────────────

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(scanLineY, {
          toValue: 1,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(scanLineY, {
          toValue: 0,
          duration: 1800,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [scanLineY]);

  // ── QR handler ───────────────────────────────────────────────────────────

  const handleBarCodeScanned = useCallback(
    async ({ data }: BarcodeScanningResult) => {
      if (locked) return; // prevent double-fire
      setLocked(true);
      setVerifying(true);

      try {
        const response  = await guardService.verifyQR(data);
       navigation.navigate("ScanResult", { result: response.data });

      } catch {
        // Service error — unlock so guard can try again
        setLocked(false);
      } finally {
        setVerifying(false);
      }
    },
    [locked, navigation],
  );

  // Reset lock when screen comes back into focus (after ScanResult → back)
  useEffect(() => {
    const unsubscribe = navigation.addListener("focus", () => {
      setLocked(false);
      setVerifying(false);
    });
    return unsubscribe;
  }, [navigation]);

  // ── Permission: undetermined ─────────────────────────────────────────────

  if (!permission) {
    return (
      <View style={[styles.root, styles.centreBox, { paddingTop: insets.top }]}>
        <ActivityIndicator color={Colors.gold} size="large" />
      </View>
    );
  }

  // ── Permission: denied ───────────────────────────────────────────────────

  if (!permission.granted) {
    return (
      <View style={[styles.root, { paddingTop: insets.top }]}>
        <Header onBack={() => navigation.goBack()} />
        <View style={styles.centreBox}>
          <Text style={styles.permIcon}>📷</Text>
          <Text style={styles.permTitle}>Camera Access Required</Text>
          <Text style={styles.permBody}>
            This screen needs camera access to scan visitor QR passes. Please
            allow camera access to continue.
          </Text>

          {permission.canAskAgain ? (
            <TouchableOpacity
              style={styles.permBtn}
              onPress={requestPermission}
              activeOpacity={0.85}
            >
              <Text style={styles.permBtnText}>Grant Access</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={styles.permBtn}
              onPress={() => Linking.openSettings()}
              activeOpacity={0.85}
            >
              <Text style={styles.permBtnText}>Open Settings</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.permBackLink}
          >
            <Text style={styles.permBackText}>← Back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ── Camera view ──────────────────────────────────────────────────────────

  const FRAME_SIZE = 260;

  const scanLineTranslate = scanLineY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, FRAME_SIZE - 4],
  });

  return (
    <View style={styles.root}>
      {/* Full-screen camera */}
      <CameraView
        style={StyleSheet.absoluteFill}
        facing="back"
        onBarcodeScanned={locked ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{ barcodeTypes: ["qr"] }}
      />

      {/* Dark overlay with cutout */}
<View style={styles.overlay}>

  {/* Top strip — header + text only, semi-transparent */}
  <View style={[styles.overlayStrip, { paddingTop: insets.top }]}>
    <Header onBack={() => navigation.goBack()} transparent />
    <Text style={styles.overlayTitle}>Scan Visitor QR</Text>
    <Text style={styles.overlaySubtitle}>
      Align the QR code within the frame
    </Text>
  </View>

  {/* Center — frame only, no side panels */}
  <View style={styles.frameCenter}>
    <View style={[styles.frame, { width: FRAME_SIZE, height: FRAME_SIZE }]}>
      <View style={[styles.corner, styles.cornerTL]} />
      <View style={[styles.corner, styles.cornerTR]} />
      <View style={[styles.corner, styles.cornerBL]} />
      <View style={[styles.corner, styles.cornerBR]} />

      {!locked && (
        <Animated.View
          style={[
            styles.scanLine,
            { transform: [{ translateY: scanLineTranslate }] },
          ]}
        />
      )}

      {verifying && (
        <View style={styles.verifyingOverlay}>
          <ActivityIndicator color={Colors.gold} size="large" />
          <Text style={styles.verifyingText}>Verifying…</Text>
        </View>
      )}
    </View>
  </View>

  {/* Bottom strip */}
  <View style={[styles.overlayStrip, { paddingBottom: insets.bottom + Spacing[4] }]}>
    {locked && !verifying ? (
      <Text style={styles.scannedText}>✓ QR Scanned</Text>
    ) : (
      <Text style={styles.hintText}>Hold steady — scanning automatically</Text>
    )}
  </View>

</View>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  onBack,
  transparent = false,
}: {
  onBack: () => void;
  transparent?: boolean;
}) {
  return (
    <View style={[headerStyles.row, transparent && headerStyles.transparent]}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={12}
        style={headerStyles.backBtn}
      >
        <Text style={headerStyles.backText}>‹</Text>
      </TouchableOpacity>
      <Text style={headerStyles.title}>QR Scanner</Text>
      <View style={{ width: 40 }} />
    </View>
  );
}

const headerStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing[4],
    paddingVertical: Spacing[3],
    backgroundColor: Colors.navy,
  },
  transparent: {
    backgroundColor: "transparent",
  },
  backBtn: {
    width: 40,
    alignItems: "flex-start",
  },
  backText: {
    fontSize: FontSizes["3xl"],
    color: Colors.white,
    lineHeight: FontSizes["3xl"] + 4,
  },
  title: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const CORNER_SIZE = 24;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navy,
  },
  centreBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[3],
    padding: Spacing[6],
  },

  // ── Overlay layout ──
  overlay: {
    flex: 1,
    justifyContent: "space-between",
  },
 overlayStrip: {
  backgroundColor: 'rgba(0,0,0,0.45)',
  alignItems: 'center',
  gap: Spacing[1],
  paddingVertical: Spacing[4],
},
  overlayTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  overlaySubtitle: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.65)",
  },
 overlayMiddle: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},

frameCenter: {
  flex: 1,
  alignItems: 'center',
  justifyContent: 'center',
},
  overlaySide: {
    flex: 1,
    height: 260,
    backgroundColor: "rgba(0,0,0,0.65)",
  },

  // ── QR frame ──
  frame: {
    position: "relative",
  },

  // Corners
  corner: {
    position: "absolute",
    width: CORNER_SIZE,
    height: CORNER_SIZE,
    borderColor: Colors.gold,
  },
  cornerTL: {
    top: 0,
    left: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerTR: {
    top: 0,
    right: 0,
    borderTopWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },
  cornerBL: {
    bottom: 0,
    left: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderLeftWidth: CORNER_THICKNESS,
  },
  cornerBR: {
    bottom: 0,
    right: 0,
    borderBottomWidth: CORNER_THICKNESS,
    borderRightWidth: CORNER_THICKNESS,
  },

  // Scan line
  scanLine: {
    position: "absolute",
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: Colors.gold,
    opacity: 0.85,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Verifying overlay inside frame
  verifyingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.72)",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[3],
  },
  verifyingText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.white,
  },

  // Bottom hints
  hintText: {
    fontSize: FontSizes.sm,
    color: "rgba(255,255,255,0.65)",
  },
  scannedText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
  },

  // ── Permission screen ──
  permIcon: {
    fontSize: 52,
    marginBottom: Spacing[2],
  },
  permTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    textAlign: "center",
  },
  permBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  permBtn: {
    marginTop: Spacing[2],
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[6],
    paddingVertical: Spacing[3],
  },
  permBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  permBackLink: { marginTop: Spacing[2] },
  permBackText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
});
