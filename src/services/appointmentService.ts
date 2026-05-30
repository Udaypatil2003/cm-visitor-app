import { ApiResponse } from "../types/api.types";
import {
  Appointment,
  AppointmentStatus,
  CreateAppointmentPayload,
  CompanionsCount,
} from "../types/appointment.types";
import { apiClient } from "./api";
import * as Endpoints from "../constants/endpoints";
import { getMidnight } from "../utils/dateUtils";
import { GuardBookVisitorPayload } from "../types/guard.types";

// ─── Mapper ───────────────────────────────────────────────────────────────────
// Update field names here once backend appointment response shape is confirmed.

function mapBackendToAppointment(raw: any): Appointment {
  return {
    id: String(raw.id),
    citizenId: String(raw.citizenid ?? raw.citizen_id),
    appointmentDate: raw.appointmentdate ?? raw.appointment_date,
    companionsCount: (raw.companionscount ??
      raw.companions_count ??
      0) as CompanionsCount,
    purposeOfVisit: raw.purposeofvisit ?? raw.purpose_of_visit ?? "",
    whomToVisit: raw.whomtovisit ?? raw.whom_to_visit ?? "",                 // NEW
    referenceName: raw.referencename ?? raw.reference_name ?? "",            // NEW
    vehicleNumber: raw.vehiclenumber ?? raw.vehicle_number ?? null,          // NEW
    status: (raw.status as AppointmentStatus) ?? "PENDING",
    rejectionReason: raw.rejectionreason ?? raw.rejection_reason ?? null,
    qrToken: raw.qrtoken ?? raw.qr_token ?? "",
    qrExpiresAt:
      raw.qrexpiresat ??
      raw.qr_expires_at ??
      getMidnight(raw.appointmentdate ?? raw.appointment_date),
    createdAt: raw.created_at,
    updatedAt: raw.updated_at,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const appointmentService = {
  async getMyAppointments(): Promise<ApiResponse<Appointment[]>> {
    const response = await apiClient.get<any>(Endpoints.GET_APPOINTMENTS);
    return {
      success: response.data.success,
      message: response.data.message ?? "",
      data: (response.data.appointments ?? []).map(mapBackendToAppointment),
    };
  },

  async getAppointmentById(id: string): Promise<ApiResponse<Appointment>> {
    const response = await apiClient.get<any>(
      Endpoints.GET_APPOINTMENT_BY_ID(id),
    );
    return {
      success: response.data.success,
      message: response.data.message ?? "",
      data: mapBackendToAppointment(response.data.appointment),
    };
  },

  async createAppointment(
    data: CreateAppointmentPayload,
  ): Promise<ApiResponse<Appointment>> {
    // Backend expects lowercase flat keys — map before sending
    const payload = {
      appointmentdate: data.appointmentDate,
      companionscount: data.companionsCount,
      purposeofvisit: data.purposeOfVisit,
      whomtovisit: data.whomToVisit,                  // NEW
      referencename: data.referenceName,              // NEW
      vehiclenumber: data.vehicleNumber ?? null,      // NEW
    };

    const response = await apiClient.post<any>(
      Endpoints.CREATE_APPOINTMENT,
      payload,
    );
    return {
      success: response.data.success,
      message: response.data.message ?? "",
      data: mapBackendToAppointment(response.data.appointment),
    };
  },

  async guardBookVisitor(
  data: GuardBookVisitorPayload,
): Promise<ApiResponse<Appointment>> {
  // multipart/form-data — axios sets boundary automatically when passed FormData
  const form = new FormData();
  form.append('mobilenumber',    data.mobilenumber);
  form.append('username',        data.username);
  form.append('password',        data.password);
  form.append('appointmentdate', data.appointmentDate);
  form.append('companionscount', String(data.companionsCount));
  form.append('purposeofvisit',  data.purposeOfVisit);
  if (data.referenceName) form.append('referencename', data.referenceName);
  if (data.vehicleNumber) form.append('vehiclenumber', data.vehicleNumber);
  if (data.photoUri) {
    const filename = data.photoUri.split('/').pop() ?? 'photo.jpg';
    const ext      = /\.(\w+)$/.exec(filename)?.[1] ?? 'jpeg';
    form.append('photo', {
      uri:  data.photoUri,
      name: filename,
      type: `image/${ext}`,
    } as any);
  }

  const response = await apiClient.post<any>(
    Endpoints.GUARD_BOOK_VISITOR,
    form,
    { headers: { 'Content-Type': 'multipart/form-data' } },
  );

  return {
    success: response.data.success,
    message: response.data.message ?? '',
    data:    mapBackendToAppointment(response.data.appointment),
  };
},
};

export default appointmentService;
