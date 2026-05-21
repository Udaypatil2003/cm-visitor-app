import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { QRVerifyResult } from '../../types/guard.types';
import { Avatar } from '../common/Avatar';
import { formatDate, maskAadhaar } from '../../utils/dateUtils';
import {
  Colors,
  FontSizes,
  FontWeights,
  BorderRadius,
  Spacing,
  Shadows,
} from '../../constants/theme';

interface ScanResultCardProps {
  result: QRVerifyResult;
}

interface InfoRowProps {
  label: string;
  value: string;
}

const InfoRow: React.FC<InfoRowProps> = ({ label, value }) => (
  <View style={styles.infoRow}>
    <Text style={styles.infoLabel}>{label}</Text>
    <Text style={styles.infoValue}>{value}</Text>
  </View>
);

export const ScanResultCard: React.FC<ScanResultCardProps> = ({ result }) => {
  if (result.isValid && result.status === 'APPROVED') {
    return (
      <View style={[styles.card, styles.cardValid]}>
        {/* Header */}
        <View style={styles.validHeader}>
          <View style={styles.iconCircleValid}>
            <Text style={styles.iconText}>✓</Text>
          </View>
          <Text style={styles.validTitle}>APPROVED</Text>
          <Text style={styles.validSubtitle}>Entry Permitted</Text>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Citizen details */}
        <View style={styles.citizenRow}>
          <Avatar
            uri={result.citizenPhoto}
            size={64}
            name={result.citizenName ?? undefined}
          />
          <View style={styles.citizenInfo}>
            <Text style={styles.citizenName}>{result.citizenName}</Text>
            <Text style={styles.citizenAadhaar}>
              {result.aadhaarNumber
                ? maskAadhaar(result.aadhaarNumber)
                : 'N/A'}
            </Text>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.divider} />

        {/* Appointment details */}
        <View style={styles.detailsGrid}>
          {result.appointmentDate && (
            <InfoRow
              label="Date"
              value={formatDate(result.appointmentDate)}
            />
          )}
          {result.companionsCount !== null && (
            <InfoRow
              label="Companions"
              value={String(result.companionsCount)}
            />
          )}
          {result.address && (
            <InfoRow label="Address" value={result.address} />
          )}
          {result.city && (
            <InfoRow label="City" value={result.city} />
          )}
          {result.purposeOfVisit && (
            <InfoRow label="Purpose" value={result.purposeOfVisit} />
          )}
        </View>
      </View>
    );
  }

  // Failure states — EXPIRED / INVALID / NOT_APPROVED
  const FAILURE_ICON: Record<string, string> = {
    EXPIRED: '⏱',
    INVALID: '⚠️',
    NOT_APPROVED: '🚫',
  };

  const FAILURE_TITLE: Record<string, string> = {
    EXPIRED: 'QR EXPIRED',
    INVALID: 'INVALID QR',
    NOT_APPROVED: 'NOT APPROVED',
  };

  const icon = FAILURE_ICON[result.status] ?? '✗';
  const title = FAILURE_TITLE[result.status] ?? 'DENIED';

  return (
    <View style={[styles.card, styles.cardInvalid]}>
      <View style={styles.invalidHeader}>
        <View style={styles.iconCircleInvalid}>
          <Text style={styles.iconTextLarge}>{icon}</Text>
        </View>
        <Text style={styles.invalidTitle}>{title}</Text>
        <Text style={styles.invalidSubtitle}>Entry Denied</Text>
      </View>

      <View style={styles.dividerInvalid} />

      <View style={styles.reasonContainer}>
        <Text style={styles.reasonText}>{result.message}</Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: BorderRadius.xl,
    padding: Spacing[5],
    gap: Spacing[4],
    ...Shadows.lg,
  },
  cardValid: {
    backgroundColor: Colors.successLight,
    borderWidth: 1.5,
    borderColor: Colors.success,
  },
  cardInvalid: {
    backgroundColor: Colors.dangerLight,
    borderWidth: 1.5,
    borderColor: Colors.danger,
  },

  // Valid header
  validHeader: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingTop: Spacing[2],
  },
  iconCircleValid: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.success,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconText: {
    fontSize: 36,
    color: Colors.white,
    fontWeight: FontWeights.bold,
  },
  validTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.extrabold,
    color: Colors.success,
    letterSpacing: 2,
  },
  validSubtitle: {
    fontSize: FontSizes.base,
    color: Colors.success,
    fontWeight: FontWeights.medium,
  },

  divider: {
    height: 1,
    backgroundColor: Colors.success,
    opacity: 0.25,
  },
  dividerInvalid: {
    height: 1,
    backgroundColor: Colors.danger,
    opacity: 0.25,
  },

  // Citizen row
  citizenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[4],
  },
  citizenInfo: {
    flex: 1,
    gap: Spacing[1],
  },
  citizenName: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
  },
  citizenAadhaar: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },

  // Info rows
  detailsGrid: {
    gap: Spacing[2],
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingVertical: Spacing[1],
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
    flex: 1,
  },
  infoValue: {
    fontSize: FontSizes.sm,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
    flex: 2,
    textAlign: 'right',
  },

  // Invalid header
  invalidHeader: {
    alignItems: 'center',
    gap: Spacing[2],
    paddingTop: Spacing[2],
  },
  iconCircleInvalid: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconTextLarge: {
    fontSize: 32,
  },
  invalidTitle: {
    fontSize: FontSizes['2xl'],
    fontWeight: FontWeights.extrabold,
    color: Colors.danger,
    letterSpacing: 2,
  },
  invalidSubtitle: {
    fontSize: FontSizes.base,
    color: Colors.danger,
    fontWeight: FontWeights.medium,
  },

  reasonContainer: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.base,
    padding: Spacing[4],
  },
  reasonText: {
    fontSize: FontSizes.base,
    color: Colors.danger,
    textAlign: 'center',
    lineHeight: 22,
    fontWeight: FontWeights.medium,
  },
});