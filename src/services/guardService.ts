import { ApiResponse } from '../types/api.types';
import { QRVerifyPayload, QRVerifyResult } from '../types/guard.types';
import { Config } from '../constants/config';
import { mockDelay, apiClient } from './api';
import * as Endpoints from '../constants/endpoints';

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_VALID_RESULT: QRVerifyResult = {
  isValid: true,
  status: 'APPROVED',
  message: 'Entry approved',
  citizenName: 'Rahul Sharma',
  citizenPhoto: 'https://i.pravatar.cc/150?img=3',
  aadhaarNumber: '123456789012',
  address: '12, Shanti Nagar, Near Bus Stand',
  city: 'Nashik',
  appointmentDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
  companionsCount: 1,
  purposeOfVisit: 'Regarding land record correction and documentation',
};

const MOCK_EXPIRED_RESULT: QRVerifyResult = {
  isValid: false,
  status: 'EXPIRED',
  message: 'This QR code has expired. The appointment date has passed.',
  citizenName: null,
  citizenPhoto: null,
  aadhaarNumber: null,
  address: null,
  city: null,
  appointmentDate: null,
  companionsCount: null,
  purposeOfVisit: null,
};

const MOCK_INVALID_RESULT: QRVerifyResult = {
  isValid: false,
  status: 'INVALID',
  message: 'Invalid QR code. This code was not issued by the system.',
  citizenName: null,
  citizenPhoto: null,
  aadhaarNumber: null,
  address: null,
  city: null,
  appointmentDate: null,
  companionsCount: null,
  purposeOfVisit: null,
};

const MOCK_NOT_APPROVED_RESULT: QRVerifyResult = {
  isValid: false,
  status: 'NOT_APPROVED',
  message: 'This appointment has not been approved yet.',
  citizenName: null,
  citizenPhoto: null,
  aadhaarNumber: null,
  address: null,
  city: null,
  appointmentDate: null,
  companionsCount: null,
  purposeOfVisit: null,
};

// ─── Mapper ───────────────────────────────────────────────────────────────────

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
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      let result: QRVerifyResult;

      switch (token) {
        case 'valid-token':
          result = MOCK_VALID_RESULT;
          break;
        case 'expired-token':
          result = MOCK_EXPIRED_RESULT;
          break;
        case 'not-approved-token':
          result = MOCK_NOT_APPROVED_RESULT;
          break;
        default:
          result = MOCK_INVALID_RESULT;
      }

      return {
        success: true,
        data: result,
        message: result.message,
      };
    }

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