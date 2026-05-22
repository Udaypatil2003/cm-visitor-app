import { ApiResponse } from '../types/api.types';
import { QRVerifyPayload, QRVerifyResult } from '../types/guard.types';
import { apiClient } from './api';
import * as Endpoints from '../constants/endpoints';

// ─── Mapper ───────────────────────────────────────────────────────────────────
// Update field names here once backend QR verify response shape is confirmed.

function mapBackendToQRVerifyResult(raw: any): QRVerifyResult {
  return {
    isValid: raw.isValid ?? raw.is_valid ?? false,
    status: raw.status,
    message: raw.message,
    citizenName: raw.citizenName ?? raw.citizen_name ?? null,
    citizenPhoto: raw.citizenPhoto ?? raw.citizen_photo ?? raw.photo ?? null,
    aadhaarNumber: raw.aadhaarNumber ?? raw.aadhaar_number ?? null,
    address: raw.address ?? null,
    city: raw.city ?? null,
    appointmentDate: raw.appointmentDate ?? raw.appointment_date ?? null,
    companionsCount: raw.companionsCount ?? raw.companions_count ?? null,
    purposeOfVisit: raw.purposeOfVisit ?? raw.purpose_of_visit ?? null,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const guardService = {
  async verifyQR(token: string): Promise<ApiResponse<QRVerifyResult>> {
    const payload: QRVerifyPayload = { token };

    const response = await apiClient.post<ApiResponse<any>>(
      Endpoints.VERIFY_QR,
      payload
    );

    return {
      ...response.data,
      data: mapBackendToQRVerifyResult(response.data.data),
    };
  },
};

export default guardService;