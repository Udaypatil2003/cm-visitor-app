import React, { useState, useRef, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  StatusBar,
  TouchableOpacity,
  TextInput,
  Image,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import authService from "../../services/authService";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
} from "../../constants/theme";
import { CitizenUser } from "../../types/user.types";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;
type MainTab = "login" | "register";
type OtpStep = "phone" | "verify";

export default function LoginScreen({ navigation }: Props) {
  const [mainTab, setMainTab] = useState<MainTab>("login");
  const [otpStep, setOtpStep] = useState<OtpStep>("phone");
  const [showGuard, setShowGuard] = useState(false);

  // Citizen
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [resendTimer, setResendTimer] = useState(0);

  // Guard
  const [guardUsername, setGuardUsername] = useState("");
  const [guardPassword, setGuardPassword] = useState("");
  const [guardPasswordVisible, setGuardPasswordVisible] = useState(false);

  // Register
  const [regPhone, setRegPhone] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { setCitizenUser, setGuardUser, setToken } = useAuthStore();

  useEffect(
    () => () => {
      if (timerRef.current) clearInterval(timerRef.current);
    },
    [],
  );

  const startResendTimer = () => {
    setResendTimer(30);
    timerRef.current = setInterval(() => {
      setResendTimer((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const clearError = () => setError("");

  const switchTab = (tab: MainTab) => {
    setMainTab(tab);
    setError("");
    setOtpStep("phone");
    setOtp("");
    setShowGuard(false);
  };

  // ── Citizen OTP ──────────────────────────────────────────────────────────
  const handleSendOtp = async () => {
    if (phone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    clearError();
    setLoading(true);
    try {
      const res = await authService.requestOTP(phone);
      if (res.success) {
        setOtpStep("verify");
        startResendTimer();
      } else setError(res.message || "Failed to send OTP");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) {
      setError("Enter the 6-digit OTP");
      return;
    }
    clearError();
    setLoading(true);
    try {
      const res = await authService.verifyOTP(phone, otp);
      if (res.success) {
        setToken(res.data.token, "citizen");
        if (res.data.isNewUser || !res.data.user)
          navigation.replace("CitizenOnboarding");
        else setCitizenUser(res.data.user);
      } else setError(res.message || "Invalid OTP");
    } catch {
      setError("Verification failed. Try again.");
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
      setError("Failed to resend OTP");
    } finally {
      setLoading(false);
    }
  };

  // ── Guard ────────────────────────────────────────────────────────────────
  const handleGuardLogin = async () => {
    if (!guardUsername.trim()) {
      setError("Enter your username");
      return;
    }
    if (!guardPassword.trim()) {
      setError("Enter your password");
      return;
    }
    clearError();
    setLoading(true);
    try {
      const res = await authService.guardLogin(
        guardUsername.trim(),
        guardPassword,
      );
      if (res.success) {
        setToken(res.data.token, "guard");
        setGuardUser(res.data.guard);
      } else setError(res.message || "Invalid credentials");
    } catch {
      setError("Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Register: route to OTP → onboarding ────────────────────────────────
  const handleRegisterContinue = async () => {
    if (regPhone.length !== 10) {
      setError("Enter a valid 10-digit mobile number");
      return;
    }
    clearError();
    setLoading(true);
    try {
      const res = await authService.requestOTP(regPhone);
      if (res.success) {
        setPhone(regPhone);
        setMainTab("login");
        setOtpStep("verify");
        startResendTimer();
      } else setError(res.message || "Failed to send OTP");
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDevBypass = async () => {
    await useAuthStore.getState().setToken("dev-mock-token", "citizen");
    useAuthStore.getState().setCitizenUser(MOCK_CITIZEN);
  };

  const MOCK_CITIZEN: CitizenUser = {
    id: "dev-001",
    phone: "9999999999",
    fullName: "Raj Sharma",
    aadhaarNumber: "123456789012",
    dateOfBirth: "1990-05-15",
    gender: "MALE",
    address: "12, Green Park Colony, Near Railway Station",
    city: "Virar",
    district: "Palghar",
    profilePhotoUrl: "https://i.pravatar.cc/150?img=8",
    fcmToken: null,
    createdAt: new Date().toISOString(),
  };

  return (
    <SafeAreaView style={s.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={Colors.white} />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <ScrollView
          contentContainerStyle={s.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* ── Header ── */}
          <View style={s.header}>
            <View style={s.headerLeft}>
              <View style={s.logoBadge}>
                <Text style={s.logoEmoji}>🪷</Text>
              </View>
              <Text style={s.headerTitle}>Access Portal</Text>
            </View>
            <Text style={s.headerPin}>📍</Text>
          </View>

          {/* ── Hero Image ── */}
          <View style={s.heroWrap}>
            <Image
              source={{
                uri: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80",
              }}
              style={s.heroImage}
            />
            {/* Gradient overlay effect */}
            <View style={s.heroOverlay} />
            <View style={s.locationBadge}>
              <View style={s.locationIcon}>
                <Text>🏛</Text>
              </View>
              <View>
                <Text style={s.locationLabel}>LOCATION</Text>
                <Text style={s.locationName}>Virar Bungalow, Mumbai</Text>
              </View>
            </View>
          </View>

          {/* ── Main Tabs: Login / Register ── */}
          <View style={s.mainTabWrap}>
            <View style={s.mainTabPill}>
              <TouchableOpacity
                style={[s.mainTab, mainTab === "login" && s.mainTabActive]}
                onPress={() => switchTab("login")}
              >
                <Text
                  style={[
                    s.mainTabText,
                    mainTab === "login" && s.mainTabTextActive,
                  ]}
                >
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.mainTab, mainTab === "register" && s.mainTabActive]}
                onPress={() => switchTab("register")}
              >
                <Text
                  style={[
                    s.mainTabText,
                    mainTab === "register" && s.mainTabTextActive,
                  ]}
                >
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── LOGIN CONTENT ── */}
          {mainTab === "login" && !showGuard && (
            <View style={s.form}>
              {otpStep === "phone" ? (
                <>
                  <Text style={s.formTitle}>Welcome Back</Text>
                  <Text style={s.formSub}>
                    Enter your phone number to receive a secure OTP.
                  </Text>

                  {/* Phone input */}
                  <View style={s.phoneWrap}>
                    <Text style={s.phonePrefix}>📞 +91</Text>
                    <View style={s.phoneDivider} />
                    <TextInput
                      style={s.phoneInput}
                      placeholder="00000 00000"
                      placeholderTextColor={Colors.placeholder}
                      keyboardType="phone-pad"
                      maxLength={10}
                      value={phone}
                      onChangeText={(t) => {
                        setPhone(t.replace(/\D/g, ""));
                        clearError();
                      }}
                    />
                  </View>

                  {/* Secure note */}
                  <View style={s.noteCard}>
                    <View style={s.noteIconWrap}>
                      <Text>🛡</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={s.noteTitle}>Secure Login</Text>
                      <Text style={s.noteBody}>
                        Verification is handled via encrypted mobile OTP systems
                        for your security.
                      </Text>
                    </View>
                  </View>

                  {error ? <Text style={s.error}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[s.cta, loading && s.ctaDisabled]}
                    onPress={handleSendOtp}
                    disabled={loading}
                    activeOpacity={0.82}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={s.ctaText}>Send OTP →</Text>
                    )}
                  </TouchableOpacity>

                  {/* Guard login link */}
                  <TouchableOpacity
                    style={s.guardLink}
                    onPress={() => {
                      setShowGuard(true);
                      clearError();
                    }}
                  >
                    <Text style={s.guardLinkText}>🔒 Guard Login</Text>
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={s.formTitle}>Verify OTP</Text>
                  <Text style={s.formSub}>
                    OTP sent to +91 {phone}
                    {"  "}
                    <Text
                      style={s.link}
                      onPress={() => {
                        setOtpStep("phone");
                        setOtp("");
                        clearError();
                      }}
                    >
                      Change
                    </Text>
                  </Text>

                  <TextInput
                    style={s.otpInput}
                    placeholder="• • • • • •"
                    placeholderTextColor={Colors.placeholder}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={otp}
                    onChangeText={(t) => {
                      setOtp(t.replace(/\D/g, ""));
                      clearError();
                    }}
                    textAlign="center"
                  />

                  <TouchableOpacity
                    onPress={handleResendOtp}
                    disabled={resendTimer > 0 || loading}
                    style={s.resendRow}
                  >
                    <Text
                      style={[
                        s.resendText,
                        resendTimer > 0 && s.resendDisabled,
                      ]}
                    >
                      {resendTimer > 0
                        ? `Resend OTP in ${resendTimer}s`
                        : "Resend OTP"}
                    </Text>
                  </TouchableOpacity>

                  {error ? <Text style={s.error}>{error}</Text> : null}

                  <TouchableOpacity
                    style={[s.cta, loading && s.ctaDisabled]}
                    onPress={handleVerifyOtp}
                    disabled={loading}
                    activeOpacity={0.82}
                  >
                    {loading ? (
                      <ActivityIndicator color={Colors.white} />
                    ) : (
                      <Text style={s.ctaText}>Verify & Continue →</Text>
                    )}
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}

          {/* ── GUARD LOGIN ── */}
          {mainTab === "login" && showGuard && (
            <View style={s.form}>
              <TouchableOpacity
                onPress={() => {
                  setShowGuard(false);
                  clearError();
                }}
                style={s.backRow}
              >
                <Text style={s.backText}>← Back</Text>
              </TouchableOpacity>

              <Text style={s.formTitle}>Guard Login</Text>
              <Text style={s.formSub}>
                Enter your assigned ID and password.
              </Text>

              <Text style={s.label}>Username / ID</Text>
              <TextInput
                style={s.input}
                placeholder="guard01"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="none"
                value={guardUsername}
                onChangeText={(t) => {
                  setGuardUsername(t);
                  clearError();
                }}
              />

              <Text style={s.label}>Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, { flex: 1, borderWidth: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!guardPasswordVisible}
                  value={guardPassword}
                  onChangeText={(t) => {
                    setGuardPassword(t);
                    clearError();
                  }}
                />
                <TouchableOpacity
                  onPress={() => setGuardPasswordVisible((v) => !v)}
                  style={s.eyeBtn}
                >
                  <Text>{guardPasswordVisible ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.cta, loading && s.ctaDisabled]}
                onPress={handleGuardLogin}
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={s.ctaText}>Login as Guard →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {/* ── REGISTER CONTENT ── */}
          {mainTab === "register" && (
            <View style={s.form}>
              <Text style={s.formTitle}>New Visitor</Text>
              <Text style={s.formSub}>
                Register with your mobile number. You'll verify via OTP, then
                complete your profile.
              </Text>

              <View style={s.phoneWrap}>
                <Text style={s.phonePrefix}>📞 +91</Text>
                <View style={s.phoneDivider} />
                <TextInput
                  style={s.phoneInput}
                  placeholder="00000 00000"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={regPhone}
                  onChangeText={(t) => {
                    setRegPhone(t.replace(/\D/g, ""));
                    clearError();
                  }}
                />
              </View>

              <View style={s.noteCard}>
                <View style={s.noteIconWrap}>
                  <Text>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.noteTitle}>What happens next?</Text>
                  <Text style={s.noteBody}>
                    Verify your number via OTP, then complete your
                    Aadhaar-linked profile for gate access.
                  </Text>
                </View>
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.cta, loading && s.ctaDisabled]}
                onPress={handleRegisterContinue}
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={s.ctaText}>Register & Verify →</Text>
                )}
              </TouchableOpacity>
            </View>
          )}

          {__DEV__ && (
            <View style={s.devBar}>
              <Text style={s.devLabel}>⚡ DEV SHORTCUTS</Text>
              <View style={s.devRow}>
                <TouchableOpacity style={s.devBtn} onPress={handleDevBypass}>
                  <Text style={s.devBtnText}>→ Citizen Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.devBtn}
                  onPress={async () => {
                    await useAuthStore
                      .getState()
                      .setToken("dev-guard-token", "guard");
                    useAuthStore.getState().setGuardUser({
                      id: "guard-dev-001",
                      username: "guard01",
                      fullName: "Suresh Patil",
                      createdAt: new Date().toISOString(),
                    });
                  }}
                >
                  <Text style={s.devBtnText}>→ Guard Home</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={s.devBtn}
                  onPress={() => navigation.replace("CitizenOnboarding")}
                >
                  <Text style={s.devBtnText}>→ Onboarding</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}

          {/* ── Footer ── */}
          <View style={s.footer}>
            <Text style={s.footerEmoji}>🪷</Text>
            <Text style={s.footerText}>PUBLIC SERVICE APP</Text>
            <View style={s.footerLine} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.white },
  scroll: { flexGrow: 1, paddingBottom: 48 },

  // Header — matches PDF exactly
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  logoBadge: {
    width: 38,
    height: 38,
    borderRadius: 10,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
  },
  logoEmoji: { fontSize: 18 },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  headerPin: { fontSize: 22 },

  // Hero
  heroWrap: {
    marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    height: 180,
  },
  heroImage: { width: "100%", height: "100%", resizeMode: "cover" },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0,0,0,0.15)",
  },
  locationBadge: {
    position: "absolute",
    bottom: 14,
    left: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: "rgba(255,255,255,0.93)",
    borderRadius: BorderRadius.md,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  locationIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: Colors.goldLight,
    alignItems: "center",
    justifyContent: "center",
  },
  locationLabel: {
    fontSize: 9,
    color: Colors.textSecondary,
    letterSpacing: 1.2,
    fontWeight: FontWeights.semibold,
  },
  locationName: {
    fontSize: 13,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },

  // Main tabs pill — exact match to PDF
  mainTabWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  mainTabPill: {
    flexDirection: "row",
    backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full,
    padding: 4,
  },
  mainTab: {
    flex: 1,
    paddingVertical: 11,
    borderRadius: BorderRadius.full,
    alignItems: "center",
  },
  mainTabActive: {
    backgroundColor: Colors.white,
    ...Shadows.sm,
  },
  mainTabText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
  mainTabTextActive: { color: Colors.navy },

  // Form
  form: { paddingHorizontal: Spacing.lg },
  formTitle: {
    fontSize: FontSizes["3xl"],
    fontWeight: FontWeights.extrabold,
    color: Colors.navy,
    marginBottom: 6,
  },
  formSub: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    lineHeight: 20,
    marginBottom: Spacing.lg,
  },

  // Phone input — matches PDF (single bordered row, prefix + divider + input)
  phoneWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing.md,
    height: 56,
    backgroundColor: Colors.white,
    marginBottom: Spacing.md,
  },
  phonePrefix: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.navy,
    marginRight: 8,
  },
  phoneDivider: {
    width: 1,
    height: 22,
    backgroundColor: Colors.border,
    marginRight: 8,
  },
  phoneInput: {
    flex: 1,
    fontSize: FontSizes.base,
    color: Colors.navy,
    paddingVertical: 0,
  },

  // OTP input
  otpInput: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.lg,
    height: 64,
    fontSize: 28,
    color: Colors.navy,
    letterSpacing: 14,
    marginBottom: Spacing.sm,
    backgroundColor: Colors.gray100,
  },
  resendRow: { alignSelf: "center", marginBottom: Spacing.lg },
  resendText: {
    fontSize: FontSizes.sm,
    color: Colors.gold,
    fontWeight: FontWeights.semibold,
  },
  resendDisabled: { color: Colors.textDisabled },
  link: { color: Colors.gold, fontWeight: FontWeights.semibold },

  // Note card — blue-tinted, matches PDF
  noteCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    backgroundColor: "#EFF4FF",
    borderRadius: BorderRadius.lg,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  noteIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.white,
    alignItems: "center",
    justifyContent: "center",
  },
  noteTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginBottom: 2,
  },
  noteBody: { fontSize: 12, color: Colors.textSecondary, lineHeight: 17 },

  // CTA button — full width, fully rounded, gold
  cta: {
    height: 56,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.sm,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },

  // Guard link
  guardLink: {
    alignSelf: "center",
    marginTop: Spacing.lg,
    padding: Spacing.sm,
  },
  guardLinkText: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },

  // Back
  backRow: { marginBottom: Spacing.md },
  backText: {
    fontSize: FontSizes.sm,
    color: Colors.gold,
    fontWeight: FontWeights.semibold,
  },

  // Generic input
  label: {
    fontSize: 12,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
    marginBottom: 6,
    marginTop: Spacing.sm,
    letterSpacing: 0.3,
  },
  input: {
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    height: 52,
    fontSize: FontSizes.base,
    color: Colors.navy,
    backgroundColor: Colors.white,
  },
  passwordWrap: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.white,
    paddingRight: 8,
  },
  eyeBtn: { padding: 8 },

  error: {
    color: Colors.danger,
    fontSize: 13,
    marginBottom: Spacing.sm,
    fontWeight: FontWeights.medium,
  },

  // Footer — matches PDF
  footer: { alignItems: "center", marginTop: Spacing.xl, gap: 4 },
  footerEmoji: { fontSize: 16 },
  footerText: {
    fontSize: 10,
    letterSpacing: 2.5,
    color: Colors.textTertiary,
    fontWeight: FontWeights.semibold,
  },
  footerLine: {
    width: 40,
    height: 3,
    backgroundColor: Colors.gold,
    borderRadius: 2,
    marginTop: 4,
  },

  devBar: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.md,
  },
  devLabel: {
    fontSize: 10,
    fontWeight: FontWeights.bold,
    color: Colors.textTertiary,
    letterSpacing: 1.5,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  devRow: {
    flexDirection: "row",
    gap: 8,
  },
  devBtn: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: BorderRadius.md,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: "dashed",
    alignItems: "center",
    backgroundColor: Colors.gray100,
  },
  devBtnText: {
    fontSize: 11,
    fontWeight: FontWeights.semibold,
    color: Colors.textSecondary,
  },
});
