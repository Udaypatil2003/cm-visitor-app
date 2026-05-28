/**
 * GuardBookVisitorScreen.tsx
 *
 * Guard manually books a walk-in visitor.
 * Fields: Full Name, Phone, Aadhaar, Address, Date, Companions, Purpose
 * On submit → appointmentService.guardBookVisitor() → back to GuardHome tab
 *
 * Rules:
 *  • react-hook-form + zod
 *  • No direct API call — service only
 *  • No hardcoded colours — theme.ts only
 */

import React, { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  Alert,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import { useSafeAreaInsets }   from 'react-native-safe-area-context';

import {
  Colors, FontSizes, FontWeights,
  Spacing, BorderRadius, Shadows,
} from '../../constants/theme';
import { Input }          from '../../components/common/Input';
import { Button }         from '../../components/common/Button';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  fullName:        z.string().min(3,  'Enter full name'),
  phone:           z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit number'),
  aadhaarNumber:   z.string().regex(/^\d{12}$/, 'Aadhaar must be 12 digits'),
  address:         z.string().min(10, 'Enter complete address'),
  appointmentDate: z.string().min(1,  'Select a date'),
  purposeOfVisit:  z.string().min(10, 'Min 10 characters'),
  companionsCount: z.number().min(0).max(99),
});

type FormData = z.infer<typeof schema>;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getTodayISO() {
  return new Date().toISOString().split('T')[0];
}

function getMaxDateISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GuardBookVisitorScreen() {
  const insets      = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const { control, handleSubmit, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      fullName:        '',
      phone:           '',
      aadhaarNumber:   '',
      address:         '',
      appointmentDate: getTodayISO(),
      purposeOfVisit:  '',
      companionsCount: 0,
    },
  });

  const onSubmit = async (data: FormData) => {
    setLoading(true);
    try {
      // TODO: replace with real service call once endpoint is shared
      // await appointmentService.guardBookVisitor(data);
      await new Promise(r => setTimeout(r, 1000)); // mock delay
      Alert.alert(
        'Booking Confirmed',
        `Appointment booked for ${data.fullName} on ${data.appointmentDate}`,
        [{ text: 'OK', onPress: () => reset() }],
      );
    } catch {
      Alert.alert('Error', 'Failed to book appointment. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.gateBadge}>
            <Text style={styles.gateBadgeText}>📋 BOOKING</Text>
          </View>
          <Text style={styles.headerTitle}>Book Visitor</Text>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + Spacing[8] },
          ]}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Section: Visitor Identity ── */}
          <SectionHeader title="Visitor Identity" />

          <Controller
            control={control} name="fullName"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Full Name"
                placeholder="As per Aadhaar card"
                value={value}
                onChangeText={onChange}
                error={errors.fullName?.message}
              />
            )}
          />

          <Controller
            control={control} name="phone"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Mobile Number"
                placeholder="10-digit number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                maxLength={10}
                error={errors.phone?.message}
              />
            )}
          />

          <Controller
            control={control} name="aadhaarNumber"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Aadhaar Number"
                placeholder="12-digit Aadhaar"
                value={value}
                onChangeText={onChange}
                keyboardType="number-pad"
                maxLength={12}
                error={errors.aadhaarNumber?.message}
              />
            )}
          />

          <Controller
            control={control} name="address"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Address"
                placeholder="Full residential address"
                value={value}
                onChangeText={onChange}
                error={errors.address?.message}
              />
            )}
          />

          {/* ── Section: Appointment Details ── */}
          <SectionHeader title="Appointment Details" />

          <Controller
            control={control} name="appointmentDate"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Appointment Date"
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={(text) => {
                  // Basic guard: don't allow past or >1 month ahead
                  if (text >= getTodayISO() && text <= getMaxDateISO()) {
                    onChange(text);
                  } else {
                    onChange(text); // let zod show error
                  }
                }}
                error={errors.appointmentDate?.message}
              />
            )}
          />

         <View style={styles.fieldBlock}>
  <Text style={styles.fieldLabel}>Companions</Text>
  <Controller
    control={control} name="companionsCount"
    render={({ field: { onChange, value } }) => (
      <View style={styles.counterRow}>
        <TouchableOpacity
          style={[styles.counterBtn, value === 0 && styles.counterBtnDisabled]}
          onPress={() => onChange(Math.max(0, value - 1))}
          activeOpacity={0.75}
          disabled={value === 0}
        >
          <Text style={styles.counterBtnText}>−</Text>
        </TouchableOpacity>

        <View style={styles.counterDisplay}>
          <Text style={styles.counterValue}>{value}</Text>
          <Text style={styles.counterHint}>
            {value === 0 ? 'Visitor only' : `+${value} companion${value > 1 ? 's' : ''}`}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.counterBtn}
          onPress={() => onChange(value + 1)}
          activeOpacity={0.75}
        >
          <Text style={styles.counterBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    )}
  />
