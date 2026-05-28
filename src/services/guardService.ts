import { ApiResponse } from '../types/api.types';
import { QRVerifyPayload, QRVerifyResult, QRFailReason } from '../types/guard.types';
import { apiClient } from './api';
import * as Endpoints from '../constants/endpoints';

// ─── Mapper ───────────────────────────────────────────────────────────────────

function mapBackendToQRVerifyResult(raw: any, topLevel: any): QRVerifyResult {
  const isValid   = topLevel.success === true && topLevel.result === 'APPROVED';
  const status    = topLevel.result ?? 'INVALID';
  const failReason: QRFailReason | null = isValid ? null : (status as QRFailReason);

  return {
    isValid,
    status,
    message:         topLevel.message   ?? '',
    failReason,

    // real API data fields
    username:        raw.username        ?? null,
    fullname:        raw.fullname        ?? null,
    mobilenumber:    raw.mobilenumber    ?? null,
    visitorphoto:    raw.visitorphoto    ?? null,
    aadharnumber:    raw.aadharnumber    ?? null,
    address:         raw.address         ?? null,
    city:            raw.city            ?? null,
    appointmentdate: raw.appointmentdate ?? null,
    companionscount: raw.companionscount ?? null,
    purposeofvisit:  raw.purposeofvisit  ?? null,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const guardService = {
  async verifyQR(token: string): Promise<ApiResponse<QRVerifyResult>> {
    const payload: QRVerifyPayload = { qrtoken: token }; // ← fixed field name

    const response = await apiClient.post<any>(
      Endpoints.VERIFY_QR,
      payload
    );

    const raw = response.data; // { success, result, message, data: {...} }

    return {
      success: raw.success,
      message: raw.message,
      data:    mapBackendToQRVerifyResult(raw.data ?? {}, raw),
    };
  },
};

export default guardService;