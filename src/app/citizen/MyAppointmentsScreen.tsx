import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from "../../constants/theme";
import appointmentService from "../../services/appointmentService";
import { useAppointmentStore } from "../../store/appointmentStore";
import type {
  Appointment,
  AppointmentStatus,
} from "../../types/appointment.types";
import type { CitizenStackParamList } from "../../navigation/types";

type Nav = NativeStackNavigationProp<CitizenStackParamList>;
type Tab = "upcoming" | "past";
type Filter = "ALL" | AppointmentStatus;

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

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CONFIG: Record<
  AppointmentStatus,
  {
    label: string;
    bg: string;
    color: string;
    chipBg: string;
    chipActiveBg: string;
    chipActiveText: string;
    chipBorder: string;
  }
> = {
  APPROVED: {
    label: "Approved",
    bg: Colors.successLight,
    color: Colors.success,
    chipBg: Colors.white,
    chipActiveBg: Colors.success,
    chipActiveText: Colors.white,
    chipBorder: Colors.success,
  },
  PENDING: {
    label: "Pending",
    bg: Colors.warningLight,
    color: Colors.warning,
    chipBg: Colors.white,
    chipActiveBg: Colors.warning,
    chipActiveText: Colors.white,
    chipBorder: Colors.warning,
  },
  REJECTED: {
    label: "Rejected",
    bg: Colors.dangerLight,
    color: Colors.danger,
    chipBg: Colors.white,
    chipActiveBg: Colors.danger,
    chipActiveText: Colors.white,
    chipBorder: Colors.danger,
  },
};

// Per-filter count helper
function countByStatus(list: Appointment[], filter: Filter): number {
  if (filter === "ALL") return list.length;
  return list.filter((a) => a.status === filter).length;
}

// ─── StatusBadge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[styles.badge, { backgroundColor: cfg.bg }]}>
      <Text style={[styles.badgeText, { color: cfg.color }]}>{cfg.label}</Text>
    </View>
  );
}

// ─── Filter chips ─────────────────────────────────────────────────────────────

const FILTERS: { key: Filter; label: string; icon: string }[] = [
  { key: "ALL", label: "All", icon: "📋" },
  { key: "APPROVED", label: "Approved", icon: "✅" },
  { key: "PENDING", label: "Pending", icon: "⏳" },
  { key: "REJECTED", label: "Rejected", icon: "❌" },
];