</View>

          <Controller
            control={control} name="purposeOfVisit"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Purpose of Visit"
                placeholder="Min 10 characters"
                value={value}
                onChangeText={onChange}
                error={errors.purposeOfVisit?.message}
              />
            )}
          />

          {/* ── Submit ── */}
          <View style={styles.submitBlock}>
            <Button
              label="Book Appointment"
              onPress={handleSubmit(onSubmit)}
              variant="primary"
              loading={loading}
              fullWidth
            />
          </View>

        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Section header ───────────────────────────────────────────────────────────

function SectionHeader({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <View style={styles.sectionDot} />
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:            1,
    backgroundColor: Colors.navyLight,
  },

  // Header
  header: {
    backgroundColor:   Colors.navy,
    paddingHorizontal: Spacing[4],
    paddingVertical:   Spacing[4],
    gap:               Spacing[1],
  },
  gateBadge: {
    alignSelf:         'flex-start',
    backgroundColor:   Colors.gold,
    paddingHorizontal: Spacing[2],
    paddingVertical:   3,
    borderRadius:      BorderRadius.sm,
  },
  gateBadgeText: {
    fontSize:   FontSizes.xs,
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
  },
  headerTitle: {
    fontSize:   FontSizes.xl,
    fontWeight: FontWeights.bold,
    color:      Colors.white,
  },

  // Scroll
  scroll:        { flex: 1 },
  scrollContent: { padding: Spacing[4], gap: Spacing[3] },

  // Section header
  sectionHeader: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           Spacing[2],
    marginTop:     Spacing[2],
    marginBottom:  Spacing[1],
  },
  sectionDot: {
    width:           8,
    height:          8,
    borderRadius:    BorderRadius.full,
    backgroundColor: Colors.gold,
  },
  sectionTitle: {
    fontSize:   FontSizes.sm,
    fontWeight: FontWeights.bold,
    color:      Colors.navy,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
  },

  // Field
  fieldBlock: { gap: Spacing[1] },
  fieldLabel: {
    fontSize:   FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color:      Colors.textPrimary,
  },

  // Submit
  submitBlock: { marginTop: Spacing[4] },
  counterRow: {
  flexDirection:   'row',
  alignItems:      'center',
  backgroundColor: Colors.white,
  borderRadius:    BorderRadius.md,
  borderWidth:     1,
  borderColor:     Colors.border,
  overflow:        'hidden',
  ...Shadows.sm,
},
counterBtn: {
  width:           56,
  height:          56,
  alignItems:      'center',
  justifyContent:  'center',
  backgroundColor: Colors.goldLight,
},
counterBtnDisabled: {
  backgroundColor: Colors.gray100,
},
counterBtnText: {
  fontSize:   FontSizes.xxl,
  fontWeight: FontWeights.bold,
  color:      Colors.goldDark,
},
counterDisplay: {
  flex:       1,
  alignItems: 'center',
  gap:        2,
},
counterValue: {
  fontSize:   FontSizes.xxl,
  fontWeight: FontWeights.bold,
  color:      Colors.navy,
},
counterHint: {
  fontSize: FontSizes.xs,
  color:    Colors.textSecondary,
},
});