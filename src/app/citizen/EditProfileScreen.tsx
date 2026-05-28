import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppHeader } from "../../components/common/AppHeader";
import { useAuthStore } from "../../store/authStore";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from "../../constants/theme";
import { Image } from "react-native";
import * as ImagePicker from "expo-image-picker";
import userService from "../../services/userService";

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionTitle({ label }: { label: string }) {
  return <Text style={styles.sectionTitle}>{label}</Text>;
}

// ─── Info Row ─────────────────────────────────────────────────────────────────

function InfoRow({
  label,
  value,
  dimmed,
}: {
  label: string;
  value: string;
  dimmed?: boolean;
}) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={[styles.infoValue, dimmed && styles.infoValueDimmed]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Avatar Placeholder ───────────────────────────────────────────────────────

function AvatarBlock({
  name,
  photoUrl,
  onPress,
  uploading,
}: {
  name: string;
  photoUrl?: string;
  onPress: () => void;
  uploading: boolean;
}) {
  const initials = name
    .split(" ")
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");

  return (
    <TouchableOpacity
      style={styles.avatarWrapper}
      onPress={onPress}
      disabled={uploading}
      activeOpacity={0.8}
      accessibilityLabel="Change profile photo"
    >
      <View style={styles.avatar}>
        {photoUrl ? (
          <Image source={{ uri: photoUrl }} style={styles.avatarImage} />
        ) : (
          <Text style={styles.avatarInitials}>{initials}</Text>
        )}
      </View>
      <View style={styles.avatarBadge}>
        {uploading ? (
          <ActivityIndicator size={10} color={Colors.white} />
        ) : (
          <Text style={styles.avatarBadgeText}>📷</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

// ─── EditProfileScreen ────────────────────────────────────────────────────────

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const { citizenUser, logout, setCitizenUser } = useAuthStore();
  const [loggingOut, setLoggingOut] = useState(false);

  const displayName = citizenUser?.fullName ?? "Citizen";
  const phone = citizenUser?.phone ?? "—";
  const aadhaar = citizenUser?.aadhaarNumber
    ? `XXXX XXXX ${citizenUser.aadhaarNumber.slice(-4)}`
    : "—";
  const city = citizenUser?.city ?? "—";
  const district = citizenUser?.district ?? "—";
  const address = citizenUser?.address ?? "—";
  const [photoUploading, setPhotoUploading] = useState(false);

  // ── Logout handler ──────────────────────────────────────────────────────────

  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Log Out",
          style: "destructive",
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
              // RootNavigator re-renders automatically because
              // isAuthenticated flips to false in authStore
            } catch {
              setLoggingOut(false);
              Alert.alert("Error", "Could not log out. Please try again.");
            }
          },
        },
      ],
      { cancelable: true },
    );
  };

  const handleChangePhoto = () => {
    Alert.alert("Change Profile Photo", "Choose an option", [
      {
        text: "Take Photo",
        onPress: async () => {
          const { status } = await ImagePicker.requestCameraPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed", "Please allow camera access.");
            return;
          }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await uploadPhoto(result.assets[0].uri);
          }
        },
      },
      {
        text: "Choose from Gallery",
        onPress: async () => {
          const { status } =
            await ImagePicker.requestMediaLibraryPermissionsAsync();
          if (status !== "granted") {
            Alert.alert("Permission needed", "Please allow photo access.");
            return;
          }
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.8,
          });
          if (!result.canceled && result.assets[0]) {
            await uploadPhoto(result.assets[0].uri);
          }
        },
      },
      { text: "Cancel", style: "cancel" },
    ]);
  };

  const uploadPhoto = async (uri: string) => {
    setPhotoUploading(true);
    try {
      const res = await userService.uploadPhoto(uri);
      if (res.success && res.data?.photoUrl) {
        // Merge new photoUrl into the existing citizenUser in the store.
        // setCitizenUser replaces the whole object — spread the existing
        // user so no other fields are lost.
        if (citizenUser) {
          setCitizenUser({
            ...citizenUser,
            profilePhotoUrl: res.data.photoUrl,
          });
        }
        Alert.alert("Success", "Profile photo updated.");
      } else {
        Alert.alert("Error", res.message || "Photo upload failed.");
      }
    } catch (e: any) {
      Alert.alert(
        "Error",
        e?.message || "Photo upload failed. Please try again.",
      );
    } finally {
      setPhotoUploading(false);
    }
  };

  return (
    <View style={styles.root}>
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <AppHeader title="My Profile" />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing[10] },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Avatar + Name ───────────────────────────────────────────── */}
        <View style={styles.profileBlock}>
          <AvatarBlock
            name={displayName}
            photoUrl={citizenUser?.profilePhotoUrl || undefined}
            onPress={handleChangePhoto}
            uploading={photoUploading}
          />
          <Text style={styles.profileName}>{displayName}</Text>
          <Text style={styles.profilePhone}>{phone}</Text>
        </View>

        {/* ── Personal Info Card ──────────────────────────────────────── */}
        <View style={styles.card}>
          <SectionTitle label="Personal Information" />
          <InfoRow label="Full Name" value={displayName} />
          <View style={styles.divider} />
          <InfoRow label="Mobile" value={phone} dimmed />
          <View style={styles.divider} />
          <InfoRow label="Aadhaar" value={aadhaar} dimmed />
        </View>

        {/* ── Address Card ────────────────────────────────────────────── */}
        <View style={[styles.card, { marginTop: Spacing[3] }]}>
          <SectionTitle label="Address" />
          <InfoRow label="Address" value={address} />
          <View style={styles.divider} />
          <InfoRow label="City" value={city} />
          <View style={styles.divider} />
          <InfoRow label="District" value={district} />
        </View>

        {/* ── Note ────────────────────────────────────────────────────── */}
        <View style={styles.noteCard}>
          <Text style={styles.noteText}>
            ⓘ Mobile number and Aadhaar are non-editable. Contact support to
            update.
          </Text>
        </View>

        {/* ── Spacer before logout ────────────────────────────────────── */}
        <View style={{ height: Spacing[6] }} />

        {/* ── Logout Button ───────────────────────────────────────────── */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            loggingOut && styles.logoutButtonDisabled,
          ]}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.75}
          accessibilityRole="button"
          accessibilityLabel="Log out of your account"
        >
          {loggingOut ? (
            <ActivityIndicator color={Colors.danger} size="small" />
          ) : (
            <>
              <Text style={styles.logoutIcon}>⎋</Text>
              <Text style={styles.logoutLabel}>Log Out</Text>
            </>
          )}
        </TouchableOpacity>

        {/* ── App version ─────────────────────────────────────────────── */}
        <Text style={styles.version}>CM Bungalow Visitor App · v1.0.0</Text>
      </ScrollView>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[5],
  },

  // ── Avatar block ──────────────────────────────────────────────────────────
  profileBlock: {
    alignItems: "center",
    marginBottom: Spacing[6],
  },
  avatarWrapper: {
    position: "relative",
    marginBottom: Spacing[3],
  },
  avatar: {
    width: 88,
    height: 88,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.navyMid,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: Colors.gold,
  },
  avatarInitials: {
    fontSize: FontSizes.xxl,
    fontWeight: FontWeights.bold,
    color: Colors.white,
  },
  avatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.gold,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: Colors.white,
  },
  avatarBadgeText: {
    fontSize: 12,
    color: Colors.navy,
    fontWeight: FontWeights.bold,
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: BorderRadius.full,
  },
  profileName: {
    fontSize: FontSizes.xl,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    marginBottom: Spacing[1],
  },
  profilePhone: {
    fontSize: FontSizes.base,
    color: Colors.textSecondary,
  },

  // ── Cards ─────────────────────────────────────────────────────────────────
  card: {
    backgroundColor: Colors.white,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Layout.cardPadding,
    paddingTop: Spacing[3],
    paddingBottom: Spacing[2],
    ...Shadows.sm,
  },
  sectionTitle: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
    color: Colors.gold,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    marginBottom: Spacing[2],
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: Spacing[2],
  },
  infoLabel: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    fontWeight: FontWeights.medium,
  },
  infoValue: {
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    fontWeight: FontWeights.semibold,
    maxWidth: "60%",
    textAlign: "right",
  },
  infoValueDimmed: {
    color: Colors.textDisabled,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: Colors.border,
  },

  // ── Note card ─────────────────────────────────────────────────────────────
  noteCard: {
    marginTop: Spacing[3],
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
  },
  noteText: {
    fontSize: FontSizes.sm,
    color: Colors.navyMid,
    lineHeight: 20,
  },

  // ── Logout ────────────────────────────────────────────────────────────────
  logoutButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing[2],
    height: Layout.buttonHeight,
    borderRadius: BorderRadius.lg,
    borderWidth: 1.5,
    borderColor: Colors.danger,
    backgroundColor: Colors.dangerLight,
  },
  logoutButtonDisabled: {
    opacity: 0.6,
  },
  logoutIcon: {
    fontSize: FontSizes.lg,
    color: Colors.danger,
  },
  logoutLabel: {
    fontSize: FontSizes.md,
    fontWeight: FontWeights.semibold,
    color: Colors.danger,
  },

  // ── Version ───────────────────────────────────────────────────────────────
  version: {
    textAlign: "center",
    fontSize: FontSizes.xs,
    color: Colors.textTertiary,
    marginTop: Spacing[4],
  },
});
