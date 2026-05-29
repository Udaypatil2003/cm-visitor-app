import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  Pressable,
} from "react-native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Circle } from "react-native-svg";

import {
  Colors,
  FontSizes,
  FontWeights,
  Spacing,
  Shadows,
  BorderRadius,
} from "../constants/theme";
import { CitizenStackParamList, CitizenTabParamList } from "./types";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

// Screens
import CitizenHomeScreen from "../app/citizen/CitizenHomeScreen";
import MyAppointmentsScreen from "../app/citizen/MyAppointmentsScreen";
import EditProfileScreen from "../app/citizen/EditProfileScreen";
import BookAppointmentScreen from "../app/citizen/BookAppointmentScreen";
import AppointmentConfirmScreen from "../app/citizen/AppointmentConfirmScreen";
import AppointmentDetailScreen from "../app/citizen/AppointmentDetailScreen";

// Placeholder screens for Alerts (Step 45 — notifications, not yet built)

const Tab = createBottomTabNavigator<CitizenTabParamList>();
const Stack = createNativeStackNavigator<CitizenStackParamList>();

// ─── SVG Tab Icons ────────────────────────────────────────────────────────────
// Pure SVG — no icon library dependency, pixel-matched to PDF design

function HomeIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H5a1 1 0 01-1-1V9.5z"
        stroke={color}
        strokeWidth={1.8}
        strokeLinejoin="round"
      />
      <Path
        d="M9 21V12h6v9"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function HistoryIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
      <Path
        d="M12 7v5l3 3"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3.5 3.5L6 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function AlertsIcon({
  color,
  badgeCount,
}: {
  color: string;
  badgeCount?: number;
}) {
  return (
    <View style={{ position: "relative" }}>
      <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
        <Path
          d="M15 17H5a2 2 0 01-2-2v-.5C3 13.6 4 12.8 4 12V8a8 8 0 1116 0v4c0 .8 1 1.6 1 2.5V15a2 2 0 01-2 2h-4z"
          stroke={color}
          strokeWidth={1.8}
          strokeLinejoin="round"
        />
        <Path
          d="M10 17a2 2 0 004 0"
          stroke={color}
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </Svg>
      {badgeCount !== undefined && badgeCount > 0 && (
        <View style={tabStyles.badge}>
          <Text style={tabStyles.badgeText}>
            {badgeCount > 9 ? "9+" : badgeCount}
          </Text>
        </View>
      )}
    </View>
  );
}

