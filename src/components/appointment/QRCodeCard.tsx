import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import QRCode from 'react-native-qrcode-svg';
import { Appointment } from '../../types/appointment.types';
import { formatDate, formatDateTime, maskAadhaar } from '../../utils/dateUtils';
import {
  Colors,
  FontSizes,
  FontWeights,
  BorderRadius,
  Spacing,
  Shadows,
} from '../../constants/theme';

interface QRCodeCardProps {
  appointment: Appointment;
}

export const QRCodeCard: React.FC<QRCodeCardProps> = ({ appointment }) => {
  const { status, qrToken, qrExpiresAt, rejectionReason } = appointment;

  if (status === 'APPROVED') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Entry Pass</Text>

        {/* QR Code */}
        <View style={styles.qrWrapper}>
          <QRCode
            value={qrToken || 'invalid'}
            size={200}
            color={Colors.black}
            backgroundColor={Colors.white}
          />
        </View>

        {/* Expiry */}
        <View style={styles.expiryRow}>
          <Text style={styles.expiryIcon}>⏰</Text>
          <Text style={styles.expiryText}>
            Valid until {formatDateTime(qrExpiresAt)}
          </Text>
        </View>

        {/* Instructions */}
        <View style={styles.instructionBox}>
          <Text style={styles.instructionText}>
            Show this QR code to the guard at the gate for entry. Do not share this code with anyone.
          </Text>
        </View>
      </View>
    );
  }

  if (status === 'PENDING') {
    return (
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Your Entry Pass</Text>

        {/* Blurred / locked QR placeholder */}
        <View style={styles.qrWrapper}>
          <View style={styles.qrBlurred}>
            {/* Fake QR grid for visual */}
            {Array.from({ length: 25 }).map((_, i) => (
              <View
                key={i}
                style={[
                  styles.qrCell,
                  Math.random() > 0.5 && styles.qrCellFilled,
                ]}
              />
            ))}
          </View>
          {/* Overlay */}
          <View style={styles.pendingOverlay}>
            <Text style={styles.lockIcon}>🔒</Text>
            <Text style={styles.pendingTitle}>Awaiting Approval</Text>
            <Text style={styles.pendingSubtitle}>
              Your QR code will appear here once the admin approves your appointment.
            </Text>
          </View>
        </View>

        <View style={[styles.instructionBox, styles.pendingBox]}>
          <Text style={styles.instructionText}>
            You will be notified once your appointment is approved.
          </Text>
        </View>
      </View>
    );
  }

  // REJECTED
  return (
    <View style={styles.card}>
      <Text style={styles.cardTitle}>Appointment Status</Text>

      <View style={styles.rejectedContainer}>
        <Text style={styles.rejectedIcon}>✗</Text>
        <Text style={styles.rejectedTitle}>Appointment Rejected</Text>
        {rejectionReason && (
          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>Reason:</Text>
            <Text style={styles.reasonText}>{rejectionReason}</Text>
          </View>
        )}
      </View>

      <View style={[styles.instructionBox, styles.rejectedBox]}>
        <Text style={[styles.instructionText, { color: Colors.danger }]}>
          You may book a new appointment if you wish to visit again.
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    padding: Spacing[5],
    alignItems: 'center',
    gap: Spacing[4],
    ...Shadows.md,
  },
  cardTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    alignSelf: 'flex-start',
  },
  qrWrapper: {
    width: 220,
    height: 220,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[2],
    borderWidth: 1,
    borderColor: Colors.border,
  },
  expiryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing[2],
    alignSelf: 'flex-start',
  },
  expiryIcon: {
    fontSize: FontSizes.base,
  },
  expiryText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  instructionBox: {
    backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.base,
    padding: Spacing[3],
    width: '100%',
  },
  instructionText: {
    fontSize: FontSizes.xs,
    color: Colors.primary,
    lineHeight: 18,
    textAlign: 'center',
  },

  // Pending state
  qrBlurred: {
    width: 200,
    height: 200,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    opacity: 0.15,
    padding: Spacing[2],
  },
  qrCell: {
    width: 34,
    height: 34,
    backgroundColor: Colors.gray300,
    borderRadius: 2,
  },
  qrCellFilled: {
    backgroundColor: Colors.gray700,
  },
  pendingOverlay: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing[4],
    gap: Spacing[2],
  },
  lockIcon: {
    fontSize: 32,
  },
  pendingTitle: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.textPrimary,
    textAlign: 'center',
  },
  pendingSubtitle: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 18,
  },
  pendingBox: {
    backgroundColor: Colors.warningLight,
  },

  // Rejected state
  rejectedContainer: {
    alignItems: 'center',
    gap: Spacing[3],
    paddingVertical: Spacing[4],
  },
  rejectedIcon: {
    fontSize: 48,
    color: Colors.danger,
  },
  rejectedTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.danger,
  },
  reasonBox: {
    backgroundColor: Colors.dangerLight,
    borderRadius: BorderRadius.base,
    padding: Spacing[3],
    gap: Spacing[1],
    width: '100%',
  },
  reasonLabel: {
    fontSize: FontSizes.xs,
    fontWeight: FontWeights.bold,
    color: Colors.danger,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  reasonText: {
    fontSize: FontSizes.sm,
    color: Colors.danger,
    lineHeight: 20,
  },
  rejectedBox: {
    backgroundColor: Colors.dangerLight,
  },
});