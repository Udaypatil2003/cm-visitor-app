/**
 * AppointmentDetailScreen.tsx
 *
 * Receives:  route.params.appointmentId (string)
 * Fetches:   appointmentService.getAppointmentById(id)
 * Reads:     authStore → citizenUser (for name, aadhaar, share text)
 * Writes:    nothing — read-only screen
 *
 * UI states: loading | error | loaded
 * QR states (inside loaded): PENDING | APPROVED | REJECTED
 *
 * Rules:
 *   • No direct API call — service only
 *   • No hardcoded colours — theme.ts only
 *   • No business logic in screen — all in useCallback / derived vars
 *   • TypeScript strict — no `any`
 */

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  SafeAreaView,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import QRCode from "react-native-qrcode-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { RouteProp } from "@react-navigation/native";

import {
  Colors,
  BorderRadius,
  FontSizes,
  FontWeights,
  Spacing,
} from "../../constants/theme";
import appointmentService from "../../services/appointmentService";
import { useAuthStore } from "../../store/authStore";
import type { Appointment } from "../../types/appointment.types";
import type { CitizenStackParamList } from "../../navigation/types";
import ViewShot, { captureRef } from "react-native-view-shot";
import * as Sharing from "expo-sharing";

// ─── Nav types ────────────────────────────────────────────────────────────────

type Nav = NativeStackNavigationProp<CitizenStackParamList>;
type Route = RouteProp<CitizenStackParamList, "AppointmentDetail">;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function maskAadhaar(raw: string | undefined): string {
  if (!raw) return "XXXX-XXXX-XXXX";
  const digits = raw.replace(/\D/g, "");
  return `XXXX-XXXX-${digits.slice(-4)}`;
}

function statusColor(status: Appointment["status"]): string {
  switch (status) {
    case "APPROVED":
      return Colors.success;
    case "REJECTED":
      return Colors.danger;
    default:
      return Colors.warning;
  }
}

function statusBg(status: Appointment["status"]): string {
  switch (status) {
    case "APPROVED":
      return Colors.successLight;
    case "REJECTED":
      return Colors.dangerLight;
    default:
      return Colors.warningLight;
  }
}

function statusLabel(status: Appointment["status"]): string {
  switch (status) {
    case "APPROVED":
      return "✓  APPROVED";
    case "REJECTED":
      return "✕  REJECTED";
    default:
      return "◷  PENDING";
  }
}

function safeQRValue(appointment: Appointment): string {
  return appointment.qrToken || appointment.id || "PLACEHOLDER";
}

// ─── Screen ───────────────────────────────────────────────────────────────────

type ScreenState = "loading" | "error" | "loaded";

