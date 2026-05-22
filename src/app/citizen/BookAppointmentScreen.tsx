import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Calendar, DateData } from "react-native-calendars";

import { CitizenStackParamList } from "../../navigation/types";
import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  BorderRadius,
  Shadows,
  Layout,
} from "../../constants/theme";

type Nav = NativeStackNavigationProp<CitizenStackParamList>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function toISODate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

const today = new Date();
today.setHours(0, 0, 0, 0);
const todayStr = toISODate(today);

const maxDate = new Date(today);
maxDate.setMonth(maxDate.getMonth() + 1);
const maxDateStr = toISODate(maxDate);

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function BookAppointmentScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [companions, setCompanions] = useState<number>(0);
  const [purpose, setPurpose] = useState("");
  const [purposeError, setPurposeError] = useState("");

  // ── Companions helpers ────────────────────────────────────────────────────

  function increment() {
    setCompanions((c) => c + 1);
  }

  function decrement() {
    setCompanions((c) => (c > 0 ? c - 1 : 0));
  }

  function handleCompanionInput(val: string) {
    const n = parseInt(val.replace(/[^0-9]/g, ""), 10);
    if (isNaN(n)) {
      setCompanions(0);
      return;
    }
    setCompanions(n);
  }

  // ── Validation & proceed ──────────────────────────────────────────────────

  function handleReview() {
    if (purpose.trim().length < 10) {
      setPurposeError("Please describe your purpose (min 10 characters).");
      return;
    }
    setPurposeError("");
    navigation.navigate("AppointmentConfirm", {
      appointmentDate: selectedDate,
      companionsCount: companions as 0 | 1 | 2,
      purposeOfVisit: purpose.trim(),
    });
  }

  // ── Calendar marked dates ─────────────────────────────────────────────────

  const markedDates = {
    [selectedDate]: {
      selected: true,
      selectedColor: Colors.gold,
      selectedTextColor: Colors.navy,
    },
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.closeBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Appointment</Text>
        <View style={styles.closeBtn} />
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingBottom: insets.bottom + Spacing[8] },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Purpose ──────────────────────────────────────────────────── */}
        <Text style={styles.label}>Purpose of Visit</Text>
        <TextInput
          style={[styles.textArea, purposeError ? styles.textAreaError : null]}
          placeholder="Describe your reason for visiting…"
          placeholderTextColor={Colors.placeholder}
          value={purpose}
          onChangeText={(t) => {
            setPurpose(t);
            if (purposeError && t.trim().length >= 10) setPurposeError("");
          }}
          multiline
          numberOfLines={3}
          maxLength={300}
          textAlignVertical="top"
        />
        {purposeError ? (
          <Text style={styles.errorText}>{purposeError}</Text>
        ) : null}
        <Text style={styles.charCount}>{purpose.length}/300</Text>

        {/* ── Calendar ─────────────────────────────────────────────────── */}
        <Text style={styles.label}>Select Date</Text>
        <View style={styles.calendarWrap}>
          <Calendar
            current={todayStr}
            minDate={todayStr}
            maxDate={maxDateStr}
            markedDates={markedDates}
            onDayPress={(day: DateData) => setSelectedDate(day.dateString)}
            enableSwipeMonths
            theme={{
              backgroundColor: Colors.white,
              calendarBackground: Colors.white,

              // Month/year header
              monthTextColor: Colors.navy,
              textMonthFontSize: FontSizes.base,
              textMonthFontWeight: FontWeights.bold,

              // Arrow buttons
              arrowColor: Colors.gold,

              // Day names row (Mon, Tue…)
              textSectionTitleColor: Colors.textSecondary,
              textDayHeaderFontSize: FontSizes.xs,
              textDayHeaderFontWeight: FontWeights.semibold,

              // Day numbers
              dayTextColor: Colors.navy,
              textDayFontSize: FontSizes.base,
              textDayFontWeight: FontWeights.medium,

              // Today
              todayTextColor: Colors.gold,
              todayBackgroundColor: Colors.goldLight,

              // Selected day
              selectedDayBackgroundColor: Colors.gold,
              selectedDayTextColor: Colors.navy,

              // Disabled days (past / beyond max)
              textDisabledColor: Colors.gray400,

              // Dot marker (not used but set it anyway)
              dotColor: Colors.gold,
              selectedDotColor: Colors.navy,
            }}
          />
        </View>

        {/* ── Companions ───────────────────────────────────────────────── */}
        {/* ── Companions ───────────────────────────────────────────────── */}
        <Text style={styles.label}>Number of Companions</Text>
        <View style={styles.companionsCenterWrap}>
          <View style={styles.companionsWrap}>
            <TouchableOpacity
              style={[
                styles.stepBtn,
                companions === 0 && styles.stepBtnDisabled,
              ]}
              onPress={decrement}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text
                style={[
                  styles.stepBtnText,
                  companions === 0 && styles.stepBtnTextDisabled,
                ]}
              >
                −
              </Text>
            </TouchableOpacity>

            <TextInput
              style={styles.companionInput}
              value={String(companions)}
              onChangeText={handleCompanionInput}
              keyboardType="number-pad"
              maxLength={3}
              selectTextOnFocus
            />

            <TouchableOpacity
              style={styles.stepBtn}
              onPress={increment}
              activeOpacity={0.7}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.stepBtnText}>+</Text>
            </TouchableOpacity>
          </View>

          {companions > 0 && (
            <Text style={styles.companionHint}>
              Total visitors: {companions + 1} (you + {companions})
            </Text>
          )}
        </View>

        {/* ── Summary strip ────────────────────────────────────────────── */}
        <View style={styles.summaryStrip}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryKey}>Date</Text>
            <Text style={styles.summaryVal}>
              {new Date(selectedDate + "T00:00:00").toLocaleDateString(
                "en-IN",
                {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                },
              )}
            </Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryItem}>
            <Text style={styles.summaryKey}>Companions</Text>
            <Text style={styles.summaryVal}>
              {companions === 0 ? "None" : companions}
            </Text>
          </View>
        </View>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <TouchableOpacity
          style={[styles.cta, purpose.trim().length < 10 && styles.ctaDisabled]}
          onPress={handleReview}
          activeOpacity={0.85}
        >
          <Text style={styles.ctaText}>Review Appointment →</Text>
        </TouchableOpacity>
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

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: Layout.screenPaddingH,
    paddingVertical: Spacing[3],
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
  closeBtn: {
    width: 32,
    alignItems: "center",
  },
  closeText: {
    fontSize: FontSizes.lg,
    color: Colors.textSecondary,
  },

  // Scroll
  scroll: {
    paddingHorizontal: Layout.screenPaddingH,
    paddingTop: Spacing[4],
  },

  // Labels
  label: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.semibold,
    color: Colors.navy,
    marginBottom: Spacing[2],
    marginTop: Spacing[5],
  },

  // Purpose
  textArea: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: BorderRadius.md,
    padding: Spacing[3],
    fontSize: FontSizes.base,
    color: Colors.textPrimary,
    minHeight: 90,
    backgroundColor: Colors.gray100,
  },
  textAreaError: {
    borderColor: Colors.danger,
  },
  errorText: {
    fontSize: FontSizes.sm,
    color: Colors.danger,
    marginTop: Spacing[1],
  },
  charCount: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    textAlign: "right",
    marginTop: 4,
  },

  // Calendar
  calendarWrap: {
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.sm,
  },

  // Companions stepper
  // Companions stepper
  companionsWrap: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "center",
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.border,
    ...Shadows.md,
    marginTop: Spacing[2],
  },
  stepBtn: {
    width: 64,
    height: 64,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: Colors.navyLight,
  },
  stepBtnDisabled: {
    backgroundColor: Colors.gray200,
  },
  stepBtnText: {
    fontSize: 28,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    lineHeight: 34,
  },
  stepBtnTextDisabled: {
    color: Colors.gray400,
  },
  companionInput: {
    width: 96,
    height: 64,
    fontSize: 32,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.white,
    textAlign: "center",
  },
  companionHint: {
    fontSize: FontSizes.sm,
    color: Colors.textSecondary,
    marginTop: Spacing[2],
    textAlign: "center",
  },
  companionsCenterWrap: {
    alignItems: "center",
  },

  // Summary strip
  summaryStrip: {
    flexDirection: "row",
    backgroundColor: Colors.navyLight,
    borderRadius: BorderRadius.md,
    padding: Spacing[4],
    marginTop: Spacing[6],
    alignItems: "center",
  },
  summaryItem: {
    flex: 1,
    alignItems: "center",
  },
  summaryDivider: {
    width: 1,
    height: 32,
    backgroundColor: Colors.border,
  },
  summaryKey: {
    fontSize: FontSizes.xs,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  summaryVal: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },

  // CTA
  cta: {
    marginTop: Spacing[6],
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.md,
    height: Layout.buttonHeight,
    alignItems: "center",
    justifyContent: "center",
    ...Shadows.md,
  },
  ctaDisabled: {
    opacity: 0.5,
  },
  ctaText: {
    fontSize: FontSizes.base,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
  },
});
