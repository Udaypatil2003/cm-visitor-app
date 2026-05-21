import { ApiResponse } from '../types/api.types';
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  CompanionsCount,
} from '../types/appointment.types';
import { Config } from '../constants/config';
import { mockDelay, apiClient } from './api';
import * as Endpoints from '../constants/endpoints';
import { getMidnight } from '../utils/dateUtils';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 7);
const twoWeeksAgo = new Date(today);
twoWeeksAgo.setDate(today.getDate() - 14);

const tomorrowStr = tomorrow.toISOString().split('T')[0];
const nextWeekStr = nextWeek.toISOString().split('T')[0];
const lastWeekStr = lastWeek.toISOString().split('T')[0];
const twoWeeksAgoStr = twoWeeksAgo.toISOString().split('T')[0];

let _mockAppointments: Appointment[] = [
  {
    id: 'appt-001',
    citizenId: 'citizen-001',
    appointmentDate: tomorrowStr,
    companionsCount: 1,
    purposeOfVisit: 'Regarding land record correction and documentation',
    status: 'APPROVED',
    rejectionReason: null,
    qrToken: 'valid-token',
    qrExpiresAt: getMidnight(tomorrowStr),
    createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'appt-002',
    citizenId: 'citizen-001',
    appointmentDate: nextWeekStr,
    companionsCount: 0,
    purposeOfVisit: 'Grievance regarding water supply in my area',
    status: 'PENDING',
    rejectionReason: null,
    qrToken: '',
    qrExpiresAt: getMidnight(nextWeekStr),
    createdAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'appt-003',
    citizenId: 'citizen-001',
    appointmentDate: lastWeekStr,
    companionsCount: 2,
    purposeOfVisit: 'Seeking assistance for business permit renewal',
    status: 'REJECTED',
    rejectionReason: 'Insufficient documents submitted. Please reapply with complete documentation.',
    qrToken: '',
    qrExpiresAt: getMidnight(lastWeekStr),
    createdAt: new Date(today.getTime() - 10 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 9 * 24 * 60 * 60 * 1000).toISOString(),
  },
  {
    id: 'appt-004',
    citizenId: 'citizen-001',
    appointmentDate: twoWeeksAgoStr,
    companionsCount: 1,
    purposeOfVisit: 'Discussion on road repair work in Shanti Nagar area',
    status: 'APPROVED',
    rejectionReason: null,
    qrToken: 'expired-token',
    qrExpiresAt: getMidnight(twoWeeksAgoStr),
    createdAt: new Date(today.getTime() - 18 * 24 * 60 * 60 * 1000).toISOString(),
    updatedAt: new Date(today.getTime() - 17 * 24 * 60 * 60 * 1000).toISOString(),
  },
];

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBackendToAppointment(raw: any): Appointment {
  return {
    id: raw.id ?? raw._id,
    citizenId: raw.citizenId ?? raw.citizen_id,
    appointmentDate: raw.appointmentDate ?? raw.appointment_date,
    companionsCount: (raw.companionsCount ?? raw.companions_count ?? 0) as CompanionsCount,
    purposeOfVisit: raw.purposeOfVisit ?? raw.purpose_of_visit ?? raw.purpose,
    status: (raw.status as AppointmentStatus) ?? 'PENDING',
    rejectionReason: raw.rejectionReason ?? raw.rejection_reason ?? null,
    qrToken: raw.qrToken ?? raw.qr_token ?? '',
    qrExpiresAt: raw.qrExpiresAt ?? raw.qr_expires_at ?? '',
    createdAt: raw.createdAt ?? raw.created_at,
    updatedAt: raw.updatedAt ?? raw.updated_at,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const appointmentService = {
  async createAppointment(
    data: CreateAppointmentPayload
  ): Promise<ApiResponse<Appointment>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      const newAppointment: Appointment = {
        id: `appt-${Date.now()}`,
        citizenId: 'citizen-001',
        appointmentDate: data.appointmentDate,
        companionsCount: data.companionsCount,
        purposeOfVisit: data.purposeOfVisit,
        status: 'PENDING',
        rejectionReason: null,
        qrToken: '',
        qrExpiresAt: getMidnight(data.appointmentDate),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      _mockAppointments = [newAppointment, ..._mockAppointments];

      return {
        success: true,
        data: newAppointment,
        message: 'Appointment booked successfully',
      };
    }

    const response = await apiClient.post<ApiResponse<any>>(
      Endpoints.CREATE_APPOINTMENT,
      data
    );

    return {
      ...response.data,
      data: mapBackendToAppointment(response.data.data),
    };
  },

  async getMyAppointments(): Promise<ApiResponse<Appointment[]>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();
      return {
        success: true,
        data: _mockAppointments,
        message: 'Appointments fetched successfully',
      };
    }

    const response = await apiClient.get<ApiResponse<any[]>>(
      Endpoints.GET_APPOINTMENTS
    );

    return {
      ...response.data,
      data: response.data.data.map(mapBackendToAppointment),
    };
  },

  async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      const appointment = _mockAppointments.find((a) => a.id === id);

      if (!appointment) {
        throw {
          success: false,
          message: 'Appointment not found.',
          code: 'NOT_FOUND',
        };
      }

      return {
        success: true,
        data: appointment,
        message: 'Appointment fetched successfully',
      };
    }

    const response = await apiClient.get<ApiResponse<any>>(
      Endpoints.GET_APPOINTMENT_BY_ID(id)
    );

    return {
      ...response.data,
      data: mapBackendToAppointment(response.data.data),
    };
  },
};

export default appointmentService;