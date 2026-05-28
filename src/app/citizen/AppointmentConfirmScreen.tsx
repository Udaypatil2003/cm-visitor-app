/**
 * AppointmentConfirmScreen.tsx
 *
 * BEHAVIOUR CHANGE (per request):
 *   Phase A (pre-submit review card) is REMOVED from the UI.
 *   On mount the screen immediately calls appointmentService.createAppointment()
 *   and renders a full-screen loading state while the call is in flight.
 *   On success it transitions directly to Phase B — the "Darshan Confirmed"
 *   e-ticket.  On error it shows a dismissible error banner with a Retry
 *   button so the user is never left stranded.
 *
 * Navigation params in (from BookAppointmentScreen):
 *   appointmentDate   : string        — ISO date string
 *   companionsCount   : 0 | 1 | 2
 *   purposeOfVisit    : string
 *
 * Reads  : authStore → citizenUser
 * Writes : appointmentStore.addAppointment(newAppointment)
 *
 * Rules observed:
 *   • Zero API calls in screen — all via appointmentService
 *   • Zero hardcoded colours — all from Colors / theme constants
 *   • No react-hook-form (no user-input on this screen)
 *   • All 3 UI states handled: submitting | error | submitted
 *   • TypeScript strict — no `any`
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";

// ─── Internal imports ─────────────────────────────────────────────────────────
// Adjust relative paths to match your actual project structure
import { Avatar } from "../../components/common/Avatar";
import { Button } from "../../components/common/Button";
import { LoadingOverlay } from "../../components/common/LoadingOverlay";
import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "../../constants/theme";
import appointmentService from "../../services/appointmentService";
import { useAppointmentStore } from "../../store/appointmentStore";
import { useAuthStore } from "../../store/authStore";
import type { Appointment } from "../../types/appointment.types";
import { formatDate } from "../../utils/dateUtils";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from 'expo-sharing';


// ─── Navigation types (kept minimal — fill in with your navigator's param list) ─
type Props = {
  navigation: {
    goBack: () => void;
    navigate: (screen: string) => void;
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
  route: {
    params: {
      appointmentDate: string;
      companionsCount: 0 | 1 | 2;
      purposeOfVisit: string;
    };
  };
};

// ─── Screen ───────────────────────────────────────────────────────────────────

type ScreenState = "submitting" | "error" | "submitted";

export default function AppointmentConfirmScreen({ navigation, route }: Props) {
  const insets = useSafeAreaInsets();
  const { appointmentDate, companionsCount, purposeOfVisit } = route.params;

  const citizenUser = useAuthStore((s) => s.citizenUser);
  console.log("DEBUG citizenUser:", JSON.stringify(citizenUser, null, 2));

  const addAppointment = useAppointmentStore((s) => s.addAppointment);

  const [screenState, setScreenState] = useState<ScreenState>("submitting");
  const [errorMessage, setErrorMessage] = useState<string>("");
  const [appointment, setAppointment] = useState<Appointment | null>(null);

  // Fade-in animation for the ticket
  const ticketOpacity = useRef(new Animated.Value(0)).current;
  const ticketTranslateY = useRef(new Animated.Value(24)).current;
  const ticketRef = useRef<ViewShot>(null);

  // ── Submit on mount ──────────────────────────────────────────────────────
  const submit = useCallback(async () => {
    setScreenState("submitting");
    setErrorMessage("");
    try {
      const result = await appointmentService.createAppointment({
        appointmentDate,
        companionsCount,
        purposeOfVisit,
      });

      if (!result.success) {
        setErrorMessage(
          result.message ?? "Something went wrong. Please try again.",
        );
        setScreenState("error");
        return;
      }

      addAppointment(result.data);
      setAppointment(result.data);
      setScreenState("submitted");

      // Animate ticket in
      Animated.parallel([
        Animated.timing(ticketOpacity, {
          toValue: 1,
          duration: 420,
          useNativeDriver: true,
        }),
        Animated.spring(ticketTranslateY, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err: unknown) {
      // TEMPORARY DEBUG — remove after fix
      console.log("RAW ERROR:", JSON.stringify(err, null, 2));
      console.log("ERR KEYS:", err instanceof Error ? err.message : err);

      const message =
        err instanceof Error ? err.message : "Network error. Please try again.";
      setErrorMessage(message);
      setScreenState("error");
    }
  }, [
    appointmentDate,
    companionsCount,
    purposeOfVisit,
    addAppointment,
    ticketOpacity,
    ticketTranslateY,
  ]);

  useEffect(() => {
    submit();
  }, []);

  // ── Share handler ────────────────────────────────────────────────────────
 const handleShare = useCallback(async () => {
  if (!appointment || !citizenUser) return;
  try {
    const uri = await captureRef(ticketRef, {
      format:  'png',
      quality: 1,
      result:  'tmpfile',
    });

    const isAvailable = await Sharing.isAvailableAsync();
    if (isAvailable) {
      await Sharing.shareAsync(uri, {
        mimeType:   'image/png',
        dialogTitle: 'Share Darshan E-Ticket',
        UTI:         'public.png',   // iOS only, ignored on Android
      });
    }
  } catch {
    // cancelled
  }
}, [appointment, citizenUser]);

  // ── Navigate home ────────────────────────────────────────────────────────
  const handleDone = useCallback(() => {
    navigation.reset({ index: 0, routes: [{ name: "CitizenTabs" }] });
  }, [navigation]);

  // ── Masked aadhaar ───────────────────────────────────────────────────────
  const maskedAadhaar = citizenUser?.aadhaarNumber
    ? `XXXX-XXXX-${citizenUser.aadhaarNumber.slice(-4)}`
    : "XXXX-XXXX-XXXX";

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: submitting
  // ─────────────────────────────────────────────────────────────────────────
  if (screenState === "submitting") {
    return (
      <SafeAreaView style={styles.centreContainer}>
        <View style={styles.loadingCard}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingTitle}>Processing Your Request</Text>
          <Text style={styles.loadingSubtitle}>
            Submitting appointment to Hon. Minister's Office…
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: error
  // ─────────────────────────────────────────────────────────────────────────
  if (screenState === "error") {
    return (
      <SafeAreaView style={styles.centreContainer}>
        <View style={styles.errorCard}>
          {/* Icon */}
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorIconText}>✕</Text>
          </View>

          <Text style={styles.errorTitle}>Submission Failed</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>

          <Button label="Retry" onPress={submit} variant="primary" fullWidth />
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.goBackLink}
          >
            <Text style={styles.goBackText}>← Go back to Booking</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER: submitted — Phase B ticket
  // ─────────────────────────────────────────────────────────────────────────
  if (!appointment || !citizenUser) {
    return (
      <SafeAreaView style={styles.centreContainer}>
        <View style={styles.errorCard}>
          <Text style={styles.errorTitle}>Session Expired</Text>
          <Text style={styles.errorBody}>
            Could not load your profile. Please log in again.
          </Text>
          <Button
            label="Go Back"
            onPress={() => navigation.goBack()}
            variant="primary"
            fullWidth
          />
        </View>
      </SafeAreaView>
    );
  }
  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={12}>
            <Text style={styles.headerBack}>‹</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Appointment Confirmed</Text>
        </View>
        <TouchableOpacity onPress={handleShare} hitSlop={12}>
          <ShareIcon />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={[
            styles.ticketWrapper,
            {
              opacity: ticketOpacity,
              transform: [{ translateY: ticketTranslateY }],
            },
          ]}
        >
          {/* ↓ ViewShot wraps everything that goes into the shared image ↓ */}
          <ViewShot ref={ticketRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.ticketShareRoot}>
              {/* ── Official header block ── */}
              <View style={styles.officialBlock}>
                <Avatar uri={null} size={42} />
                <View style={styles.officialTextBlock}>
                  <Text style={styles.officialName}>Hon. Minister Office</Text>
                  <Text style={styles.officialSub}>PUBLIC LIAISON OFFICE</Text>
                </View>
                <View style={styles.officialBadge}>
                  <Text style={styles.officialBadgeText}>OFFICIAL</Text>
                </View>
              </View>

              {/* ── Visitor + QR card ── */}
              <View style={styles.ticketCard}>
                {/* Visitor identity row */}
                <View style={styles.visitorRow}>
                  <PersonIcon />
                  <View style={styles.visitorTextBlock}>
                    <Text style={styles.visitorLabel}>VISITOR NAME</Text>
                    <Text style={styles.visitorName}>
                      {citizenUser.fullName}
                    </Text>
                  </View>
                </View>

                {/* QR with gold border */}
                <View style={styles.qrOuter}>
                  <View style={styles.qrCornerTL} />
                  <View style={styles.qrCornerTR} />
                  <View style={styles.qrCornerBL} />
                  <View style={styles.qrCornerBR} />
                  <View style={styles.qrInner}>
                    <QRCode
                      value={appointment.qrToken || appointment.id}
                      size={160}
                      color={Colors.navy}
                      backgroundColor={Colors.white}
                    />
                  </View>
                </View>

                {/* Ticket number */}
                <Text style={styles.ticketNumber}>
                  TICKET #{appointment.id.toUpperCase()}
                </Text>

                <View style={styles.divider} />

                {/* Detail rows */}
                <DetailRow
                  icon={<CalendarIcon />}
                  label="DATE"
                  value={formatDate(appointment.appointmentDate)}
                />
                <DetailRow
                  icon={<DocIcon />}
                  label="REASON"
                  value={appointment.purposeOfVisit}
                />
                <DetailRow
                  icon={<PinIcon />}
                  label="MEETING VENUE"
                  value="Virar Bungalow, Civil Lines Area, Opp. State Bank, PIN 401303"
                />

                {/* Aadhaar */}
                <View style={styles.aadhaarRow}>
                  <Text style={styles.aadhaarLabel}>ID (Aadhaar)</Text>
                  <Text style={styles.aadhaarValue}>{maskedAadhaar}</Text>
                </View>
              </View>

              {/* ── Watermark footer ── */}
              <View style={styles.watermarkRow}>
                <Text style={styles.watermarkGovt}>
                  🏛 GOVERNMENT OF MAHARASHTRA
                </Text>
                <Text style={styles.watermarkApp}>
                  CM Bungalow Visitor Pass
                </Text>
              </View>
            </View>
          </ViewShot>

          {/* Disclaimer stays outside ViewShot — not part of shared image */}
          <Text style={styles.disclaimer}>
            ⓘ Entry permitted only with valid identity proof matching visitor
            name.
          </Text>
        </Animated.View>
      </ScrollView>

      {/* ── Bottom actions ── */}
      <View style={styles.bottomActions}>
        <Button
          label="Share E-Ticket"
          onPress={handleShare}
          variant="primary"
          fullWidth
        />
        <TouchableOpacity onPress={handleDone} style={styles.doneLink}>
          <Text style={styles.doneLinkText}>Done &amp; Return Home</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function DetailRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <View style={styles.detailRow}>
      <View style={styles.detailIcon}>{icon}</View>
      <View style={styles.detailTextBlock}>
        <Text style={styles.detailLabel}>{label}</Text>
        <Text style={styles.detailValue}>{value}</Text>
      </View>
    </View>
  );
}

