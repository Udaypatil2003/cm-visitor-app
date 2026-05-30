import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import { AppHeader } from "../../components/common/AppHeader";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from "../../constants/theme";
import { useAuthStore } from "../../store/authStore";
import { useAppointmentStore } from "../../store/appointmentStore";
import appointmentService from "../../services/appointmentService";
import { CitizenStackParamList } from "../../navigation/types";
import { Appointment, AppointmentStatus } from "../../types/appointment.types";

type Nav = NativeStackNavigationProp<CitizenStackParamList>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

// Handles both "2026-05-29" and "2026-05-29T00:00:00.000Z"
function parseLocalDate(iso: string): Date {
  // Strip to date-only part first, then force local midnight
  const datePart = iso.split("T")[0]; // "2026-05-29T..." → "2026-05-29"
  return new Date(`${datePart}T00:00:00`);
}

function formatLongDate(iso: string) {
  return parseLocalDate(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });
}

function formatShortDate(iso: string) {
  return parseLocalDate(iso).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
function makeTodayLabel() {
  const d = new Date();
  const mon = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  return `TODAY · ${d.getDate()} ${mon}`;
}

// ─── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_CFG: Record<
  AppointmentStatus,
  { label: string; bg: string; color: string }
> = {
  APPROVED: {
    label: "Approved",
    bg: Colors.successLight,
    color: Colors.success,
  },
  PENDING: { label: "Pending", bg: Colors.warningLight, color: Colors.warning },
  REJECTED: { label: "Rejected", bg: Colors.dangerLight, color: Colors.danger },
};

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const c = STATUS_CFG[status];
  return (
    <View style={[sb.wrap, { backgroundColor: c.bg }]}>
      <View style={[sb.dot, { backgroundColor: c.color }]} />
      <Text style={[sb.text, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}
const sb = StyleSheet.create({
  wrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
  },
  dot: { width: 5, height: 5, borderRadius: 3 },
  text: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold },
});

// ─── QR Placeholder Icon ──────────────────────────────────────────────────────

function QRIcon() {
  const CELLS = [1, 1, 0, 1, 0, 1, 0, 1, 1]; // simplified 3×3 pattern
  return (
    <View style={qr.grid}>
      {CELLS.map((on, i) => (
        <View key={i} style={[qr.cell, { opacity: on ? 0.65 : 0 }]} />
      ))}
    </View>
  );
}
const qr = StyleSheet.create({
  grid: {
    width: 30,
    height: 30,
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 3,
  },
  cell: { width: 8, height: 8, backgroundColor: Colors.white, borderRadius: 1 },
});

// ─── Ticket — Upcoming Pass (left-screen design) ──────────────────────────────

const NOTCH = 22; // diameter of punch-out notches

function UpcomingPassTicket({
  appt,
  onPress,
}: {
  appt: Appointment;
  onPress: () => void;
}) {
  return (
    <View style={tkt.outer}>
      {/* Punch-out notches — match screen bg so they appear cut out */}
      <View style={[tkt.notch, { left: -(NOTCH / 2) }]} />
      <View style={[tkt.notch, { right: -(NOTCH / 2) }]} />

      {/* ── Top half ── */}
      <View style={tkt.top}>
        <View style={{ flex: 1 }}>
          <View style={tkt.labelRow}>
            <View style={tkt.goldDot} />
            <Text style={tkt.labelTxt}>UPCOMING PASS</Text>
          </View>
          <Text style={tkt.dateTxt}>
            {formatLongDate(appt.appointmentDate)}
          </Text>
          <Text style={tkt.subTxt}>Appointment</Text>
        </View>
        <TouchableOpacity style={tkt.btn} onPress={onPress} activeOpacity={0.8}>
          <Text style={tkt.btnTxt}>View Pass ›</Text>
        </TouchableOpacity>
      </View>

      {/* ── Perforated divider ── */}
      <View style={tkt.perfRow}>
        {[...Array(26)].map((_, i) => (
          <View key={i} style={tkt.dash} />
        ))}
      </View>

      {/* ── Bottom half ── */}
      <View style={tkt.bottom}>
        <QRIcon />
        <Text style={tkt.gateTxt}>Show this at the entrance gate</Text>
      </View>
    </View>
  );
}

const tkt = StyleSheet.create({
  outer: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.lg,
    overflow: "visible", // lets notches bleed outside
    marginBottom: Spacing[4],
    ...Shadows.md,
  },
  notch: {
    position: "absolute",
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: Colors.navyLight, // must match screen root bg
    top: "58%",
    zIndex: 10,
  },
  top: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: Spacing[4],
    paddingBottom: Spacing[3],
    gap: Spacing[2],
  },
  labelRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    marginBottom: 6,
  },
  goldDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.gold,
  },
  labelTxt: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
    letterSpacing: 1.2,
  },
  dateTxt: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.extrabold,
    color: Colors.white,
    marginBottom: 4,
  },
  subTxt: { fontSize: FontSizes.sm, color: "rgba(255,255,255,0.45)" },
  btn: {
    marginTop: Spacing[2],
    backgroundColor: Colors.gold,
    paddingHorizontal: Spacing[3],
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
  },
  btnTxt: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  perfRow: {
    flexDirection: "row",
    paddingHorizontal: Spacing[4],
    gap: 3,
    marginBottom: Spacing[3],
  },
  dash: {
    flex: 1,
    height: 1.5,
    backgroundColor: "rgba(255,255,255,0.15)",
    borderRadius: 1,
  },
  bottom: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing[3],
    padding: Spacing[4],
    paddingTop: 0,
  },
  gateTxt: { flex: 1, fontSize: FontSizes.sm, color: "rgba(255,255,255,0.45)" },
});

