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
import { FontSizes, Spacing, BorderRadius } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'CitizenOnboarding'>;

const GOLD = '#E8A020';
const NAVY = '#1A2B5E';
const ERROR = '#DC2626';

const GENDERS: { label: string; value: Gender }[] = [
  { label: 'Male', value: 'MALE' },
  { label: 'Female', value: 'FEMALE' },
  { label: 'Other', value: 'OTHER' },
];

// Simple date picker: day/month/year dropdowns replaced with text input
// Format: DD/MM/YYYY → stored as YYYY-MM-DD
function parseDMY(val: string): string {
  const parts = val.split('/');
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  }
  return val;
}

function formatDMY(iso: string): string {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  if (y && m && d) return `${d}/${m}/${y}`;
  return iso;
}

export default function CitizenOnboardingScreen({ navigation }: Props) {
  const { setCitizenUser } = useAuthStore();
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
    // Auto-insert slashes: DD/MM/YYYY
    let clean = text.replace(/\D/g, '');
    if (clean.length > 8) clean = clean.slice(0, 8);
    let formatted = clean;
    if (clean.length > 4) formatted = `${clean.slice(0, 2)}/${clean.slice(2, 4)}/${clean.slice(4)}`;
    else if (clean.length > 2) formatted = `${clean.slice(0, 2)}/${clean.slice(2)}`;
    setDobDisplay(formatted);
    if (clean.length === 8) {
      // Convert to ISO for zod
      const iso = parseDMY(formatted);
      setValue('dateOfBirth', iso, { shouldValidate: true });
    } else {
      setValue('dateOfBirth', '', { shouldValidate: false });
    }
  };

  const handlePickPhoto = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission needed', 'Please allow photo access to upload your profile photo.');
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
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
      Alert.alert('Permission needed', 'Please allow camera access to take your profile photo.');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      const uri = result.assets[0].uri;
      setPhotoUri(uri);
      setValue('profilePhotoUri', uri, { shouldValidate: true });
    }
  };

  const onSubmit = async (data: OnboardingFormData) => {
    setSubmitting(true);
    try {
      const profileRes = await userService.createProfile(data);
      if (!profileRes.success) {
        Alert.alert('Error', profileRes.message || 'Failed to create profile');
        return;
      }
      const photoRes = await userService.uploadPhoto(data.profilePhotoUri);
      if (!photoRes.success) {
        Alert.alert('Error', 'Failed to upload photo. Please try again.');
        return;
      }
      const finalUser = { ...profileRes.data, profilePhotoUrl: photoRes.data.photoUrl };
      setCitizenUser(finalUser);
      resetForm();
      // RootNavigator detects isAuthenticated + role → routes to CitizenNavigator
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const onError = () => {
    // Scroll to top so user sees first error
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F6FB" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView
          ref={scrollRef}
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={s.header}>
            <View style={s.logoBadge}><Text style={{ fontSize: 20 }}>🪷</Text></View>
            <View>
              <Text style={s.headerTitle}>Complete Your Profile</Text>
              <Text style={s.headerSub}>One-time setup · Takes 2 minutes</Text>
            </View>
          </View>

          {/* ── Section 1: Personal ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>👤 Personal Details</Text>

            <Text style={s.label}>Full Name <Text style={s.required}>*</Text></Text>
            <Controller
              control={control}
              name="fullName"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, errors.fullName && s.inputError]}
                  placeholder="As per Aadhaar card"
                  placeholderTextColor="#bbb"
                  value={value}
                  onChangeText={onChange}
                  autoCapitalize="words"
                />
              )}
            />
            {errors.fullName && <Text style={s.error}>{errors.fullName.message}</Text>}

            <Text style={s.label}>Date of Birth <Text style={s.required}>*</Text></Text>
            <TextInput
              style={[s.input, errors.dateOfBirth && s.inputError]}
              placeholder="DD/MM/YYYY"
              placeholderTextColor="#bbb"
              keyboardType="number-pad"
              maxLength={10}
              value={dobDisplay}
              onChangeText={handleDobChange}
            />
            {errors.dateOfBirth && <Text style={s.error}>{errors.dateOfBirth.message}</Text>}

            <Text style={s.label}>Gender <Text style={s.required}>*</Text></Text>
            <Controller
              control={control}
              name="gender"
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

          {/* ── Section 2: Identity ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>🪪 Identity</Text>

            <Text style={s.label}>Aadhaar Number <Text style={s.required}>*</Text></Text>
            <Controller
              control={control}
              name="aadhaarNumber"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, errors.aadhaarNumber && s.inputError]}
                  placeholder="12-digit Aadhaar number"
                  placeholderTextColor="#bbb"
                  keyboardType="number-pad"
                  maxLength={12}
                  value={value}
                  onChangeText={t => onChange(t.replace(/\D/g, ''))}
                  secureTextEntry
                />
              )}
            />
            {errors.aadhaarNumber && <Text style={s.error}>{errors.aadhaarNumber.message}</Text>}
            <Text style={s.hint}>🔒 Your Aadhaar is encrypted and never shared.</Text>
          </View>

          {/* ── Section 3: Address ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📍 Address</Text>

            <Text style={s.label}>Full Address <Text style={s.required}>*</Text></Text>
            <Controller
              control={control}
              name="address"
              render={({ field: { onChange, value } }) => (
                <TextInput
                  style={[s.input, s.textArea, errors.address && s.inputError]}
                  placeholder="House no., Street, Area"
                  placeholderTextColor="#bbb"
                  value={value}
                  onChangeText={onChange}
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              )}
            />
            {errors.address && <Text style={s.error}>{errors.address.message}</Text>}

            <View style={s.row}>
              <View style={{ flex: 1 }}>
                <Text style={s.label}>City <Text style={s.required}>*</Text></Text>
                <Controller
                  control={control}
                  name="city"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[s.input, errors.city && s.inputError]}
                      placeholder="City"
                      placeholderTextColor="#bbb"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.city && <Text style={s.error}>{errors.city.message}</Text>}
              </View>

              <View style={{ width: 12 }} />

              <View style={{ flex: 1 }}>
                <Text style={s.label}>District <Text style={s.required}>*</Text></Text>
                <Controller
                  control={control}
                  name="district"
                  render={({ field: { onChange, value } }) => (
                    <TextInput
                      style={[s.input, errors.district && s.inputError]}
                      placeholder="District"
                      placeholderTextColor="#bbb"
                      value={value}
                      onChangeText={onChange}
                      autoCapitalize="words"
                    />
                  )}
                />
                {errors.district && <Text style={s.error}>{errors.district.message}</Text>}
              </View>
            </View>
          </View>

          {/* ── Section 4: Photo ── */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>📸 Profile Photo</Text>
            <Text style={s.hint}>Required for gate verification. Use a clear face photo.</Text>

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
                  <Text style={s.photoBtnText}>Choose from Gallery</Text>
                </TouchableOpacity>
              </View>
            )}
            {errors.profilePhotoUri && <Text style={s.error}>{errors.profilePhotoUri.message}</Text>}
          </View>

          {/* Submit */}
          <View style={s.submitWrap}>
            <TouchableOpacity
              style={[s.submitBtn, submitting && s.submitBtnDisabled]}
              onPress={handleSubmit(onSubmit, onError)}
              disabled={submitting}
            >
              {submitting
                ? <ActivityIndicator color="#fff" />
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
  safe: { flex: 1, backgroundColor: '#F4F6FB' },
  scroll: { flexGrow: 1, paddingBottom: 48 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl, paddingBottom: Spacing.lg },
  logoBadge: { width: 44, height: 44, borderRadius: 14, backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '800', color: NAVY },
  headerSub: { fontSize: FontSizes.xs, color: '#888', fontWeight: '500' },

  section: { marginHorizontal: Spacing.lg, marginBottom: Spacing.md, backgroundColor: '#fff', borderRadius: 16, padding: Spacing.lg, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 2 },
  sectionTitle: { fontSize: FontSizes.md, fontWeight: '700', color: NAVY, marginBottom: Spacing.md },

  label: { fontSize: 12, fontWeight: '600', color: '#555', marginBottom: 6, letterSpacing: 0.3, marginTop: Spacing.sm },
  required: { color: ERROR },
  hint: { fontSize: 11, color: '#999', marginTop: 4, lineHeight: 16 },

  input: { borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 10, paddingHorizontal: 14, paddingVertical: 13, fontSize: 15, color: NAVY, backgroundColor: '#FAFAFA' },
  inputError: { borderColor: ERROR },
  textArea: { minHeight: 80, paddingTop: 12 },

  error: { color: ERROR, fontSize: 12, marginTop: 4, fontWeight: '500' },

  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, borderWidth: 1.5, borderColor: '#E5E7EB', alignItems: 'center', backgroundColor: '#FAFAFA' },
  genderBtnActive: { borderColor: GOLD, backgroundColor: '#FFF8EC' },
  genderText: { fontSize: 14, fontWeight: '600', color: '#999' },
  genderTextActive: { color: NAVY },

  row: { flexDirection: 'row', marginTop: Spacing.sm },

  photoButtonRow: { flexDirection: 'row', gap: 12, marginTop: Spacing.sm },
  photoBtn: { flex: 1, paddingVertical: 20, borderRadius: 12, borderWidth: 1.5, borderColor: '#E5E7EB', borderStyle: 'dashed', alignItems: 'center', backgroundColor: '#FAFAFA', gap: 6 },
  photoBtnIcon: { fontSize: 28 },
  photoBtnText: { fontSize: 12, fontWeight: '600', color: '#666', textAlign: 'center' },

  photoPreviewWrap: { alignItems: 'center', gap: 12, marginTop: Spacing.sm },
  photoPreview: { width: 120, height: 120, borderRadius: 60, borderWidth: 3, borderColor: GOLD },
  changePhotoBtn: { paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20, borderWidth: 1.5, borderColor: GOLD },
  changePhotoBtnText: { fontSize: 13, fontWeight: '600', color: GOLD },

  submitWrap: { paddingHorizontal: Spacing.lg, marginTop: Spacing.sm },
  submitBtn: { backgroundColor: GOLD, borderRadius: 14, paddingVertical: 16, alignItems: 'center' },
  submitBtnDisabled: { opacity: 0.6 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
  submitHint: { textAlign: 'center', fontSize: 11, color: '#bbb', marginTop: Spacing.sm },
});