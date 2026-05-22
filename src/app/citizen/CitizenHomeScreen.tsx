import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { AppHeader } from '../../components/common/AppHeader';
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from '../../constants/theme';
import { useAuthStore } from '../../store/authStore';
import { useAppointmentStore } from '../../store/appointmentStore';
import appointmentService from '../../services/appointmentService';
import { CitizenStackParamList } from '../../navigation/types';
import { Appointment, AppointmentStatus } from '../../types/appointment.types';

type Nav = NativeStackNavigationProp<CitizenStackParamList>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

const STATUS_CONFIG: Record <
  AppointmentStatus,
  { label: string; bg: string; text: string }
> = {
  APPROVED: { label: 'Approved', bg: Colors.successLight, text: Colors.success },
  PENDING:  { label: 'Pending',  bg: Colors.warningLight, text: Colors.warning },
  REJECTED: { label: 'Rejected', bg: Colors.dangerLight,  text: Colors.danger  },
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: AppointmentStatus }) {
  const cfg = STATUS_CONFIG[status];
  return (
    <View style={[badge.wrap, { backgroundColor: cfg.bg }]}>
      <Text style={[badge.text, { color: cfg.text }]}>{cfg.label}</Text>
    </View>
  );
}

const badge = StyleSheet.create({
  wrap: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
    borderRadius: BorderRadius.full,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.semibold,
  },
});

// ── Appointment row card (no image) ───────────────────────────────────────────

interface AppointmentCardProps {
  item: Appointment;
  onPress: () => void;
}

function AppointmentCard({ item, onPress }: AppointmentCardProps) {
  return (
    <TouchableOpacity
      style={card.wrap}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={card.top}>
        <Text style={card.purpose} numberOfLines={1}>
          {item.purposeOfVisit}
        </Text>
        <StatusBadge status={item.status} />
      </View>

      <View style={card.meta}>
        <Text style={card.date}>{formatDate(item.appointmentDate)}</Text>
        {item.companionsCount > 0 && (
          <Text style={card.companions}>
            +{item.companionsCount} companion{item.companionsCount > 1 ? 's' : ''}
          </Text>
        )}
      </View>

      {item.status === 'REJECTED' && item.rejectionReason ? (
        <Text style={card.rejection} numberOfLines={2}>
          {item.rejectionReason}
        </Text>
      ) : null}

      <View style={card.footer}>
        <Text style={card.passLink}>
          {item.status === 'APPROVED' ? 'View Pass ›' : 'View Details ›'}
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const card = StyleSheet.create({
  wrap: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginBottom: Spacing[3],
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing[2],
  },
  purpose: {
    flex: 1,
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.navy,
    marginRight: Spacing[2],
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[3],
    marginBottom: Spacing[1],
  },
  date: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  companions: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
  rejection: {
    fontSize: FontSizes.sm,
    color: Colors.danger,
    marginTop: Spacing[1],
    marginBottom: Spacing[1],
  },
  footer: {
    marginTop: Spacing[2],
    alignItems: 'flex-end',
  },
  passLink: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
  },
});

// ── Section header ─────────────────────────────────────────────────────────────

function SectionHeader({ title, count }: { title: string; count: number }) {
  return (
    <View style={sec.row}>
      <Text style={sec.title}>{title}</Text>
      {count > 0 && (
        <View style={sec.pill}>
          <Text style={sec.pillText}>{count}</Text>
        </View>
      )}
    </View>
  );
}

const sec = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing[3],
    marginTop: Spacing[5],
  },
  title: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  pill: {
    marginLeft: Spacing[2],
    backgroundColor: Colors.goldLight,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[2],
    paddingVertical: 2,
  },
  pillText: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.goldDark,
  },
});

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ label }: { label: string }) {
  return (
    <View style={empty.wrap}>
      <Text style={empty.text}>{label}</Text>
    </View>
  );
}

const empty = StyleSheet.create({
  wrap: {
    paddingVertical: Spacing[6],
    alignItems: 'center',
  },
  text: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
  },
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

  const firstName = citizenUser?.fullName?.split(' ')[0] ?? 'there';

  // ── Fetch ────────────────────────────────────────────────────────────────────

  async function fetchAppointments(silent = false) {
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await appointmentService.getMyAppointments();
      if (res.success) setAppointments(res.data);
      else setError(res.message ?? 'Failed to load appointments');
    } catch {
      setError('Could not load appointments. Please try again.');
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

  // ── Derived ──────────────────────────────────────────────────────────────────

  const upcoming = getUpcoming();
  const past = getPast();
  const nextApproved = getNextApproved();

  // ── Nav helper ───────────────────────────────────────────────────────────────

  function goToDetail(appointmentId: string) {
    navigation.navigate('AppointmentDetail', { appointmentId });
  }

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <View style={styles.root}>
      <AppHeader title="Book Darshan Portal" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
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
        {/* Greeting */}
        <Text style={styles.greeting}>Hello, {firstName} 👋</Text>

        {/* Next approved pass banner */}
        {nextApproved && (
          <TouchableOpacity
            style={styles.passBanner}
            onPress={() => goToDetail(nextApproved.id)}
            activeOpacity={0.8}
          >
            <View style={styles.passBannerLeft}>
              <Text style={styles.passBannerLabel}>UPCOMING PASS</Text>
              <Text style={styles.passBannerDate}>
                {formatDate(nextApproved.appointmentDate)}
              </Text>
              <Text style={styles.passBannerPurpose} numberOfLines={1}>
                {nextApproved.purposeOfVisit}
              </Text>
            </View>
            <View style={styles.passBannerRight}>
              <Text style={styles.passBannerCta}>View Pass ›</Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Loading */}
        {isLoading && !refreshing && (
          <ActivityIndicator
            style={styles.loader}
            size="large"
            color={Colors.gold}
          />
        )}

        {/* Error */}
        {!isLoading && error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={() => fetchAppointments()}>
              <Text style={styles.retryText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Upcoming appointments */}
        {!isLoading && !error && (
          <>
            <SectionHeader title="Upcoming" count={upcoming.length} />
            {upcoming.length === 0 ? (
              <EmptyState label="No upcoming appointments" />
            ) : (
              upcoming.map((a) => (
                <AppointmentCard
                  key={a.id}
                  item={a}
                  onPress={() => goToDetail(a.id)}
                />
              ))
            )}

            <SectionHeader title="Previous" count={past.length} />
            {past.length === 0 ? (
              <EmptyState label="No past appointments" />
            ) : (
              past.map((a) => (
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

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[5],
  },
  greeting: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginBottom: Spacing[4],
  },

  // ── Pass banner ──────────────────────────────────────────────────────────────
  passBanner: {
    backgroundColor: Colors.navy,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing[2],
    ...Shadows.md,
  },
  passBannerLeft: {
    flex: 1,
    marginRight: Spacing[3],
  },
  passBannerLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
    letterSpacing: 1,
    marginBottom: 2,
  },
  passBannerDate: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.white,
    marginBottom: 2,
  },
  passBannerPurpose: {
    fontSize: FontSizes.sm,
    color: Colors.gray400,
  },
  passBannerRight: {},
  passBannerCta: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.gold,
  },

  // ── Loader / error ───────────────────────────────────────────────────────────
  loader: {
    marginTop: Spacing[10],
  },
  errorBox: {
    marginTop: Spacing[6],
    alignItems: 'center',
    gap: Spacing[2],
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.danger,
    textAlign: 'center',
  },
  retryText: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
  },
});