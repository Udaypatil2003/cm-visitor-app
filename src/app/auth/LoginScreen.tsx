import React, { useState } from "react";
import {
  View, Text, StyleSheet, SafeAreaView, StatusBar,
  TouchableOpacity, TextInput, Image, ScrollView,
  ActivityIndicator, KeyboardAvoidingView, Platform,
} from "react-native";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { AuthStackParamList } from "../../navigation/types";
import { useAuthStore } from "../../store/authStore";
import authService from "../../services/authService";
import {
  Colors, FontSizes, FontWeights,
  Spacing, BorderRadius, Shadows,
} from "../../constants/theme";

type Props = NativeStackScreenProps<AuthStackParamList, "Login">;
type ActiveForm = "login" | "register";

export default function LoginScreen({ navigation }: Props) {
  const [activeForm, setActiveForm] = useState<ActiveForm>("login");

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const [regUsername, setRegUsername] = useState("");
  const [regMobile, setRegMobile] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regPasswordVisible, setRegPasswordVisible] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { setCitizenUser, setToken, setNeedsOnboarding, setGuardUser } = useAuthStore();

  const clearError = () => setError("");
  const switchForm = (form: ActiveForm) => { setActiveForm(form); clearError(); };

  // ── Smart Login — tries citizen first, falls back to guard ────────────────
  const handleLogin = async () => {
    if (!username.trim()) { setError("Enter your username"); return; }
    if (!password.trim()) { setError("Enter your password"); return; }
    clearError();
    setLoading(true);
    try {
      // Try citizen login first
      try {
        const res = await authService.loginCitizen({
          username: username.trim(),
          password,
        });
        if (res.success) {
          await setToken(res.data.token, "citizen");
          if (res.data.isNewUser) {
            setNeedsOnboarding(true);
          } else {
            setCitizenUser(res.data.user);
          }
          return;
        }
      } catch {
        // Citizen login failed — try guard
      }

      // Try guard login
      const guardRes = await authService.guardLogin(username.trim(), password);
      if (guardRes.success) {
        await setToken(guardRes.data.token, "guard");
        setGuardUser(guardRes.data.guard);
      } else {
        setError("Invalid username or password");
      }
    } catch (err: any) {
      setError(err?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // ── Register (citizen only) ───────────────────────────────────────────────
  const handleRegister = async () => {
    if (!regUsername.trim()) { setError("Enter a username"); return; }
    if (regMobile.length !== 10) { setError("Enter a valid 10-digit mobile number"); return; }
    if (regPassword.length < 6) { setError("Password must be at least 6 characters"); return; }
    clearError();
    setLoading(true);
    try {
      const res = await authService.registerCitizen({
        username: regUsername.trim(),
        mobilenumber: regMobile,
        password: regPassword,
      });
      if (res.success) {
        await setToken(res.data.token, "citizen");
        setNeedsOnboarding(true);
      } else {
        setError(res.message || "Registration failed");
      }
    } catch (err: any) {
      setError(err?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
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
              source={{ uri: "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800&q=80" }}
              style={s.heroImage}
            />
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

          {/* ── Tab Switcher ── */}
          <View style={s.mainTabWrap}>
            <View style={s.mainTabPill}>
              <TouchableOpacity
                style={[s.mainTab, activeForm === "login" && s.mainTabActive]}
                onPress={() => switchForm("login")}
              >
                <Text style={[s.mainTabText, activeForm === "login" && s.mainTabTextActive]}>
                  Login
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[s.mainTab, activeForm === "register" && s.mainTabActive]}
                onPress={() => switchForm("register")}
              >
                <Text style={[s.mainTabText, activeForm === "register" && s.mainTabTextActive]}>
                  Register
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* ── LOGIN FORM ── */}
          {activeForm === "login" && (
            <View style={s.form}>
              <Text style={s.formTitle}>Welcome Back</Text>
              <Text style={s.formSub}>Sign in with your username and password.</Text>

              <Text style={s.label}>Username</Text>
              <TextInput
                style={s.input}
                placeholder="Enter your username"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={(t) => { setUsername(t); clearError(); }}
              />

              <Text style={s.label}>Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
                  placeholder="••••••••"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!passwordVisible}
                  value={password}
                  onChangeText={(t) => { setPassword(t); clearError(); }}
                />
                <TouchableOpacity
                  onPress={() => setPasswordVisible((v) => !v)}
                  style={s.eyeBtn}
                >
                  <Text>{passwordVisible ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.cta, loading && s.ctaDisabled]}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.ctaText}>Login →</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.switchPrompt} onPress={() => switchForm("register")}>
                <Text style={s.switchPromptText}>
                  New here? <Text style={s.switchPromptLink}>Create an account</Text>
                </Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ── REGISTER FORM ── */}
          {activeForm === "register" && (
            <View style={s.form}>
              <Text style={s.formTitle}>Create Account</Text>
              <Text style={s.formSub}>
                Register with your mobile number. Complete your profile after.
              </Text>

              <Text style={s.label}>Username</Text>
              <TextInput
                style={s.input}
                placeholder="Choose a username"
                placeholderTextColor={Colors.placeholder}
                autoCapitalize="none"
                autoCorrect={false}
                value={regUsername}
                onChangeText={(t) => { setRegUsername(t); clearError(); }}
              />

              <Text style={s.label}>Mobile Number</Text>
              <View style={s.phoneWrap}>
                <Text style={s.phonePrefix}>📞 +91</Text>
                <View style={s.phoneDivider} />
                <TextInput
                  style={s.phoneInput}
                  placeholder="00000 00000"
                  placeholderTextColor={Colors.placeholder}
                  keyboardType="phone-pad"
                  maxLength={10}
                  value={regMobile}
                  onChangeText={(t) => { setRegMobile(t.replace(/\D/g, "")); clearError(); }}
                />
              </View>

              <Text style={s.label}>Password</Text>
              <View style={s.passwordWrap}>
                <TextInput
                  style={[s.input, { flex: 1, borderWidth: 0, marginBottom: 0 }]}
                  placeholder="Min. 6 characters"
                  placeholderTextColor={Colors.placeholder}
                  secureTextEntry={!regPasswordVisible}
                  value={regPassword}
                  onChangeText={(t) => { setRegPassword(t); clearError(); }}
                />
                <TouchableOpacity
                  onPress={() => setRegPasswordVisible((v) => !v)}
                  style={s.eyeBtn}
                >
                  <Text>{regPasswordVisible ? "🙈" : "👁"}</Text>
                </TouchableOpacity>
              </View>

              <View style={s.noteCard}>
                <View style={s.noteIconWrap}>
                  <Text>📋</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.noteTitle}>What happens next?</Text>
                  <Text style={s.noteBody}>
                    After registering, complete your Aadhaar-linked profile for gate access.
                  </Text>
                </View>
              </View>

              {error ? <Text style={s.error}>{error}</Text> : null}

              <TouchableOpacity
                style={[s.cta, loading && s.ctaDisabled]}
                onPress={handleRegister}
                disabled={loading}
                activeOpacity={0.82}
              >
                {loading
                  ? <ActivityIndicator color={Colors.white} />
                  : <Text style={s.ctaText}>Register & Continue →</Text>
                }
              </TouchableOpacity>

              <TouchableOpacity style={s.switchPrompt} onPress={() => switchForm("login")}>
                <Text style={s.switchPromptText}>
                  Already registered? <Text style={s.switchPromptLink}>Login</Text>
                </Text>
              </TouchableOpacity>
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
  scroll: { paddingBottom: Spacing.xxl },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
  },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: Spacing.sm },
  logoBadge: {
    width: 36, height: 36, borderRadius: BorderRadius.sm,
    backgroundColor: Colors.primaryLight, alignItems: "center", justifyContent: "center",
  },
  logoEmoji: { fontSize: FontSizes.lg },
  headerTitle: { fontSize: FontSizes.md, fontWeight: FontWeights.semibold, color: Colors.textPrimary },
  headerPin: { fontSize: FontSizes.lg },
  heroWrap: {
    position: "relative", height: 200, marginHorizontal: Spacing.lg,
    borderRadius: BorderRadius.lg, overflow: "hidden", marginBottom: Spacing.lg,
  },
  heroImage: { width: "100%", height: "100%" },
  heroOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: "rgba(0,0,0,0.35)" },
  locationBadge: {
    position: "absolute", bottom: Spacing.md, left: Spacing.md,
    flexDirection: "row", alignItems: "center", gap: Spacing.sm,
    backgroundColor: "rgba(255,255,255,0.15)", borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.sm, paddingVertical: Spacing.xs,
  },
  locationIcon: {
    width: 28, height: 28, backgroundColor: Colors.white,
    borderRadius: BorderRadius.xs, alignItems: "center", justifyContent: "center",
  },
  locationLabel: { fontSize: FontSizes.xs, color: "rgba(255,255,255,0.7)", fontWeight: FontWeights.semibold },
  locationName: { fontSize: FontSizes.sm, color: Colors.white, fontWeight: FontWeights.semibold },
  mainTabWrap: { paddingHorizontal: Spacing.lg, marginBottom: Spacing.lg },
  mainTabPill: {
    flexDirection: "row", backgroundColor: Colors.surfaceSecondary,
    borderRadius: BorderRadius.full, padding: 4,
  },
  mainTab: { flex: 1, paddingVertical: Spacing.sm, alignItems: "center", borderRadius: BorderRadius.full },
  mainTabActive: { backgroundColor: Colors.white, ...Shadows.sm },
  mainTabText: { fontSize: FontSizes.sm, color: Colors.textSecondary, fontWeight: FontWeights.medium },
  mainTabTextActive: { color: Colors.textPrimary, fontWeight: FontWeights.semibold },
  form: { paddingHorizontal: Spacing.lg },
  formTitle: { fontSize: FontSizes.xl, fontWeight: FontWeights.bold, color: Colors.textPrimary, marginBottom: Spacing.xs },
  formSub: { fontSize: FontSizes.sm, color: Colors.textSecondary, marginBottom: Spacing.lg, lineHeight: 20 },
  label: { fontSize: FontSizes.sm, fontWeight: FontWeights.medium, color: Colors.textPrimary, marginBottom: Spacing.xs },
  input: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSizes.md, color: Colors.textPrimary,
    backgroundColor: Colors.white, marginBottom: Spacing.md,
  },
  phoneWrap: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderColor: Colors.border, borderRadius: BorderRadius.md,
    marginBottom: Spacing.md, backgroundColor: Colors.white, overflow: "hidden",
  },
  phonePrefix: { paddingHorizontal: Spacing.md, fontSize: FontSizes.md, color: Colors.textSecondary },
  phoneDivider: { width: 1, height: "60%", backgroundColor: Colors.border },
  phoneInput: {
    flex: 1, paddingHorizontal: Spacing.md, paddingVertical: Spacing.sm,
    fontSize: FontSizes.md, color: Colors.textPrimary,
  },
  passwordWrap: {
    flexDirection: "row", alignItems: "center", borderWidth: 1,
    borderColor: Colors.border, borderRadius: BorderRadius.md,
    marginBottom: Spacing.md, backgroundColor: Colors.white,
  },
  eyeBtn: { paddingHorizontal: Spacing.md },
  noteCard: {
    flexDirection: "row", gap: Spacing.sm, backgroundColor: Colors.primaryLight,
    borderRadius: BorderRadius.md, padding: Spacing.md, marginBottom: Spacing.lg,
  },
  noteIconWrap: {
    width: 32, height: 32, backgroundColor: Colors.white,
    borderRadius: BorderRadius.sm, alignItems: "center", justifyContent: "center",
  },
  noteTitle: { fontSize: FontSizes.sm, fontWeight: FontWeights.semibold, color: Colors.textPrimary, marginBottom: 2 },
  noteBody: { fontSize: FontSizes.xs, color: Colors.textSecondary, lineHeight: 16 },
  error: { color: Colors.danger, fontSize: FontSizes.sm, marginBottom: Spacing.md },
  cta: {
    backgroundColor: Colors.primary, borderRadius: BorderRadius.md,
    paddingVertical: Spacing.md, alignItems: "center", marginBottom: Spacing.md, ...Shadows.md,
  },
  ctaDisabled: { opacity: 0.6 },
  ctaText: { color: Colors.white, fontSize: FontSizes.md, fontWeight: FontWeights.semibold },
  switchPrompt: { alignItems: "center", marginBottom: Spacing.lg },
  switchPromptText: { fontSize: FontSizes.sm, color: Colors.textSecondary },
  switchPromptLink: { color: Colors.primary, fontWeight: FontWeights.semibold },
  footer: { alignItems: "center", paddingVertical: Spacing.xl, gap: Spacing.xs },
  footerEmoji: { fontSize: FontSizes.xl },
  footerText: { fontSize: FontSizes.xs, color: Colors.textTertiary, fontWeight: FontWeights.semibold, letterSpacing: 2 },
  footerLine: { width: 40, height: 2, backgroundColor: Colors.border, borderRadius: 1 },
});