import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  ScrollView, TextInput, TouchableOpacity,
  ActivityIndicator, KeyboardAvoidingView, Platform,
  Image, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as ImagePicker from 'expo-image-picker';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import { useOnboardingStore } from '../../store/onboardingStore';
import userService from '../../services/userService';
import { onboardingSchema } from '../../utils/validationSchemas';
import { OnboardingFormData, Gender } from '../../types/user.types';
import {
  Colors, FontSizes, FontWeights,
  Spacing, BorderRadius, Shadows,
} from '../../constants/theme';


const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Male',   value: 'MALE'   },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other',  value: 'OTHER'  },
];

function parseDMY(val: string): string {
  const parts = val.split('/');
  if (parts.length === 3 && parts[2].length === 4)
    return `${parts[2]}-${parts[1].padStart(2,'0')}-${parts[0].padStart(2,'0')}`;
  return val;
}

export default function CitizenOnboardingScreen() {
  const { setCitizenUser, setNeedsOnboarding  } = useAuthStore();
  const { resetForm } = useOnboardingStore();
  const scrollRef = useRef<ScrollView>(null);
  const [dobDisplay, setDobDisplay] = useState('');
  const [photoUri, setPhotoUri] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const {
    control,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingSchema),
    defaultValues: {
      fullName: '',
      dateOfBirth: '',
      gender: 'MALE',
      aadhaarNumber: '',
      address: '',
      city: '',
      district: '',
      profilePhotoUri: '',
    },
  });

  const handleDobChange = (text: string) => {
    let clean = text.replace(/\D/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 4)
      formatted = `${clean.slice(0,2)}/${clean.slice(2,4)}/${clean.slice(4)}`;
    else if (clean.length > 2)
      formatted = `${clean.slice(0,2)}/${clean.slice(2)}`;
    setDobDisplay(formatted);
    if (clean.length === 8)
      setValue('dateOfBirth', parseDMY(formatted), { shouldValidate: true });
    else
      setValue('dateOfBirth', '', { shouldValidate: false });
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true, aspect: [1,1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setValue('profilePhotoUri', uri, { shouldValidate: true });
    }
  };

  const handleTakePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow camera access.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true, aspect: [1,1], quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setValue('profilePhotoUri', uri, { shouldValidate: true });
    }
  };

  // ── Submit ──────────────────────────────────────────────────────────────────
  const onSubmit = async (data: OnboardingFormData) => {
    setSubmitting(true);
    try {
      const res = await userService.createProfile(data);
      if (!res.success) {
        Alert.alert('Error', res.message || 'Failed to create profile');
        return;
      }
      // Store the returned user — RootNavigator sees isAuthenticated=true
      // + role='citizen' and auto-renders CitizenNavigator → CitizenHome
      setCitizenUser(res.data);
      setNeedsOnboarding(false);
      resetForm();
    } catch (e: any) {
      Alert.alert('Error', e?.message || 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onError = () => scrollRef.current?.scrollTo({ y: 0, animated: true });

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.gray100} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >

          {/* ── Header ─────────────────────────────────────────────────── */}
          <View style={s.header}>
            <View style={s.logoBadge}>
              <Text style={{ fontSize: 20 }}>🪷</Text>
            </View>
            <View>
              <Text style={s.headerTitle}>Complete Your Profile</Text>
              <Text style={s.headerSub}>One-time setup · Takes 2 minutes</Text>
            </View>
          </View>

          {/* ── Section 1: Personal ────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>👤  Personal Details</Text>

            <Text style={s.label}>Full Name <Text style={s.req}>*</Text></Text>
            <Controller
              control={control} name="fullName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, errors.fullName && s.inputError]}
                  placeholder="As per Aadhaar card"
                  placeholderTextColor={Colors.placeholder}
                  value={value} onChangeText={onChange}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.fullName && <Text style={s.error}>{errors.fullName.message}</Text>}

            <Text style={s.label}>Date of Birth <Text style={s.req}>*</Text></Text>
            <TextInput
              style={[s.input, errors.dateOfBirth && s.inputError]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor={Colors.placeholder}
              keyboardType="number-pad" maxLength={10}
              value={dobDisplay} onChangeText={handleDobChange}
            />
            {errors.dateOfBirth && <Text style={s.error}>{errors.dateOfBirth.message}</Text>}

            <Text style={s.label}>Gender <Text style={s.req}>*</Text></Text>
            <Controller
              control={control} name="gender"
              render={({ field: { onChange, value } }) => (
                <View style={s.genderRow}>
                  {GENDERS.map(g => (
                    <TouchableOpacity
                      key={g.value}
                      style={[s.genderBtn, value === g.value && s.genderBtnActive]}
                      onPress={() => onChange(g.value)}
                    >
                      <Text style={[s.genderText, value === g.value && s.genderTextActive]}>
                        {g.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            />
            {errors.gender && <Text style={s.error}>{errors.gender.message}</Text>}
          </View>

          {/* ── Section 2: Identity ────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🪪  Identity</Text>

            <Text style={s.label}>Aadhaar Number <Text style={s.req}>*</Text></Text>
            <Controller
              control={control} name="aadhaarNumber"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, errors.aadhaarNumber && s.inputError]}
                  placeholder="12-digit Aadhaar number"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="number-pad" maxLength={12}
                  value={value}
                  onChangeText={t => onChange(t.replace(/\D/g, ''))}
                  secureTextEntry
                />
              )}
            />
            {errors.aadhaarNumber && <Text style={s.error}>{errors.aadhaarNumber.message}</Text>}
            <Text style={s.hint}>🔒 Your Aadhaar is encrypted and never shared.</Text>
          </View>

          {/* ── Section 3: Address ─────────────────────────────────────── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📍  Address</Text>

            <Text style={s.label}>Full Address <Text style={s.req}>*</Text></Text>
            <Controller
              control={control} name="address"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, s.textArea, errors.address && s.inputError]}
                  placeholder="House no., Street, Area"
                  placeholderTextColor={Colors.placeholder}
                  value={value} onChangeText={onChange}
                  multiline numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.address && <Text style={s.error}>{errors.address.message}</Text>}

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>City <Text style={s.req}>*</Text></Text>
                <Controller
                  control={control} name="city"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[s.input, errors.city && s.inputError]}
                      placeholder="City"
                      placeholderTextColor={Colors.placeholder}
                      value={value} onChangeText={onChange}
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.city && <Text style={s.error}>{errors.city.message}</Text>}
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={s.label}>District <Text style={s.req}>*</Text></Text>
                <Controller
                  control={control} name="district"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[s.input, errors.district && s.inputError]}
                      placeholder="District"
                      placeholderTextColor={Colors.placeholder}
                      value={value} onChangeText={onChange}
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.district && <Text style={s.error}>{errors.district.message}</Text>}
              </View>
            </View>
          </View>

          {/* ── Section 4: Photo (optional until upload endpoint exists) ─ */}
          <View style={s.section}>
            <View style={s.sectionTitleRow}>
              <Text style={s.sectionTitle}>📸  Profile Photo</Text>
              <Text style={s.optionalBadge}>Optional</Text>
            </View>
            <Text style={s.hint}>Upload later from your profile once the feature is live.</Text>

            {photoUri ? (
              <View style={s.photoPreviewWrap}>
                <Image source={{ uri: photoUri }} style={s.photoPreview} />
                <TouchableOpacity style={s.changePhotoBtn} onPress={handlePickPhoto}>
                  <Text style={s.changePhotoBtnText}>Change Photo</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={s.photoButtonRow}>
                <TouchableOpacity style={s.photoBtn} onPress={handleTakePhoto}>
                  <Text style={s.photoBtnIcon}>📷</Text>
                  <Text style={s.photoBtnText}>Take Photo</Text>
                </TouchableOpacity>
                <TouchableOpacity style={s.photoBtn} onPress={handlePickPhoto}>
                  <Text style={s.photoBtnIcon}>🖼</Text>
                  <Text style={s.photoBtnText}>Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* ── Submit ─────────────────────────────────────────────────── */}
          <View style={s.submitWrap}>
            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit, onError)}
              disabled={submitting}
              activeOpacity={0.82}
            >
              {submitting
                ? <ActivityIndicator color={Colors.white} />
                : <Text style={s.submitBtnText}>Complete Registration →</Text>
              }
            </TouchableOpacity>
            <Text style={s.submitHint}>By continuing you agree to our Terms of Service.</Text>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe:        { flex: 1, backgroundColor: Colors.gray100 },
  scroll:      { flexGrow: 1, paddingBottom: 48 },

  header:      { flexDirection: 'row', alignItems: 'center', gap: 12,
                 paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl,
                 paddingBottom: Spacing.lg },
  logoBadge:   { width: 44, height: 44, borderRadius: 14,
                 backgroundColor: Colors.gold,
                 alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: FontWeights.extrabold, color: Colors.navy },
  headerSub:   { fontSize: FontSizes.xs, color: Colors.textSecondary, fontWeight: FontWeights.medium },

  section:     { marginHorizontal: Spacing.lg, marginBottom: Spacing.md,
                 backgroundColor: Colors.white, borderRadius: BorderRadius.lg,
                 padding: Spacing.lg, ...Shadows.base },
  sectionTitleRow: { flexDirection: 'row', alignItems: 'center',
                     justifyContent: 'space-between', marginBottom: Spacing.md },
  sectionTitle:{ fontSize: FontSizes.md, fontWeight: FontWeights.bold,
                 color: Colors.navy, marginBottom: Spacing.md },
  optionalBadge: { fontSize: FontSizes.xs, fontWeight: FontWeights.semibold,
                   color: Colors.textSecondary, backgroundColor: Colors.gray200,
                   paddingHorizontal: 8, paddingVertical: 3,
                   borderRadius: BorderRadius.full },

  label:       { fontSize: 12, fontWeight: FontWeights.semibold, color: Colors.gray700,
                 marginBottom: 6, letterSpacing: 0.3, marginTop: Spacing.sm },
  req:         { color: Colors.danger },
  hint:        { fontSize: 11, color: Colors.textTertiary, marginTop: 4, lineHeight: 16 },

  input:       { borderWidth: 1.5, borderColor: Colors.border,
                 borderRadius: BorderRadius.base, paddingHorizontal: 14,
                 paddingVertical: 13, fontSize: FontSizes.base,
                 color: Colors.textPrimary, backgroundColor: Colors.gray100 },
  inputError:  { borderColor: Colors.danger },
  textArea:    { minHeight: 80, paddingTop: 12 },
  error:       { color: Colors.danger, fontSize: 12, marginTop: 4,
                 fontWeight: FontWeights.medium },

  genderRow:   { flexDirection: 'row', gap: 10 },
  genderBtn:   { flex: 1, paddingVertical: 10, borderRadius: BorderRadius.base,
                 borderWidth: 1.5, borderColor: Colors.border,
                 alignItems: 'center', backgroundColor: Colors.gray100 },
  genderBtnActive: { borderColor: Colors.gold, backgroundColor: Colors.goldLight },
  genderText:  { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold,
                 color: Colors.textDisabled },
  genderTextActive: { color: Colors.navy },

  row:         { flexDirection: 'row', marginTop: Spacing.sm },

  photoButtonRow:   { flexDirection: 'row', gap: 12, marginTop: Spacing.sm },
  photoBtn:         { flex: 1, paddingVertical: 20, borderRadius: BorderRadius.md,
                      borderWidth: 1.5, borderColor: Colors.border,
                      borderStyle: 'dashed', alignItems: 'center',
                      backgroundColor: Colors.gray100, gap: 6 },
  photoBtnIcon:     { fontSize: 28 },
  photoBtnText:     { fontSize: 12, fontWeight: FontWeights.semibold,
                      color: Colors.textSecondary, textAlign: 'center' },
  photoPreviewWrap: { alignItems: 'center', gap: 12, marginTop: Spacing.sm },
  photoPreview:     { width: 120, height: 120, borderRadius: BorderRadius.full,
                      borderWidth: 3, borderColor: Colors.gold },
  changePhotoBtn:   { paddingHorizontal: 20, paddingVertical: 8,
                      borderRadius: BorderRadius.full,
                      borderWidth: 1.5, borderColor: Colors.gold },
  changePhotoBtnText: { fontSize: 13, fontWeight: FontWeights.semibold,
                        color: Colors.gold },

  submitWrap:    { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  submitBtn:     { backgroundColor: Colors.gold, borderRadius: BorderRadius.lg,
                   paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: FontSizes.md, fontWeight: FontWeights.bold,
                   color: Colors.white },
  submitHint:    { textAlign: 'center', fontSize: 11, color: Colors.textTertiary,
                   marginTop: Spacing.sm },
});