export default function AppointmentDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Route>();
  const insets = useSafeAreaInsets();
  const { appointmentId } = route.params;

  const citizenUser = useAuthStore((s) => s.citizenUser);

  const [screenState, setScreenState] = useState<ScreenState>("loading");
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [errorMessage, setErrorMessage] = useState("");

  // Fade-in for ticket card
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(20)).current;
  const ticketRef = useRef<ViewShot>(null);

  // ── Fetch ────────────────────────────────────────────────────────────────

  const fetchAppointment = useCallback(async () => {
    setScreenState("loading");
    setErrorMessage("");
    try {
      const result = await appointmentService.getAppointmentById(appointmentId);
      if (!result.success) {
        setErrorMessage(result.message || "Failed to load appointment.");
        setScreenState("error");
        return;
      }
      setAppointment(result.data);
      setScreenState("loaded");

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 380,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 60,
          friction: 9,
          useNativeDriver: true,
        }),
      ]).start();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Something went wrong.";
      setErrorMessage(msg);
      setScreenState("error");
    }
  }, [appointmentId, fadeAnim, slideAnim]);

  useEffect(() => {
    fetchAppointment();
  }, [fetchAppointment]);

  // ── Share ────────────────────────────────────────────────────────────────

  const handleShare = useCallback(async () => {
    if (!appointment || !citizenUser) return;
    try {
      const uri = await captureRef(ticketRef, {
        format: "png",
        quality: 1,
        result: "tmpfile",
      });
      const isAvailable = await Sharing.isAvailableAsync();
      if (isAvailable) {
        await Sharing.shareAsync(uri, {
          mimeType: "image/png",
          dialogTitle: "Share Darshan E-Ticket",
          UTI: "public.png",
        });
      }
    } catch {
      /* cancelled */
    }
  }, [appointment, citizenUser, ticketRef]);

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — loading
  // ─────────────────────────────────────────────────────────────────────────

  if (screenState === "loading") {
    return (
      <SafeAreaView style={styles.root}>
        <Header onBack={() => navigation.goBack()} showShare={false} />
        <View style={styles.centreBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading appointment…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — error
  // ─────────────────────────────────────────────────────────────────────────

  if (screenState === "error") {
    return (
      <SafeAreaView style={styles.root}>
        <Header onBack={() => navigation.goBack()} showShare={false} />
        <View style={styles.centreBox}>
          <View style={styles.errorIconCircle}>
            <Text style={styles.errorIconText}>!</Text>
          </View>
          <Text style={styles.errorTitle}>Could Not Load</Text>
          <Text style={styles.errorBody}>{errorMessage}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={fetchAppointment}>
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // RENDER — loaded
  // ─────────────────────────────────────────────────────────────────────────

  if (!appointment) return null;

  const isApproved = appointment.status === "APPROVED";
  const isRejected = appointment.status === "REJECTED";
  const isPending = appointment.status === "PENDING";

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <Header
        onBack={() => navigation.goBack()}
        showShare={isApproved}
        onShare={handleShare}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}
        >
          {/* ── Status banner ── */}
          <View
            style={[
              styles.statusBanner,
              { backgroundColor: statusBg(appointment.status) },
            ]}
          >
            <Text
              style={[
                styles.statusBannerText,
                { color: statusColor(appointment.status) },
              ]}
            >
              {statusLabel(appointment.status)}
            </Text>
            {isPending && (
              <Text style={styles.statusSubtext}>
                Awaiting approval from the Minister's Office
              </Text>
            )}
            {isApproved && (
              <Text style={styles.statusSubtext}>
                Present this QR at the Main Gate
              </Text>
            )}
          </View>

          {/* ── Rejection reason banner ── */}
          {isRejected && appointment.rejectionReason && (
            <View style={styles.rejectionBanner}>
              <Text style={styles.rejectionLabel}>REASON FOR REJECTION</Text>
              <Text style={styles.rejectionBody}>
                {appointment.rejectionReason}
              </Text>
            </View>
          )}

          {/* ── Official header block ── */}

          <ViewShot ref={ticketRef} options={{ format: "png", quality: 1 }}>
            <View style={styles.ticketShareRoot}>
              <View style={styles.officialBlock}>
                <View style={styles.officialAvatar}>
                  <Text style={styles.officialAvatarText}>🏛</Text>
                </View>
                <View style={styles.officialTextBlock}>
                  <Text style={styles.officialName}>Hon. Minister Office</Text>
                  <Text style={styles.officialSub}>PUBLIC LIAISON OFFICE</Text>
                </View>
                <View style={styles.officialBadge}>
                  <Text style={styles.officialBadgeText}>OFFICIAL</Text>
                </View>
              </View>

              {/* ── White ticket card ── */}
              <View style={styles.ticketCard}>
                {/* Visitor name */}
                <View style={styles.visitorRow}>
                  <Text style={styles.personIcon}>👤</Text>
                  <View>
                    <Text style={styles.visitorLabel}>VISITOR NAME</Text>
                    <Text style={styles.visitorName}>
                      {citizenUser?.fullName ?? "—"}
                    </Text>
                  </View>
                </View>

                {/* ── QR section ── */}
                {isRejected ? (
                  /* REJECTED → no QR, show denied */
                  <View style={styles.qrSection}>
                    <View style={styles.qrRejectedOuter}>
                      <Text style={styles.qrRejectedIcon}>✕</Text>
                      <Text style={styles.qrRejectedText}>
                        Entry Not Permitted
                      </Text>
                    </View>
                  </View>
                ) : isPending ? (
                  /* PENDING → QR visible but overlaid with lock + badge */
                  <View style={styles.qrSection}>
                    <View style={styles.qrOuter}>
                      <View style={styles.qrCornerTL} />
                      <View style={styles.qrCornerTR} />
                      <View style={styles.qrCornerBL} />
                      <View style={styles.qrCornerBR} />
                      <View style={styles.qrInner}>
                        {safeQRValue(appointment) ? (
                          <QRCode
                            value={safeQRValue(appointment)}
                            size={160}
                            color={Colors.navy}
                            backgroundColor={Colors.white}
                          />
                        ) : null}
                      </View>
                      {/* Frosted overlay — sits on top of the QR */}
                      <View style={styles.qrPendingOverlay}>
                        <Text style={styles.qrPendingIcon}>🔒</Text>
                        <Text style={styles.qrPendingText}>
                          Awaiting Approval
                        </Text>
                        <Text style={styles.qrPendingSubtext}>
                          QR will activate once approved
                        </Text>
                      </View>
                    </View>
                    <Text style={styles.ticketNumber}>
                      TICKET #{String(appointment.id).toUpperCase()}
                    </Text>
                  </View>
                ) : (
                  /* APPROVED → clean QR, no overlay */
                  <View style={styles.qrSection}>
                    <View style={styles.qrOuter}>
                      <View style={styles.qrCornerTL} />
                      <View style={styles.qrCornerTR} />
                      <View style={styles.qrCornerBL} />
                      <View style={styles.qrCornerBR} />
                      <View style={styles.qrInner}>
                        {safeQRValue(appointment) ? (
                          <QRCode
                            value={safeQRValue(appointment)}
                            size={160}
                            color={Colors.navy}
                            backgroundColor={Colors.white}
                          />
                        ) : null}
                      </View>
                    </View>
                    <Text style={styles.ticketNumber}>
                      TICKET #{String(appointment.id).toUpperCase()}
                    </Text>
                  </View>
                )}

                <View style={styles.divider} />

                {/* Detail rows */}
                <DetailRow
                  icon="📅"
                  label="DATE"
                  value={formatDate(appointment.appointmentDate)}
                />
                <DetailRow
                  icon="👥"
                  label="COMPANIONS"
                  value={
                    appointment.companionsCount === 0
                      ? "None"
                      : `${appointment.companionsCount} companion${appointment.companionsCount > 1 ? "s" : ""}`
                  }
                />
                <DetailRow
                  icon="📄"
                  label="REASON"
                  value={appointment.purposeOfVisit}
                />
                <DetailRow
                  icon="📍"
                  label="MEETING VENUE"
                  value="Virar Bungalow, Civil Lines Area, Opp. State Bank, PIN 401303"
                />

                {/* Aadhaar + created date */}
                <View style={styles.metaRow}>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Aadhaar</Text>
                    <Text style={styles.metaValue}>
                      {maskAadhaar(citizenUser?.aadhaarNumber)}
                    </Text>
                  </View>
                  <View style={styles.metaItem}>
                    <Text style={styles.metaLabel}>Booked On</Text>
                    <Text style={styles.metaValue}>
                      {formatDate(appointment.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>

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

          {/* ── Disclaimer ── */}
          <Text style={styles.disclaimer}>
            ⓘ Entry permitted only with valid identity proof matching visitor
            name.
          </Text>

          {/* ── Actions ── */}
          {isApproved && (
            <TouchableOpacity
              style={styles.shareBtn}
              onPress={handleShare}
              activeOpacity={0.85}
            >
              <Text style={styles.shareBtnText}>⤴ Share E-Ticket</Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={styles.backLink}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backLinkText}>← Back to My Appointments</Text>
          </TouchableOpacity>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

// ─── Header ───────────────────────────────────────────────────────────────────

function Header({
  onBack,
  showShare,
  onShare,
}: {
  onBack: () => void;
  showShare: boolean;
  onShare?: () => void;
}) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={onBack}
        hitSlop={12}
        style={styles.headerBackBtn}
      >
        <Text style={styles.headerBackText}>‹</Text>
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Appointment Details</Text>
      {showShare ? (
        <TouchableOpacity onPress={onShare} hitSlop={12}>
          <Text style={styles.headerShare}>⤴</Text>
        </TouchableOpacity>
      ) : (
        <View style={{ width: 28 }} />
      )}
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

const SHADOW = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: { elevation: 4 },
});

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navyLight,
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
  headerBackBtn: {
    width: 28,
    alignItems: "flex-start",
  },
  headerBackText: {
    fontSize: FontSizes["3xl"],
    color: Colors.gold,
    lineHeight: 30,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  headerShare: {
    fontSize: FontSizes.xl,
    color: Colors.gold,
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    gap: Spacing.sm,
  },

  // ── Centre box (loading / error) ──
  centreBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
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
    fontSize: FontSizes.xxl,
    color: Colors.danger,
    fontWeight: FontWeights.bold,
  },
  errorTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  errorBody: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },
  retryBtn: {
    marginTop: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
  },
  retryText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },

  // ── Status banner ──
  statusBanner: {
    borderRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: 4,
  },
  statusBannerText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    letterSpacing: 0.5,
  },
  statusSubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },

  // ── Rejection banner ──
  rejectionBanner: {
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: Colors.danger,
    padding: Spacing.md,
    gap: 4,
  },
  rejectionLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.danger,
    letterSpacing: 0.8,
  },
  rejectionBody: {
    fontSize: FontSizes.base,
    color: Colors.danger,
    lineHeight: 20,
  },

  // ── Official block ──
  officialBlock: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.navy,
    borderTopLeftRadius: BorderRadius.md,
    borderTopRightRadius: BorderRadius.md,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  officialAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: Colors.navyMid,
    alignItems: "center",
    justifyContent: "center",
  },
  officialAvatarText: { fontSize: 20 },
  officialTextBlock: { flex: 1 },
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
    ...SHADOW,
  },

  // Visitor row
  visitorRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  personIcon: { fontSize: 20 },
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

  // ── QR section ──
  qrSection: {
    alignItems: "center",
    marginVertical: Spacing.md,
    gap: Spacing.sm,
  },

  // Approved QR
  qrOuter: {
    position: "relative", // ← ADD (was likely missing or implicit)
    alignSelf: "center",
    padding: 12,
    borderWidth: 2,
    borderColor: Colors.gold,
    borderRadius: BorderRadius.md,
    marginVertical: Spacing[4],
  },
  qrInner: {
    padding: Spacing.sm,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm,
  },
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

  // Pending QR placeholder
  qrPendingOuter: {
    width: 200,
    height: 200,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray200,
    borderWidth: 2,
    borderColor: Colors.gray300,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  qrPendingOverlay: {
    ...StyleSheet.absoluteFillObject, // ← fills qrOuter exactly
    backgroundColor: "rgba(255,255,255,0.88)",
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[1],
  },
  qrPendingIcon: { fontSize: 32 },
  qrPendingText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    textAlign: "center",
  },
  qrPendingSubtext: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    textAlign: "center",
    lineHeight: 16,
  },

  // Rejected QR placeholder
  qrRejectedOuter: {
    width: 200,
    height: 160,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dangerLight,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
  },
  qrRejectedIcon: {
    fontSize: FontSizes["4xl"],
    color: Colors.danger,
    fontWeight: FontWeights.bold,
  },
  qrRejectedText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.danger,
  },

  ticketNumber: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
    letterSpacing: 1.2,
    textAlign: "center",
  },
  queuePosition: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "center",
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
  detailIcon: { fontSize: 16, marginTop: 2, width: 20, textAlign: "center" },
  detailTextBlock: { flex: 1 },
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

  // ── Meta row (aadhaar + booked date) ──
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  metaItem: { gap: 2 },
  metaLabel: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  metaValue: {
    fontSize: FontSizes.sm,
    color: Colors.navy,
    fontWeight: FontWeights.semibold,
    letterSpacing: 0.5,
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

  // ── Share button ──
  shareBtn: {
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingVertical: Spacing.md,
    alignItems: "center",
    marginTop: Spacing.xs,
  },
  shareBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },

  // ── Back link ──
  backLink: {
    alignItems: "center",
    paddingVertical: Spacing.md,
  },
  backLinkText: {
    fontSize: FontSizes.base,
    color: Colors.navy,
    fontWeight: FontWeights.medium,
  },

  ticketShareRoot: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
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
});
