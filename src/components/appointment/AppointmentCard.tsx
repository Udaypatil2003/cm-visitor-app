import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Appointment } from '../../types/appointment.types';
import { StatusBadge } from '../common/StatusBadge';
import { formatDate } from '../../utils/dateUtils';
import {
  Colors,
  FontSizes,
  FontWeights,
  BorderRadius,
  Spacing,
  Shadows,
} from '../../constants/theme';

interface AppointmentCardProps {
  appointment: Appointment;
  onPress: () => void;
}

const COMPANION_LABEL: Record<0 | 1 | 2, string> = {
  0: 'No companions',
  1: '+1 companion',
  2: '+2 companions',
};

export const AppointmentCard: React.FC<AppointmentCardProps> = ({
  appointment,
  onPress,
}) => {
  const {
    appointmentDate,
    purposeOfVisit,
    companionsCount,
    status,
  } = appointment;

  const truncatedPurpose =
    purposeOfVisit.length > 60
      ? purposeOfVisit.slice(0, 60) + '...'
      : purposeOfVisit;

  return (
    <TouchableOpacity
      onPress={onPress}
      activeOpacity={0.8}
      style={styles.card}
    >
      {/* Left accent bar keyed to status */}
      <View
        style={[
          styles.accentBar,
          status === 'APPROVED' && { backgroundColor: Colors.success },
          status === 'PENDING' && { backgroundColor: Colors.warning },
          status === 'REJECTED' && { backgroundColor: Colors.danger },
        ]}
      />

      <View style={styles.content}>
        {/* Top row — date + badge */}
        <View style={styles.topRow}>
          <Text style={styles.date}>{formatDate(appointmentDate)}</Text>
          <StatusBadge status={status} size="sm" />
        </View>

        {/* Purpose */}
        <Text style={styles.purpose} numberOfLines={2}>
          {truncatedPurpose}
        </Text>

        {/* Bottom row — companions */}
        <View style={styles.bottomRow}>
          <Text style={styles.meta}>👥 {COMPANION_LABEL[companionsCount]}</Text>
          <Text style={styles.chevron}>›</Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing[3],
    overflow: 'hidden',
    ...Shadows.base,
  },
  accentBar: {
    width: 4,
    backgroundColor: Colors.gray300,
  },
  content: {
    flex: 1,
    padding: Spacing[4],
    gap: Spacing[2],
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  date: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textPrimary,
  },
  purpose: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: Spacing[1],
  },
  meta: {
    fontSize: FontSizes.xs,
    color: Colors.gray500,
  },
  chevron: {
    fontSize: FontSizes.xl,
    color: Colors.gray400,
    lineHeight: 22,
  },
});