// ─── Tab Switcher (right-screen design) ───────────────────────────────────────

function TabSwitcher({
  active,
  upCount,
  pastCount,
  onChange,
}: {
  active: "upcoming" | "past";
  upCount: number;
  pastCount: number;
  onChange: (t: "upcoming" | "past") => void;
}) {
  return (
    <View style={tsw.track}>
      {(["upcoming", "past"] as const).map((t) => {
        const focused = active === t;
        const count = t === "upcoming" ? upCount : pastCount;
        return (
          <TouchableOpacity
            key={t}
            style={[tsw.tab, focused && tsw.activeTab]}
            onPress={() => onChange(t)}
            activeOpacity={0.8}
          >
            <Text style={[tsw.label, focused && tsw.activeLabel]}>
              {t === "upcoming" ? "Upcoming" : "Previous"}
            </Text>
            {count > 0 && (
              <View style={[tsw.pill, focused && tsw.activePill]}>
                <Text style={[tsw.pillTxt, focused && tsw.activePillTxt]}>
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}
const tsw = StyleSheet.create({
  track: {
    flexDirection: "row",
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    padding: 3,
    marginBottom: Spacing[4],
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    gap: 5,
  },
  activeTab: { backgroundColor: Colors.white, ...Shadows.sm },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  activeLabel: { fontWeight: FontWeights.bold, color: Colors.navy },
  pill: {
    backgroundColor: Colors.gray300,
    borderRadius: BorderRadius.full,
    minWidth: 18,
    height: 18,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 4,
  },
  activePill: { backgroundColor: Colors.goldLight },
  pillTxt: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  activePillTxt: { color: Colors.goldDark },
});

// ─── Companion Avatars ────────────────────────────────────────────────────────

const AV_PALETTE = [
  { bg: Colors.gold, fg: Colors.navy },
  { bg: Colors.navyMid, fg: Colors.white },
  { bg: Colors.success, fg: Colors.white },
  { bg: Colors.danger, fg: Colors.white },
];

function CompanionAvatars({
  count,
  initial,
}: {
  count: number;
  initial: string;
}) {
  const total = count + 1;
  const visible = Math.min(total, 3);
  const extra = total - visible;
  return (
    <View style={av.row}>
      {Array.from({ length: visible }).map((_, i) => {
        const p = AV_PALETTE[i % AV_PALETTE.length];
        const letter = i === 0 ? initial : String.fromCharCode(65 + i);
        return (
          <View
            key={i}
            style={[
              av.circle,
              { backgroundColor: p.bg, marginLeft: i > 0 ? -7 : 0 },
            ]}
          >
            <Text style={[av.letter, { color: p.fg }]}>{letter}</Text>
          </View>
        );
      })}
      {extra > 0 && (
        <View
          style={[
            av.circle,
            { backgroundColor: Colors.gray300, marginLeft: -7 },
          ]}
        >
          <Text style={[av.letter, { color: Colors.gray700 }]}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}
const av = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center" },
  circle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1.5,
    borderColor: Colors.white,
  },
  letter: { fontSize: 9, fontWeight: FontWeights.bold },
});

// ─── Timeline Dot ─────────────────────────────────────────────────────────────

function TimelineDot({ status }: { status: AppointmentStatus }) {
  return (
    <View
      style={[
        tdot.base,
        status === "APPROVED" && {
          backgroundColor: Colors.success,
          borderColor: Colors.success,
        },
        status === "REJECTED" && { borderColor: Colors.danger },
        status === "PENDING" && { borderColor: Colors.gold },
      ]}
    />
  );
}
const tdot = StyleSheet.create({
  base: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: Colors.gray400,
    backgroundColor: "transparent",
    marginTop: 4,
  },
});

// ─── Appointment Card (right-screen design) ───────────────────────────────────

// ─── Appointment Card (LEFT-screen design) ────────────────────────────────────

function AppointmentCard({
  item,
  onPress,
}: {
  item: Appointment;
  onPress: () => void;
}) {
  const d = parseLocalDate(item.appointmentDate);
  const mon = d.toLocaleDateString("en-IN", { month: "short" }).toUpperCase();
  const day = d.getDate();

  return (
    <TouchableOpacity style={ac.row} onPress={onPress} activeOpacity={0.75}>
      {/* ── Date block ── */}
      <View style={ac.dateBadge}>
        <Text style={ac.dateMon}>{mon}</Text>
        <Text style={ac.dateDay}>{day}</Text>
      </View>

      {/* ── Card ── */}
      <View style={ac.card}>
        {/* Row 1: title + badge */}
        <View style={ac.titleRow}>
          <Text style={ac.title} numberOfLines={1}>
            {item.purposeOfVisit}
          </Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Row 2: date/time meta */}
        <Text style={ac.metaTxt}>
          🕐 {formatShortDate(item.appointmentDate)}
        </Text>

        {/* Row 3: rejection reason (only if REJECTED) */}
        {item.status === "REJECTED" && item.rejectionReason ? (
          <Text style={ac.rejection} numberOfLines={2}>
            {item.rejectionReason}
          </Text>
        ) : null}

        {/* Row 4: companion count + action link */}
        <View style={ac.footer}>
          {item.companionsCount > 0 ? (
            <Text style={ac.companionTxt}>
              +{item.companionsCount} companion
              {item.companionsCount > 1 ? "s" : ""}
            </Text>
          ) : (
            <View />
          )}
          <Text style={ac.link}>
            {item.status === "APPROVED" ? "View pass ›" : "View details ›"}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
}

const ac = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "stretch",
    gap: Spacing[3],
    marginBottom: Spacing[3],
  },
  // ── Date badge ──
  dateBadge: {
    width: 52,
    backgroundColor: Colors.goldLight,
    borderRadius: BorderRadius.md,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: Spacing[2],
    flexShrink: 0,
  },
  dateMon: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.goldDark,
    letterSpacing: 0.8,
  },
  dateDay: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.extrabold,
    color: Colors.navy,
    lineHeight: 34,
  },
  // ── Card ──
  card: {
    flex: 1,
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    gap: 4,
    ...Shadows.sm,
  },
  titleRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: Spacing[2],
  },
  title: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.navy,
  },
  metaTxt: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
  },
  rejection: {
    fontSize: FontSizes.xs,
    color: Colors.danger,
    lineHeight: 16,
    marginTop: 2,
  },
  footer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: Spacing[1],
  },
  companionTxt: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  link: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
  },
});

