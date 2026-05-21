import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, Image, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform, Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as SecureStore from 'expo-secure-store';
import { AuthStackParamList } from '../../navigation/types';
import { useAuthStore } from '../../store/authStore';
import authService from '../../services/authService';
import { Colors, FontSizes, Spacing, BorderRadius } from '../../constants/theme';

type Props = NativeStackScreenProps<AuthStackParamList, 'Login'>;

type MainTab = 'login' | 'register';
type LoginMethod = 'otp' | 'guard';
type OtpStep = 'phone' | 'verify';

const GOLD = '#E8A020';
const NAVY = '#1A2B5E';
const CREAM = '#FAF8F3';
const AUTH_TOKEN_KEY = 'auth_token';

export default function LoginScreen({ navigation }: Props) {
  const [mainTab, setMainTab] = useState<MainTab>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('otp');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');

  // Citizen OTP fields
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [resendTimer, setResendTimer] = useState(0);

  // Guard fields
  const [guardUsername, setGuardUsername] = useState('');
  const [guardPassword, setGuardPassword] = useState('');
  const [guardPasswordVisible, setGuardPasswordVisible] = useState(false);

  // Register fields (new visitor)
  const [regName, setRegName] = useState('');
  const [regPhone, setRegPhone] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setCitizenUser, setGuardUser, setToken } = useAuthStore();

  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer(prev => {
        if (prev <= 1) { clearInterval(timerRef.current!); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const clearError = () => setError('');

  // ── Citizen: Send OTP ──────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    clearError();
    setLoading(true);
    try {
      const res = await authService.requestOTP(phone);
      if (res.success) {
        setOtpStep('verify');
        startResendTimer();
      } else {
        setError(res.message || 'Failed to send OTP');
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (resendTimer > 0) return;
    clearError();
    setLoading(true);
    try {
      await authService.requestOTP(phone);
      startResendTimer();
    } catch {
      setError('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  // ── Citizen: Verify OTP ───────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) { setError('Enter the 6-digit OTP'); return; }
    clearError();
    setLoading(true);
    try {
      const res = await authService.verifyOTP(phone, otp);
      if (res.success) {
        setToken(res.data.token,'citizen');
        if (res.data.isNewUser || !res.data.user) {
          navigation.replace('CitizenOnboarding');
        } else {
          setCitizenUser(res.data.user);
          // RootNavigator handles the rest
        }
      } else {
        setError(res.message || 'Invalid OTP');
      }
    } catch {
      setError('Verification failed. Try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Guard: Login ──────────────────────────────────────────────────────────
  const handleGuardLogin = async () => {
    if (!guardUsername.trim()) { setError('Enter your username'); return; }
    if (!guardPassword.trim()) { setError('Enter your password'); return; }
    clearError();
    setLoading(true);
    try {
      const res = await authService.guardLogin(guardUsername.trim(), guardPassword);
      if (res.success) {
        setToken(res.data.token,'guard');
        setGuardUser(res.data.guard);
        // RootNavigator routes to GuardNavigator
      } else {
        setError(res.message || 'Invalid credentials');
      }
    } catch {
      setError('Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // ── Register: New Visitor ─────────────────────────────────────────────────
  const handleRegister = () => {
    if (!regName.trim()) { setError('Enter your full name'); return; }
    if (regPhone.length !== 10) { setError('Enter a valid 10-digit mobile number'); return; }
    clearError();
    // Send them to OTP screen with phone pre-filled, then onboarding
    setPhone(regPhone);
    setMainTab('login');
    setLoginMethod('otp');
    setOtpStep('phone');
    Alert.alert('Registered!', 'Please verify your phone number with OTP to continue.');
  };

  // ── Tab switch resets ─────────────────────────────────────────────────────
  const switchMainTab = (tab: MainTab) => {
    setMainTab(tab);
    setError('');
    setOtpStep('phone');
    setOtp('');
  };

  const switchLoginMethod = (method: LoginMethod) => {
    setLoginMethod(method);
    setError('');
    setOtpStep('phone');
    setOtp('');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor="#fff" />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={styles.header}>
            <View style={styles.headerLogo}>
              <View style={styles.logoBadge}><Text style={{ fontSize: 18 }}>🪷</Text></View>
              <Text style={styles.headerTitle}>Access Portal</Text>
            </View>
            <Text style={styles.headerLocation}>📍</Text>
          </View>

          {/* ── Hero image ── */}
          <View style={styles.heroContainer}>
            <Image
              source={{ uri: 'https://via.placeholder.com/700x300/90a5b8/ffffff?text=Bungalow' }}
              style={styles.heroImage}
            />
            <View style={styles.locationBadge}>
              <Text style={styles.locationIcon}>🏛</Text>
              <View>
                <Text style={styles.locationLabel}>LOCATION</Text>
                <Text style={styles.locationName}>Virar Bungalow, Mumbai</Text>
              </View>
            </View>
          </View>

          {/* ── Login / Register main tabs ── */}
          <View style={styles.mainTabContainer}>
            <TouchableOpacity
              style={[styles.mainTab, mainTab === 'login' && styles.mainTabActive]}
              onPress={() => switchMainTab('login')}
            >
              <Text style={[styles.mainTabText, mainTab === 'login' && styles.mainTabTextActive]}>
                Login
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.mainTab, mainTab === 'register' && styles.mainTabActive]}
              onPress={() => switchMainTab('register')}
            >
              <Text style={[styles.mainTabText, mainTab === 'register' && styles.mainTabTextActive]}>
                Register
              </Text>
            </TouchableOpacity>
          </View>

          {/* ── CONTENT ── */}
          {mainTab === 'login' ? (
            <View style={styles.formSection}>
              {/* Login method sub-tabs */}
              <View style={styles.methodTabRow}>
                <TouchableOpacity
                  style={[styles.methodTab, loginMethod === 'otp' && styles.methodTabActive]}
                  onPress={() => switchLoginMethod('otp')}
                >
                  <Text style={[styles.methodTabText, loginMethod === 'otp' && styles.methodTabTextActive]}>
                    📱 Visitor OTP
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.methodTab, loginMethod === 'guard' && styles.methodTabActive]}
                  onPress={() => switchLoginMethod('guard')}
                >
                  <Text style={[styles.methodTabText, loginMethod === 'guard' && styles.methodTabTextActive]}>
                    🔒 Guard ID
                  </Text>
                </TouchableOpacity>
              </View>

              {/* ── OTP login ── */}
              {loginMethod === 'otp' && (
                <>
                  {otpStep === 'phone' ? (
                    <>
                      <Text style={styles.formTitle}>Welcome Back</Text>
                      <Text style={styles.formSubtitle}>
                        Enter your phone number to receive a secure OTP.
                      </Text>

                      {/* Phone input */}
                      <View style={styles.phoneInputRow}>
                        <View style={styles.phonePrefix}>
                          <Text style={styles.phonePrefixText}>📞 +91</Text>
                        </View>
                        <TextInput
                          style={styles.phoneInput}
                          placeholder="00000 00000"
                          placeholderTextColor="#bbb"
                          keyboardType="phone-pad"
                          maxLength={10}
                          value={phone}
                          onChangeText={t => { setPhone(t.replace(/\D/g, '')); clearError(); }}
                        />
                      </View>

                      {/* Security note */}
                      <View style={styles.secureNote}>
                        <View style={styles.secureNoteIcon}>
                          <Text>🛡</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.secureNoteTitle}>Secure Login</Text>
                          <Text style={styles.secureNoteBody}>
                            Verification is handled via encrypted mobile OTP systems for your security.
                          </Text>
                        </View>
                      </View>

                      {error ? <Text style={styles.errorText}>{error}</Text> : null}

                      <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleSendOtp}
                        disabled={loading}
                      >
                        {loading
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={styles.primaryBtnText}>Send OTP →</Text>
                        }
                      </TouchableOpacity>
                    </>
                  ) : (
                    <>
                      <Text style={styles.formTitle}>Verify OTP</Text>
                      <Text style={styles.formSubtitle}>
                        OTP sent to +91 {phone}
                        {'  '}
                        <Text style={styles.changeLink} onPress={() => { setOtpStep('phone'); setOtp(''); clearError(); }}>
                          Change
                        </Text>
                      </Text>

                      <TextInput
                        style={styles.otpInput}
                        placeholder="• • • • • •"
                        placeholderTextColor="#bbb"
                        keyboardType="number-pad"
                        maxLength={6}
                        value={otp}
                        onChangeText={t => { setOtp(t.replace(/\D/g, '')); clearError(); }}
                        textAlign="center"
                      />

                      <TouchableOpacity
                        onPress={handleResendOtp}
                        disabled={resendTimer > 0 || loading}
                        style={styles.resendRow}
                      >
                        <Text style={[styles.resendText, resendTimer > 0 && styles.resendDisabled]}>
                          {resendTimer > 0 ? `Resend OTP in ${resendTimer}s` : 'Resend OTP'}
                        </Text>
                      </TouchableOpacity>

                      {error ? <Text style={styles.errorText}>{error}</Text> : null}

                      <TouchableOpacity
                        style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                        onPress={handleVerifyOtp}
                        disabled={loading}
                      >
                        {loading
                          ? <ActivityIndicator color="#fff" />
                          : <Text style={styles.primaryBtnText}>Verify & Continue →</Text>
                        }
                      </TouchableOpacity>
                    </>
                  )}
                </>
              )}

              {/* ── Guard ID/Password login ── */}
              {loginMethod === 'guard' && (
                <>
                  <Text style={styles.formTitle}>Guard Login</Text>
                  <Text style={styles.formSubtitle}>
                    Enter your assigned ID and password to access the guard panel.
                  </Text>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Username / ID</Text>
                    <TextInput
                      style={styles.textInput}
                      placeholder="guard01"
                      placeholderTextColor="#bbb"
                      autoCapitalize="none"
                      value={guardUsername}
                      onChangeText={t => { setGuardUsername(t); clearError(); }}
                    />
                  </View>

                  <View style={styles.inputWrapper}>
                    <Text style={styles.inputLabel}>Password</Text>
                    <View style={styles.passwordRow}>
                      <TextInput
                        style={[styles.textInput, { flex: 1, borderWidth: 0 }]}
                        placeholder="••••••••"
                        placeholderTextColor="#bbb"
                        secureTextEntry={!guardPasswordVisible}
                        value={guardPassword}
                        onChangeText={t => { setGuardPassword(t); clearError(); }}
                      />
                      <TouchableOpacity
                        onPress={() => setGuardPasswordVisible(v => !v)}
                        style={styles.eyeBtn}
                      >
                        <Text>{guardPasswordVisible ? '🙈' : '👁'}</Text>
                      </TouchableOpacity>
                    </View>
                  </View>

                  {error ? <Text style={styles.errorText}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[styles.primaryBtn, loading && styles.primaryBtnDisabled]}
                    onPress={handleGuardLogin}
                    disabled={loading}
                  >
                    {loading
                      ? <ActivityIndicator color="#fff" />
                      : <Text style={styles.primaryBtnText}>Login as Guard →</Text>
                    }
                  </TouchableOpacity>
                </>
              )}
            </View>
          ) : (
            /* ── Register tab ── */
            <View style={styles.formSection}>
              <Text style={styles.formTitle}>New Visitor</Text>
              <Text style={styles.formSubtitle}>
                Create your account to book a Darshan appointment.
              </Text>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Full Name</Text>
                <TextInput
                  style={styles.textInput}
                  placeholder="As per Aadhaar"
                  placeholderTextColor="#bbb"
                  value={regName}
                  onChangeText={t => { setRegName(t); clearError(); }}
                />
              </View>

              <View style={styles.inputWrapper}>
                <Text style={styles.inputLabel}>Mobile Number</Text>
                <View style={styles.phoneInputRow}>
                  <View style={styles.phonePrefix}>
                    <Text style={styles.phonePrefixText}>📞 +91</Text>
                  </View>
                  <TextInput
                    style={[styles.phoneInput, { flex: 1 }]}
                    placeholder="00000 00000"
                    placeholderTextColor="#bbb"
                    keyboardType="phone-pad"
                    maxLength={10}
                    value={regPhone}
                    onChangeText={t => { setRegPhone(t.replace(/\D/g, '')); clearError(); }}
                  />
                </View>
              </View>

              <View style={styles.secureNote}>
                <View style={styles.secureNoteIcon}><Text>📋</Text></View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.secureNoteTitle}>What happens next?</Text>
                  <Text style={styles.secureNoteBody}>
                    You'll verify your phone via OTP, then complete your profile with Aadhaar details.
                  </Text>
                </View>
              </View>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <TouchableOpacity
                style={styles.primaryBtn}
                onPress={handleRegister}
              >
                <Text style={styles.primaryBtnText}>Register & Verify →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerEmoji}>🪷</Text>
            <Text style={styles.footerText}>PUBLIC SERVICE APP</Text>
            <View style={styles.footerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  scroll: { flexGrow: 1, paddingBottom: 40 },

  // Header
  header: {
    flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.sm,
  },
  headerLogo: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoBadge: {
    width: 36, height: 36, borderRadius: 10,
    backgroundColor: GOLD, alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: FontSizes.lg, fontWeight: '700', color: NAVY },
  headerLocation: { fontSize: 22 },

  // Hero
  heroContainer: { marginHorizontal: Spacing.lg, borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.lg },
  heroImage: { width: '100%', height: 160 },
  locationBadge: {
    position: 'absolute', bottom: 12, left: 12,
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
  },
  locationIcon: { fontSize: 20 },
  locationLabel: { fontSize: 9, color: '#888', letterSpacing: 1, fontWeight: '600' },
  locationName: { fontSize: 13, fontWeight: '700', color: NAVY },

  // Main tabs (Login / Register)
  mainTabContainer: {
    flexDirection: 'row', marginHorizontal: Spacing.lg,
    backgroundColor: '#F0F2F8', borderRadius: 30,
    padding: 4, marginBottom: Spacing.lg,
  },
  mainTab: { flex: 1, paddingVertical: 10, borderRadius: 26, alignItems: 'center' },
  mainTabActive: { backgroundColor: '#fff' },
  mainTabText: { fontSize: FontSizes.sm, fontWeight: '600', color: '#999' },
  mainTabTextActive: { color: NAVY },

  // Form
  formSection: { paddingHorizontal: Spacing.lg },
  formTitle: { fontSize: 24, fontWeight: '800', color: NAVY, marginBottom: 6 },
  formSubtitle: { fontSize: FontSizes.sm, color: '#666', lineHeight: 20, marginBottom: Spacing.lg },

  // Method sub-tabs (OTP / Guard)
  methodTabRow: {
    flexDirection: 'row', gap: 10, marginBottom: Spacing.lg,
  },
  methodTab: {
    flex: 1, paddingVertical: 8, borderRadius: 8,
    borderWidth: 1.5, borderColor: '#E5E7EB',
    alignItems: 'center', backgroundColor: '#fff',
  },
  methodTabActive: { borderColor: GOLD, backgroundColor: '#FFF8EC' },
  methodTabText: { fontSize: 13, fontWeight: '600', color: '#999' },
  methodTabTextActive: { color: NAVY },

  // Phone input
  phoneInputRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB',
    borderRadius: 14, overflow: 'hidden', marginBottom: Spacing.md,
    backgroundColor: '#fff',
  },
  phonePrefix: {
    paddingHorizontal: 14, paddingVertical: 14,
    borderRightWidth: 1, borderRightColor: '#E5E7EB',
    backgroundColor: '#F8F9FB',
  },
  phonePrefixText: { fontSize: 14, fontWeight: '600', color: NAVY },
  phoneInput: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 16, color: NAVY,
  },

  // OTP input
  otpInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 14,
    paddingVertical: 16, fontSize: 28, color: NAVY,
    letterSpacing: 12, marginBottom: Spacing.sm,
    backgroundColor: '#F8F9FB',
  },
  resendRow: { alignSelf: 'center', marginBottom: Spacing.lg },
  resendText: { fontSize: FontSizes.sm, color: GOLD, fontWeight: '600' },
  resendDisabled: { color: '#bbb' },
  changeLink: { color: GOLD, fontWeight: '600' },

  // Secure note
  secureNote: {
    flexDirection: 'row', gap: 12, alignItems: 'flex-start',
    backgroundColor: '#F0F4FF', borderRadius: 12,
    padding: Spacing.md, marginBottom: Spacing.lg,
  },
  secureNoteIcon: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: '#fff', alignItems: 'center', justifyContent: 'center',
  },
  secureNoteTitle: { fontSize: 13, fontWeight: '700', color: NAVY, marginBottom: 2 },
  secureNoteBody: { fontSize: 12, color: '#666', lineHeight: 17 },

  // Generic input
  inputWrapper: { marginBottom: Spacing.md },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#888', marginBottom: 6, letterSpacing: 0.5 },
  textInput: {
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    paddingHorizontal: 14, paddingVertical: 14,
    fontSize: 15, color: NAVY, backgroundColor: '#fff',
  },
  passwordRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1.5, borderColor: '#E5E7EB', borderRadius: 12,
    backgroundColor: '#fff', paddingRight: 8,
  },
  eyeBtn: { padding: 8 },

  // Primary button
  primaryBtn: {
    backgroundColor: GOLD, borderRadius: 14,
    paddingVertical: 16, alignItems: 'center',
    marginTop: Spacing.sm,
  },
  primaryBtnDisabled: { opacity: 0.6 },
  primaryBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },

  // Error
  errorText: { color: '#DC2626', fontSize: 13, marginBottom: Spacing.sm, fontWeight: '500' },

  // Footer
  footer: { alignItems: 'center', marginTop: Spacing.xl, gap: 4 },
  footerEmoji: { fontSize: 18 },
  footerText: { fontSize: 10, letterSpacing: 2, color: '#bbb', fontWeight: '600' },
  footerLine: { width: 40, height: 3, backgroundColor: GOLD, borderRadius: 2, marginTop: 4 },
});