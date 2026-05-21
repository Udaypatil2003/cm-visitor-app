import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { AppointmentStatus } from '../../types/appointment.types';
import { Colors, FontSizes, FontWeights, BorderRadius, Spacing } from '../../constants/theme';

interface StatusBadgeProps {
  status: AppointmentStatus;
  size?: 'sm' | 'md';
}

const STATUS_CONFIG: Record<
  AppointmentStatus,
  { label: string; bg: string; text: string; dot: string }
> = {
  PENDING: {
    label: 'Pending',
    bg: Colors.warningLight,
    text: Colors.warning,
    dot: Colors.warning,
  },
  APPROVED: {
    label: 'Approved',
    bg: Colors.successLight,
    text: Colors.success,
    dot: Colors.success,
  },
  REJECTED: {
    label: 'Rejected',
    bg: Colors.dangerLight,
    text: Colors.danger,
    dot: Colors.danger,
  },
};

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  size = 'md',
}) => {
  const config = STATUS_CONFIG[status];
  const isSmall = size === 'sm';

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: config.bg },
        isSmall && styles.badgeSmall,
      ]}
    >
      <View
        style={[
          styles.dot,
          { backgroundColor: config.dot },
          isSmall && styles.dotSmall,
        ]}
      />
      <Text
        style={[
          styles.label,
          { color: config.text },
          isSmall && styles.labelSmall,
        ]}
      >
        {config.label}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: Spacing[3],
    paddingVertical: Spacing[1],
    borderRadius: BorderRadius.full,
    gap: Spacing[1],
  },
  badgeSmall: {
    paddingHorizontal: Spacing[2],
    paddingVertical: 3,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: BorderRadius.full,
  },
  dotSmall: {
    width: 5,
    height: 5,
  },
  label: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  labelSmall: {
    fontSize: FontSizes.xs,
  },
});