function FilterChips({
  active,
  counts,
  onChange,
}: {
  active: Filter;
  counts: Record<Filter, number>;
  onChange: (f: Filter) => void;
}) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.chipsRow}
      style={styles.chipsScroll}
    >
      {FILTERS.map((f) => {
        const isActive = active === f.key;
        const cfg =
          f.key !== "ALL" ? STATUS_CONFIG[f.key as AppointmentStatus] : null;

        const activeBg = cfg ? cfg.chipActiveBg : Colors.navy;
        const activeText = cfg ? cfg.chipActiveText : Colors.white;
        const borderColor = cfg ? cfg.chipBorder : Colors.navy;
        const count = counts[f.key];

        return (
          <TouchableOpacity
            key={f.key}
            style={[
              styles.chip,
              isActive
                ? { backgroundColor: activeBg, borderColor: activeBg }
                : { backgroundColor: Colors.white, borderColor: Colors.border },
            ]}
            onPress={() => onChange(f.key)}
            activeOpacity={0.75}
          >
            <Text style={styles.chipIcon}>{f.icon}</Text>
            <Text
              style={[
                styles.chipLabel,
                { color: isActive ? activeText : Colors.textSecondary },
              ]}
            >
              {f.label}
            </Text>
            {count > 0 && (
              <View
                style={[
                  styles.chipCount,
                  {
                    backgroundColor: isActive
                      ? "rgba(255,255,255,0.25)"
                      : Colors.gray200,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.chipCountText,
                    { color: isActive ? activeText : Colors.textSecondary },
                  ]}
                >
                  {count}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ─── AppointmentCard ──────────────────────────────────────────────────────────

function AppointmentCard({
  item,
  onPress,
}: {
  item: Appointment;
  onPress: () => void;
}) {
  const isApproved = item.status === "APPROVED";
  const isRejected = item.status === "REJECTED";
  const cfg = STATUS_CONFIG[item.status];

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.75}
    >
      {/* Coloured left accent bar */}
      <View style={[styles.cardAccent, { backgroundColor: cfg.color }]} />

      <View style={styles.cardInner}>
        {/* Top row */}
        <View style={styles.cardTop}>
          <Text style={styles.cardPurpose} numberOfLines={1}>
            {item.purposeOfVisit || "—"}
          </Text>
          <StatusBadge status={item.status} />
        </View>

        {/* Meta row */}
        <View style={styles.cardMeta}>
          <Text style={styles.cardMetaIcon}>📅</Text>
          <Text style={styles.cardDate}>
            {formatDate(item.appointmentDate)}
          </Text>
          {item.companionsCount > 0 && (
            <>
              <Text style={styles.cardMetaDot}>·</Text>
              <Text style={styles.cardCompanions}>
                +{item.companionsCount} companion
                {item.companionsCount > 1 ? "s" : ""}
              </Text>
            </>
          )}
        </View>

        {/* Rejection reason */}
        {isRejected && item.rejectionReason ? (
          <View style={styles.rejectionRow}>
            <Text style={styles.rejectionLabel}>Reason: </Text>
            <Text style={styles.rejectionText} numberOfLines={2}>
              {item.rejectionReason}
            </Text>
          </View>
        ) : null}

        {/* Approved QR hint */}
        {isApproved && (
          <View style={styles.approvedHint}>
            <Text style={styles.approvedHintText}>🎫 QR Pass Ready</Text>
          </View>
        )}

        {/* Footer */}
        <View style={styles.cardFooter}>
          <Text style={styles.cardTicket}>
            #{String(item.id).toUpperCase()}
          </Text>
          <View style={[styles.cardCtaBtn, { backgroundColor: cfg.bg }]}>
            <Text style={[styles.cardCtaText, { color: cfg.color }]}>
              {isApproved ? "View Pass ›" : "View Details ›"}
            </Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );
}

// ─── EmptyState ───────────────────────────────────────────────────────────────

function EmptyState({ tab, filter }: { tab: Tab; filter: Filter }) {
  const isFiltered = filter !== "ALL";
  return (
    <View style={styles.emptyWrap}>
      <Text style={styles.emptyIcon}>
        {isFiltered
          ? filter === "APPROVED"
            ? "✅"
            : filter === "PENDING"
              ? "⏳"
              : "❌"
          : tab === "upcoming"
            ? "📅"
            : "🕐"}
      </Text>
      <Text style={styles.emptyTitle}>
        {isFiltered
          ? `No ${STATUS_CONFIG[filter as AppointmentStatus]?.label} Appointments`
          : tab === "upcoming"
            ? "No Upcoming Appointments"
            : "No Past Appointments"}
      </Text>
      <Text style={styles.emptySubtitle}>
        {isFiltered
          ? "Try a different filter above."
          : tab === "upcoming"
            ? "Book a appointment from the Home screen."
            : "Your completed appointments will appear here."}
      </Text>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function MyAppointmentsScreen() {
  const navigation = useNavigation<Nav>();
  const insets = useSafeAreaInsets();

  const {
    appointments,
    setAppointments,
    setLoading,
    setError,
    isLoading,
    error,
    getUpcoming,
    getPast,
  } = useAppointmentStore();

  const [activeTab, setActiveTab] = useState<Tab>("upcoming");
  const [activeFilter, setFilter] = useState<Filter>("ALL");
  const [refreshing, setRefreshing] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────

  const fetchAppointments = useCallback(
    async (silent = false) => {
      if (!silent) setLoading(true);
      setError(null);
      try {
        const res = await appointmentService.getMyAppointments();
        if (res.success) setAppointments(res.data);
        else setError(res.message ?? "Failed to load appointments.");
      } catch {
        setError("Could not load appointments. Please try again.");
      } finally {
        setLoading(false);
      }
    },
    [setAppointments, setError, setLoading],
  );

  useEffect(() => {
    fetchAppointments();
  }, [fetchAppointments]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchAppointments(true);
    setRefreshing(false);
  }, [fetchAppointments]);

  // When switching tabs, reset filter to ALL
  function handleTabChange(tab: Tab) {
    setActiveTab(tab);
    setFilter("ALL");
  }

  // ── Derived ────────────────────────────────────────────────────────────────

  const upcoming = getUpcoming();
  const past = getPast();
  const baseList = activeTab === "upcoming" ? upcoming : past;

  // Filtered list
  const data = useMemo(
    () =>
      activeFilter === "ALL"
        ? baseList
        : baseList.filter((a) => a.status === activeFilter),
    [baseList, activeFilter],
  );

  // Counts for chip badges (always from full baseList, not filtered)
  const counts: Record<Filter, number> = useMemo(
    () => ({
      ALL: baseList.length,
      APPROVED: countByStatus(baseList, "APPROVED"),
      PENDING: countByStatus(baseList, "PENDING"),
      REJECTED: countByStatus(baseList, "REJECTED"),
    }),
    [baseList],
  );

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* ── Header ── */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <Text style={styles.headerTitle}>My Appointments</Text>
          <View style={styles.totalBadge}>
            <Text style={styles.totalBadgeText}>
              {appointments.length} total
            </Text>
          </View>
        </View>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {(
            [
              { label: "Upcoming", value: upcoming.length, color: Colors.gold },
              {
                label: "Approved",
                value: countByStatus(appointments, "APPROVED"),
                color: Colors.success,
              },
              {
                label: "Pending",
                value: countByStatus(appointments, "PENDING"),
                color: Colors.warning,
              },
              {
                label: "Rejected",
                value: countByStatus(appointments, "REJECTED"),
                color: Colors.danger,
              },
            ] as const
          ).map((s, i, arr) => (
            <React.Fragment key={s.label}>
              <View style={styles.statItem}>
                <Text style={[styles.statNum, { color: s.color }]}>
                  {s.value}
                </Text>
                <Text style={styles.statLabel}>{s.label}</Text>
              </View>
              {i < arr.length - 1 && <View style={styles.statDivider} />}
            </React.Fragment>
          ))}
        </View>
      </View>

      {/* ── Segmented tabs ── */}
      <View style={styles.tabRow}>
        {(["upcoming", "past"] as Tab[]).map((tab) => {
          const isActive = activeTab === tab;
          const count = tab === "upcoming" ? upcoming.length : past.length;
          return (
            <TouchableOpacity
              key={tab}
              style={[styles.tabBtn, isActive && styles.tabBtnActive]}
              onPress={() => handleTabChange(tab)}
              activeOpacity={0.8}
            >
              <Text
                style={[styles.tabBtnText, isActive && styles.tabBtnTextActive]}
              >
                {tab === "upcoming" ? "Upcoming" : "Past"}
              </Text>
              {count > 0 && (
                <View
                  style={[styles.tabPill, isActive && styles.tabPillActive]}
                >
                  <Text
                    style={[
                      styles.tabPillText,
                      isActive && styles.tabPillTextActive,
                    ]}
                  >
                    {count}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* ── Filter chips ── */}
      <FilterChips active={activeFilter} counts={counts} onChange={setFilter} />

      {/* ── Loading ── */}
      {isLoading && !refreshing && (
        <View style={styles.centreBox}>
          <ActivityIndicator size="large" color={Colors.gold} />
          <Text style={styles.loadingText}>Loading appointments…</Text>
        </View>
      )}

      {/* ── Error ── */}
      {!isLoading && !!error && (
        <View style={styles.centreBox}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Could Not Load</Text>
          <Text style={styles.errorBody}>{error}</Text>
          <TouchableOpacity
            style={styles.retryBtn}
            onPress={() => fetchAppointments()}
          >
            <Text style={styles.retryText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── List ── */}
      {!isLoading && !error && (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={[
            styles.listContent,
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
          ListEmptyComponent={
            <EmptyState tab={activeTab} filter={activeFilter} />
          }
          renderItem={({ item }) => (
            <AppointmentCard
              item={item}
              onPress={() =>
                navigation.navigate("AppointmentDetail", {
                  appointmentId: item.id,
                })
              }
            />
          )}
          ItemSeparatorComponent={() => <View style={{ height: Spacing[3] }} />}
        />
      )}
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.navyLight,
  },

  // ── Header ──
  header: {
    backgroundColor: Colors.navy,
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
    paddingBottom: Spacing[5],
    gap: Spacing[3],
  },
  headerTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerTitle: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  totalBadge: {
    backgroundColor: Colors.navyMid,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  totalBadgeText: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    fontWeight: FontWeights.medium,
  },
  statsRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.navyMid,
    borderRadius: BorderRadius.md,
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[4],
  },
  statItem: {
    flex: 1,
    alignItems: "center",
    gap: 2,
  },
  statNum: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
  },
  statLabel: {
    fontSize: FontSizes.xs,
    color: Colors.gray400,
    fontWeight: FontWeights.medium,
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.navy,
  },

  // ── Tabs ──
  tabRow: {
    flexDirection: "row",
    backgroundColor: Colors.white,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Layout.screenPaddingH,
  },
  tabBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: Spacing[3],
    paddingHorizontal: Spacing[2],
    marginRight: Spacing[4],
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
    gap: Spacing.xs,
  },
  tabBtnActive: { borderBottomColor: Colors.gold },
  tabBtnText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.medium,
    color: Colors.textSecondary,
  },
  tabBtnTextActive: {
    color: Colors.navy,
    fontWeight: FontWeights.bold,
  },
  tabPill: {
    backgroundColor: Colors.gray200,
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
  },
  tabPillActive: { backgroundColor: Colors.goldLight },
  tabPillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.textSecondary,
  },
  tabPillTextActive: { color: Colors.goldDark },

  // ── Filter chips ──

  chipsScroll: {
    flexGrow: 0, // ← prevents ScrollView itself from stretching
    flexShrink: 0, // ← prevents ScrollView from being compressed by parent
  },

  chipsRow: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[3],
    gap: Spacing[2],
  },

  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full,
    borderWidth: 1.5,
    alignSelf: "flex-start", // ← ADD: chip sizes to its own content, never stretches
  },

  chipIcon: { fontSize: 13 },

  chipLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },

  chipCount: {
    borderRadius: BorderRadius.full,
    paddingHorizontal: 6,
    paddingVertical: 1,
    minWidth: 18,
    alignItems: "center",
    flexShrink: 0, // ← ADD: badge never squeezes either
  },

  chipCountText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },

  // ── List ──
  listContent: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[2],
  },

  // ── Card ──
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    overflow: "hidden",
    flexDirection: "row",
    ...Shadows.base,
  },
  cardAccent: {
    width: 4,
    borderTopLeftRadius: BorderRadius.md,
    borderBottomLeftRadius: BorderRadius.md,
  },
  cardInner: {
    flex: 1,
    padding: Spacing[4],
  },
  cardTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: Spacing[2],
    marginBottom: Spacing[2],
  },
  cardPurpose: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.navy,
  },
  cardMeta: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing[1],
  },
  cardMetaIcon: { fontSize: 13 },
  cardDate: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  cardMetaDot: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
  },
  cardCompanions: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  rejectionRow: {
    flexDirection: "row",
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.sm,
    padding: Spacing.sm,
    marginTop: Spacing[2],
  },
  rejectionLabel: {
    fontSize: FontSizes.xs,
    color: Colors.danger,
    fontWeight: FontWeights.bold,
  },
  rejectionText: {
    flex: 1,
    fontSize: FontSizes.xs,
    color: Colors.danger,
    lineHeight: 16,
  },
  approvedHint: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: Spacing[2],
  },
  approvedHintText: {
    fontSize: FontSizes.xs,
    color: Colors.success,
    fontWeight: FontWeights.semibold,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: Spacing[3],
    paddingTop: Spacing[2],
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  cardTicket: {
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    fontWeight: FontWeights.medium,
    letterSpacing: 0.5,
  },
  cardCtaBtn: {
    paddingHorizontal: Spacing[3],
    paddingVertical: 4,
    borderRadius: BorderRadius.full,
  },
  cardCtaText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
  },

  // ── Badge ──
  badge: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },

  // ── Empty ──
  emptyWrap: {
    alignItems: "center",
    paddingTop: Spacing[12],
    paddingHorizontal: Spacing.lg,
    gap: Spacing[3],
  },
  emptyIcon: { fontSize: 48 },
  emptyTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
    textAlign: "center",
    lineHeight: 22,
  },

  // ── Centre box ──
  centreBox: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[3],
    padding: Spacing.lg,
  },
  loadingText: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },
  errorIcon: { fontSize: 40 },
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
});