function ProfileIcon({ color }: { color: string }) {
  return (
    <Svg width={22} height={22} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={1.8} />
      <Path
        d="M4 20c0-4 3.6-7 8-7s8 3 8 7"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

// ─── Tab Label ────────────────────────────────────────────────────────────────

interface TabItemProps {
  icon: React.ReactNode;
  focused: boolean;
}

function TabItem({ icon, focused }: TabItemProps) {
  return (
    <View style={[tabStyles.item, focused && tabStyles.itemFocused]}>
      <View style={{ opacity: focused ? 1 : 0.4 }}>{icon}</View>
    </View>
  );
}

// ─── Custom Tab Bar with FAB ──────────────────────────────────────────────────
// We use a custom tabBar so we can inject the floating + BOOKING button
// that sits above the tab bar in the center-right area (matching PDF page 3)

// ─── Custom Tab Bar — Design 2: dark floating pill ────────────────────────────
function CustomTabBar({ state, descriptors, navigation }: any) {
  const insets = useSafeAreaInsets();
  const stackNav =
    useNavigation<NativeStackNavigationProp<CitizenStackParamList>>();

  const bottomPadding =
    insets.bottom > 0 ? insets.bottom : Platform.OS === 'android' ? 8 : 4;

  return (
    <View
      style={[
        tabBarStyles.outerWrapper,
        { paddingBottom: bottomPadding },
      ]}
      pointerEvents="box-none"
    >
      {/* ── FAB — "+ New Booking" pill ───────────────────────────────── */}
      <TouchableOpacity
        style={tabBarStyles.fab}
        activeOpacity={0.85}
        onPress={() => stackNav.navigate('BookAppointment')}
        accessibilityLabel="Book new appointment"
        accessibilityRole="button"
      >
        <Text style={tabBarStyles.fabPlus}>+</Text>
        <Text style={tabBarStyles.fabLabel}>New Booking</Text>
      </TouchableOpacity>

      {/* ── Dark pill tab bar ────────────────────────────────────────── */}
      <View style={tabBarStyles.pill}>
        {state.routes.map((route: any, index: number) => {
          const { options } = descriptors[route.key];
          const focused = state.index === index;

          const onPress = () => {
            const event = navigation.emit({
              type: 'tabPress',
              target: route.key,
              canPreventDefault: true,
            });
            if (!focused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <Pressable
              key={route.key}
              onPress={onPress}
              style={tabBarStyles.pillTab}
              android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true }}
              accessibilityRole="tab"
              accessibilityState={{ selected: focused }}
            >
              {/* Active tab gets a lighter pill highlight */}
              {focused && <View style={tabBarStyles.activeHighlight} />}
              <View style={{ opacity: focused ? 1 : 0.5 }}>
                {options.tabBarIcon?.({ focused, color: Colors.white, size: 22 })}
              </View>
              {focused && (
                <Text style={tabBarStyles.activeLabel}>
                  {route.name === 'CitizenHome'
                    ? 'Home'
                    : route.name === 'MyAppointments'
                    ? 'History'
                    : 'Profile'}
                </Text>
              )}
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────

function CitizenTabs() {
  return (
    <Tab.Navigator
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false,
       }}
    >
      <Tab.Screen
        name="CitizenHome"
        component={CitizenHomeScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={<HomeIcon color={focused ? Colors.gold : Colors.white} />}
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="MyAppointments"
        component={MyAppointmentsScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={
                <HistoryIcon color={focused ? Colors.gold : Colors.white} />
              }
              focused={focused}
            />
          ),
        }}
      />
      <Tab.Screen
        name="Profile"
        component={EditProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabItem
              icon={
                <ProfileIcon color={focused ? Colors.gold : Colors.white} />
              }
              focused={focused}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// ─── Citizen Stack (tabs + modals + push screens) ─────────────────────────────

export function CitizenNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Tabs root */}
      <Stack.Screen name="CitizenTabs" component={CitizenTabs} />

      {/* Modal screens */}
      <Stack.Screen
        name="BookAppointment"
        component={BookAppointmentScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="AppointmentConfirm"
        component={AppointmentConfirmScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
          gestureEnabled: false,
          headerShown: false,
        }}
      />

      {/* Push screens */}
      <Stack.Screen
        name="AppointmentDetail"
        component={AppointmentDetailScreen}
        options={{ animation: "slide_from_right", headerShown: false }}
      />
      <Stack.Screen
        name="EditProfile"
        component={EditProfileScreen}
        options={{ animation: "slide_from_right" }}
      />
    </Stack.Navigator>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const tabStyles = StyleSheet.create({
  item: {
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[2],
    borderRadius: 20,
  },
  itemFocused: {
    backgroundColor: "rgba(245,166,35,0.18)", // translucent gold tint on dark bg
  },
  // badge kept as-is from original
  badge: {
    position: "absolute",
    top: -4,
    right: -8,
    backgroundColor: Colors.danger,
    borderRadius: BorderRadius.full,
    minWidth: 16,
    height: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 9,
    fontWeight: FontWeights.bold,
  },
});

const tabBarStyles = StyleSheet.create({
  outerWrapper: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    alignItems: 'center',
    // Transparent so screen content shows through
    backgroundColor: 'transparent',
    paddingHorizontal: Spacing[4],
    paddingBottom: 12,
  },
  // ── Dark floating pill ───────────────────────────────────────────────────
  pill: {
    flexDirection: 'row',
    backgroundColor: Colors.navy,          // dark navy pill
    borderRadius: BorderRadius.full,
    height: 60,
    alignSelf: 'center',
    paddingHorizontal: Spacing[2],
    alignItems: 'center',
    ...Shadows.lg,
    // subtle border so it reads on light backgrounds
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: Colors.navyMid,
  },
  pillTab: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing[4],
    height: 44,
    borderRadius: BorderRadius.full,
    position: 'relative',
    gap: 6,
  },
  activeHighlight: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255,255,255,0.12)',
    borderRadius: BorderRadius.full,
  },
  activeLabel: {
    color: Colors.white,
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.semibold,
  },
  // ── FAB pill ─────────────────────────────────────────────────────────────
  fab: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.gold,
    borderRadius: BorderRadius.full,
    paddingHorizontal: Spacing[5],
    paddingVertical: Spacing[3],
    marginBottom: Spacing[3],
    gap: 6,
    ...Shadows.lg,
  },
  fabPlus: {
    fontSize: FontSizes.lg,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    lineHeight: 22,
  },
  fabLabel: {
    fontSize: FontSizes.sm,
    fontWeight: FontWeights.bold,
    color: Colors.navy,
    letterSpacing: 0.3,
  },
});
