import React, { useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver }         from '@hookform/resolvers/zod';
import { z }                   from 'zod';
import { useSafeAreaInsets }   from 'react-native-safe-area-context';
import * as ImagePicker        from 'expo-image-picker';

import {
  Colors, FontSizes, FontWeights,
  Spacing, BorderRadius, Shadows,
} from '../../constants/theme';
import { Input }               from '../../components/common/Input';
import { Button }              from '../../components/common/Button';
import appointmentService      from '../../services/appointmentService';

// ─── Schema ───────────────────────────────────────────────────────────────────

const schema = z.object({
  mobilenumber:    z.string().regex(/^[6-9]\d{9}$/, 'Enter valid 10-digit mobile number'),
  username:        z.string().min(3,  'Username must be at least 3 characters'),
  password:        z.string().min(6,  'Password must be at least 6 characters'),
  appointmentDate: z.string().min(1,  'Select a date'),
  companionsCount: z.number().min(0).max(99),
  purposeOfVisit:  z.string().min(10, 'Describe purpose (min 10 characters)'),
  referenceName:   z.string().optional(),
  vehicleNumber:   z.string().optional(),
});

type FormData = z.infer<typeof schema>;

// ─── Date helpers ─────────────────────────────────────────────────────────────

function getTodayISO()  { return new Date().toISOString().split('T')[0]; }
function getMaxDateISO() {
  const d = new Date();
  d.setMonth(d.getMonth() + 1);
  return d.toISOString().split('T')[0];
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

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function GuardBookVisitorScreen() {
  const insets  = useSafeAreaInsets();
  const [loading,  setLoading]  = useState(false);
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [photoErr, setPhotoErr] = useState('');

  const {
    control, handleSubmit, reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      mobilenumber:    '',
      username:        '',
      password:        '',
      appointmentDate: getTodayISO(),
      companionsCount: 0,
      purposeOfVisit:  '',
      referenceName:   '',
      vehicleNumber:   '',
    },
  });

  // ── Photo picker ────────────────────────────────────────────────────────────

  async function pickPhoto() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow photo access to attach a visitor photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoErr('');
    }
  }

  async function takePhoto() {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission required', 'Allow camera access to capture visitor photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.85,
    });
    if (!result.canceled && result.assets[0]) {
      setPhotoUri(result.assets[0].uri);
      setPhotoErr('');
    }
  }

  // ── Submit ──────────────────────────────────────────────────────────────────

  const onSubmit = async (data: FormData) => {
    if (!photoUri) {
      setPhotoErr('Visitor photo is required');
      return;
    }

    setLoading(true);
    try {
      const res = await appointmentService.guardBookVisitor({
        mobilenumber:    data.mobilenumber,
        username:        data.username,
        password:        data.password,
        appointmentDate: data.appointmentDate,
        companionsCount: data.companionsCount,
        purposeOfVisit:  data.purposeOfVisit,
        referenceName:   data.referenceName  || undefined,
        vehicleNumber:   data.vehicleNumber  || undefined,
        photoUri,
      });

      if (!res.success) {
        Alert.alert('Booking Failed', res.message ?? 'Please try again.');
        return;
      }

      Alert.alert(
        'Booking Confirmed ✓',
        `Appointment #${res.data.id} created for ${data.appointmentDate}`,
        [{
          text: 'OK', onPress: () => {
            reset();
            setPhotoUri(null);
          },
        }],
      );
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Network error. Please try again.';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Render ──────────────────────────────────────────────────────────────────

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.root, { paddingTop: insets.top }]}>

        {/* ── Header ── */}
        <View style={styles.header}>
          <View style={styles.gateBadge}>
            <Text style={styles.gateBadgeText}>📋  BOOKING</Text>
          </View>
          <Text style={styles.headerTitle}>Book Walk-in Visitor</Text>
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

          {/* ══ VISITOR IDENTITY ══════════════════════════════════════════════ */}
          <SectionHeader title="Visitor Identity" />

          <Controller
            control={control} name="mobilenumber"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Mobile Number"
                placeholder="10-digit mobile number"
                value={value}
                onChangeText={onChange}
                keyboardType="phone-pad"
                maxLength={10}
                error={errors.mobilenumber?.message}
              />
            )}
          />

          <Controller
            control={control} name="username"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Username"
                placeholder="Unique username for this visitor"
                value={value}
                onChangeText={onChange}
                autoCapitalize="none"
                error={errors.username?.message}
              />
            )}
          />

          <Controller
            control={control} name="password"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Password"
                placeholder="Min 6 characters"
                value={value}
                onChangeText={onChange}
                secureTextEntry
                error={errors.password?.message}
              />
            )}
          />

          {/* ── Photo picker ── */}
          <View style={styles.fieldBlock}>
            <Text style={styles.fieldLabel}>
              Visitor Photo <Text style={styles.required}>*</Text>
            </Text>

            {photoUri ? (
              <View style={styles.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={styles.photoPreview} />
                <TouchableOpacity
                  style={styles.photoChangeBtn}
                  onPress={pickPhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoChangeBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.photoPickerRow}>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={takePhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoBtnIcon}>📷</Text>
                  <Text style={styles.photoBtnText}>Camera</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.photoBtn}
                  onPress={pickPhoto}
                  activeOpacity={0.8}
                >
                  <Text style={styles.photoBtnIcon}>🖼️</Text>
                  <Text style={styles.photoBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
            {photoErr ? <Text style={styles.errorText}>{photoErr}</Text> : null}
          </View>

          {/* ══ APPOINTMENT DETAILS ═══════════════════════════════════════════ */}
          <SectionHeader title="Appointment Details" />

          <Controller
            control={control} name="appointmentDate"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Appointment Date"
                placeholder="YYYY-MM-DD"
                value={value}
                onChangeText={onChange}
                error={errors.appointmentDate?.message}
              />
            )}
          />

          {/* Companions counter */}
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

          <Controller
  control={control} name="referenceName"
  render={({ field: { onChange, value } }) => (
    <Input
      label="Reference Name (optional)"     
      placeholder="Name of referring person"
      value={value ?? ''}                    
      onChangeText={onChange}
      error={errors.referenceName?.message}
    />
  )}
/>

<Controller
  control={control} name="vehicleNumber"
  render={({ field: { onChange, value } }) => (
    <Input
      label="Vehicle Number (optional)"      
      placeholder="e.g. MH 04 AB 1234"
      value={value ?? ''}                    
      onChangeText={(t) => onChange(t.toUpperCase())}
      autoCapitalize="characters"
      maxLength={15}
      error={errors.vehicleNumber?.message}
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

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:   { flex: 1, backgroundColor: Colors.navyLight },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[3],
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[3],
    backgroundColor: Colors.white, borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  gateBadge: {
    backgroundColor: Colors.goldLight, borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing[2], paddingVertical: 3,
  },
  gateBadgeText: { fontSize: FontSizes.xs, fontWeight: FontWeights.bold, color: Colors.goldDark },
  headerTitle:   { fontSize: FontSizes.md, fontWeight: FontWeights.bold, color: Colors.navy },

  scroll:        { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing[4], paddingTop: Spacing[4] },

  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: Spacing[2],
    marginTop: Spacing[5], marginBottom: Spacing[3],
  },
  sectionDot:  { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.gold },
  sectionTitle:{ fontSize: FontSizes.base, fontWeight: FontWeights.bold, color: Colors.navy },

  fieldBlock:  { marginBottom: Spacing[4] },
  fieldLabel:  { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.navy, marginBottom: Spacing[2] },
  required:    { color: Colors.danger },
  optional:    { fontSize: FontSizes.xs, fontWeight: FontWeights.regular, color: Colors.textSecondary },
  errorText:   { fontSize: FontSizes.xs, color: Colors.danger, marginTop: 4 },

  // Photo picker
  photoPickerRow: { flexDirection: 'row', gap: Spacing[3] },
  photoBtn: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingVertical: Spacing[4], borderRadius: BorderRadius.md,
    borderWidth: 1.5, borderColor: Colors.border,
    borderStyle: 'dashed', backgroundColor: Colors.white, gap: Spacing[1],
  },
  photoBtnIcon:   { fontSize: FontSizes.xl },
  photoBtnText:   { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textSecondary },
  photoPreviewWrap: { alignItems: 'center', gap: Spacing[2] },
  photoPreview: {
    width: 120, height: 160, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gray200,
  },
  photoChangeBtn: {
    paddingHorizontal: Spacing[4], paddingVertical: Spacing[2],
    borderRadius: BorderRadius.full, backgroundColor: Colors.goldLight,
  },
  photoChangeBtnText: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.goldDark },

  // Companions counter
  counterRow:    { flexDirection: 'row', alignItems: 'center', gap: Spacing[3] },
  counterBtn: {
    width: 44, height: 44, borderRadius: BorderRadius.md,
    backgroundColor: Colors.gold, alignItems: 'center', justifyContent: 'center',
    ...Shadows.sm,
  },
  counterBtnDisabled: { backgroundColor: Colors.gray300 },
  counterBtnText:     { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.navy },
  counterDisplay:     { flex: 1, alignItems: 'center' },
  counterValue:  { fontSize: FontSizes.xxl, fontWeight: FontWeights.bold, color: Colors.navy },
  counterHint:   { fontSize: FontSizes.xs, color: Colors.textSecondary, marginTop: 2 },

  submitBlock: { marginTop: Spacing[6] },
});