// Minimal inline SVG-style icon components (no external lib needed)
function ShareIcon() {
  return (
    <View style={iconStyles.container}>
      <Text style={iconStyles.text}>⤴</Text>
    </View>
  );
}
function PersonIcon() {
  return <Text style={iconStyles.gold}>👤</Text>;
}
function CalendarIcon() {
  return <Text style={iconStyles.gold}>📅</Text>;
}
function ClockIcon() {
  return <Text style={iconStyles.gold}>🕐</Text>;
}
function DocIcon() {
  return <Text style={iconStyles.gold}>📄</Text>;
}
function PinIcon() {
  return <Text style={iconStyles.gold}>📍</Text>;
}

const iconStyles = StyleSheet.create({
  container: {
    width: 28,
    height: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  text: { fontSize: 18, color: Colors.gold },
  gold: { fontSize: 16 },
});

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  // ── Root ──
  root: {
    flex: 1,
    backgroundColor: Colors.navyLight,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing[8],
  },

  // ── Header ──
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerBack: {
    fontSize: FontSizes["3xl"],
    color: Colors.gold,
    lineHeight: 30,
    marginRight: Spacing.xs,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },

  // ── Loading / error centre layouts ──
  centreContainer: {
    flex: 1,
    backgroundColor: Colors.navyLight,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
  },
  loadingCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    width: "100%",
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  loadingTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginTop: Spacing.sm,
    textAlign: "center",
  },
  loadingSubtitle: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 20,
  },

  errorCard: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: "center",
    width: "100%",
    gap: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.08,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  errorIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
  },
  errorIconText: {
    fontSize: FontSizes.xl,
    color: Colors.danger,
    fontWeight: FontWeights.bold,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    textAlign: "center",
  },
  errorBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  goBackLink: {
    marginTop: Spacing.xs,
  },
  goBackText: {
    fontSize: FontSizes.sm,
    color: Colors.gold,
    fontWeight: FontWeights.medium,
  },

  // ── Ticket wrapper ──
  ticketWrapper: {
    gap: Spacing.sm,
  },

  ticketShareRoot: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    // No shadow here — shadows don't capture well in ViewShot
  },
  watermarkRow: {
    backgroundColor: Colors.navy,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
    alignItems: "center",
    gap: Spacing[1],
  },
  watermarkGovt: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
    letterSpacing: 1.2,
  },
  watermarkApp: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
  },

  // ── Verified banner ──
  verifiedBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 6,
      },
      android: { elevation: 2 },
    }),
  },
  verifiedIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.successLight,
    alignItems: "center",
    justifyContent: "center",
  },
  verifiedIconText: {
    fontSize: 18,
    color: Colors.success,
    fontWeight: FontWeights.bold,
  },
  verifiedTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  verifiedSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 2,
  },

  // ── Official header block ──
  officialBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.navy,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  officialTextBlock: {
    flex: 1,
  },
  officialName: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  officialSub: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.8,
    marginTop: 2,
  },
  officialBadge: {
    backgroundColor: "transparent",
    borderWidth: 1.5,
    borderColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  officialBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
  },

  // ── White ticket card ──
  ticketCard: {
    backgroundColor: Colors.white,
    borderBottomLeftRadius: BorderRadius.md,
    borderBottomRightRadius: BorderRadius.md,
    padding: Spacing.md,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 12,
      },
      android: { elevation: 4 },
    }),
  },
  visitorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  visitorTextBlock: {
    flex: 1,
  },
  visitorLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: FontWeights.bold,
    letterSpacing: 1,
  },
  visitorName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginTop: 2,
  },

  // ── QR with gold corner decorations ──
  qrOuter: {
    alignSelf: "center",
    width: 200,
    height: 200,
    marginVertical: Spacing.md,
    position: "relative",
    alignItems: "center",
    justifyContent: "center",
  },
  qrInner: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
  },
  // Decorative gold corner brackets
  qrCornerTL: {
    position: "absolute",
    top: 0,
    left: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.gold,
    borderTopLeftRadius: 4,
  },
  qrCornerTR: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 20,
    height: 20,
    borderTopWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.gold,
    borderTopRightRadius: 4,
  },
  qrCornerBL: {
    position: "absolute",
    bottom: 0,
    left: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderLeftWidth: 3,
    borderColor: Colors.gold,
    borderBottomLeftRadius: 4,
  },
  qrCornerBR: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 20,
    height: 20,
    borderBottomWidth: 3,
    borderRightWidth: 3,
    borderColor: Colors.gold,
    borderBottomRightRadius: 4,
  },

  ticketNumber: {
    textAlign: "center",
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
    letterSpacing: 1.2,
  },
  queuePosition: {
    textAlign: "center",
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginTop: 4,
    marginBottom: Spacing.sm,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.border,
    marginVertical: Spacing.sm,
  },

  // ── Detail rows ──
  detailRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  detailIcon: {
    width: 24,
    alignItems: "center",
    marginTop: 2,
  },
  detailTextBlock: {
    flex: 1,
  },
  detailLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gold,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.8,
  },
  detailValue: {
    fontSize: FontSizes.base,
    color: Colors.navy,
    fontWeight: FontWeights.semibold,
    marginTop: 2,
    lineHeight: 20,
  },

  // ── Aadhaar row ──
  aadhaarRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  aadhaarLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  aadhaarValue: {
    fontSize: FontSizes.sm,
    color: Colors.navy,
    fontWeight: FontWeights.semibold,
    letterSpacing: 1,
  },

  // ── Disclaimer ──
  disclaimer: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontStyle: "italic",
    textAlign: "center",
    lineHeight: 18,
    paddingHorizontal: Spacing.sm,
  },

  // ── Bottom actions ──
  bottomActions: {
    backgroundColor: Colors.white,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.md,
    paddingBottom: Platform.OS === "ios" ? Spacing.lg : Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    gap: Spacing.sm,
  },
  doneLink: {
    alignItems: "center",
    paddingVertical: Spacing.sm,
  },
  doneLinkText: {
    fontSize: FontSizes.base,
    color: Colors.navy,
    fontWeight: FontWeights.semibold,
  },
});
