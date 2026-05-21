import { NavigatorScreenParams } from '@react-navigation/native';

// ─── Auth Stack ───────────────────────────────────────────────────────────────

export type AuthStackParamList = {
  Splash: undefined;
  Welcome: undefined;
  CitizenOnboarding: undefined;
  Login: undefined;
};

// ─── Citizen Tabs ─────────────────────────────────────────────────────────────

export type CitizenTabParamList = {
  CitizenHome: undefined;
  MyAppointments: undefined;
  Profile: undefined;
};

// ─── Citizen Stack (wraps tabs + modals + push screens) ───────────────────────

export type CitizenStackParamList = {
  CitizenTabs: NavigatorScreenParams<CitizenTabParamList>;
  BookAppointment: undefined;
  AppointmentConfirm: {
    appointmentDate: string;
    companionsCount: 0 | 1 | 2;
    purposeOfVisit: string;
  };
  AppointmentDetail: { appointmentId: string };
  EditProfile: undefined;
};

// ─── Guard Stack ──────────────────────────────────────────────────────────────

export type GuardStackParamList = {
  GuardHome: undefined;
  QRScanner: undefined;
  ScanResult: { result: string };   // result is JSON.stringified QRVerifyResult
};