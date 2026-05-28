import { NavigatorScreenParams } from '@react-navigation/native';
import type { QRVerifyResult } from '../types/guard.types'; 


export type AuthStackParamList = {
  Splash: undefined;
  Login: undefined;           // ← no params, no Welcome
};

export type CitizenTabParamList = {
  CitizenHome: undefined;
  MyAppointments: undefined;
  Profile: undefined;
  Alerts: undefined;
};

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

export type GuardStackParamList = {
  GuardHome: undefined;
  QRScanner: undefined;
ScanResult: { result: QRVerifyResult };
GuardBookVisitor: undefined;  
};