// ─── Date Group Header ────────────────────────────────────────────────────────

function DateGroupHeader({
  label,
  onShowAll,
}: {
  label: string;
  onShowAll?: () => void;
}) {
  return (
    <View style={dgh.row}>
      <Text style={dgh.label}>{label}</Text>
      {onShowAll && (
        <TouchableOpacity onPress={onShowAll} hitSlop={8}>
          <Text style={dgh.showAll}>Show all ›</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}
const dgh = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing[3],
  },
  label: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
    letterSpacing: 0.8,
  },
  showAll: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
  },
});

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <View style={es.wrap}>
      <Text style={es.text}>{label}</Text>
    </View>
  );
}
const es = StyleSheet.create({
  wrap: { paddingVertical: Spacing[5], alignItems: "center" },
  text: { fontSize: FontSizes.sm, color: Colors.textSecondary },
});

// ─── Main Screen ──────────────────────────────────────────────────────────────

export default function CitizenHomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { citizenUser } = useAuthStore();

  const {
    appointments,
    setAppointments,
    setLoading,
    setError,
    isLoading,
    error,
    getUpcoming,
    getPast,
    getNextApproved,
  } = useAppointmentStore();

  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");

  const firstName = citizenUser?.fullName?.split(" ")[0] ?? "there";
  const userInitial = (citizenUser?.fullName?.[0] ?? "U").toUpperCase();

  async function fetchAppointments(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getMyAppointments();
      if (res.success) setAppointments(res.data);
      else setError(res.message ?? "Failed to load appointments");
    } catch {
      setError("Could not load appointments. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (appointments.length === 0) fetchAppointments();
  }, []);

  async function onRefresh() {
    setRefreshing(true);
    await fetchAppointments(true);
    setRefreshing(false);
  }

  const allUpcoming = getUpcoming();
  const allPast = getPast();
  const nextApproved = getNextApproved();
  const allActive = activeTab === "upcoming" ? allUpcoming : allPast;
  const displayList = allActive.slice(0, 3);

  function goToDetail(id: string) {
    navigation.navigate("AppointmentDetail", { appointmentId: id });
  }
  function goToMyAppointments() {
    navigation.navigate("CitizenTabs", { screen: "MyAppointments" });
  }

  return (
    <View style={s.root}>
      <AppHeader title="Book Appointment" />

      <ScrollView
        contentContainerStyle={[
          s.scroll,
          { paddingBottom: insets.bottom + Layout.tabBarHeight + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.gold}
            colors={[Colors.gold]}
          />
        }
      >
        {/* ── Greeting ─────────────────────────────────────────── */}
        <Text style={s.greeting}>Hello, {firstName} 👋</Text>
        <Text style={s.sub}>
          {allUpcoming.length > 0
            ? `You have ${allUpcoming.length} upcoming appointment${allUpcoming.length > 1 ? "s" : ""}.`
            : "Here's what's coming up for you."}
        </Text>

        {/* ── Ticket pass ───────────────────────────────────────── */}
        {nextApproved && (
          <UpcomingPassTicket
            appt={nextApproved}
            onPress={() => goToDetail(nextApproved.id)}
          />
        )}

        {/* ── Loading ───────────────────────────────────────────── */}
        {isLoading && !refreshing && (
          <ActivityIndicator
            style={s.loader}
            size="large"
            color={Colors.gold}
          />
        )}

        {/* ── Error ─────────────────────────────────────────────── */}
        {!isLoading && error && (
          <View style={s.errBox}>
            <Text style={s.errTxt}>{error}</Text>
            <TouchableOpacity onPress={() => fetchAppointments()}>
              <Text style={s.retry}>Retry</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* ── Appointment list ──────────────────────────────────── */}
        {!isLoading && !error && (
          <>
            <TabSwitcher
              active={activeTab}
              upCount={allUpcoming.length}
              pastCount={allPast.length}
              onChange={setActiveTab}
            />

            <DateGroupHeader
              label={makeTodayLabel()}
              onShowAll={allActive.length > 3 ? goToMyAppointments : undefined}
            />

            {displayList.length === 0 ? (
              <EmptyState
                label={
                  activeTab === "upcoming"
                    ? "No upcoming appointments"
                    : "No past appointments"
                }
              />
            ) : (
              displayList.map((a) => (
                <AppointmentCard
                  key={a.id}
                  item={a}
                  onPress={() => goToDetail(a.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: Colors.navyLight },
  scroll: { paddingHorizontal: Layout.screenPaddingH, paddingTop: Spacing[4] },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginBottom: 2,
  },
  sub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginBottom: Spacing[4],
  },
  loader: { marginTop: Spacing[8] },
  errBox: { marginTop: Spacing[5], alignItems: "center", gap: Spacing[2] },
  errTxt: {
    fontSize: FontSizes.base,
    color: Colors.danger,
    textAlign: "center",
  },
  retry: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
  },
});
