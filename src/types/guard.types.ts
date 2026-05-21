export interface QRVerifyPayload {
  token: string;
}

export interface QRVerifyResult {
  isValid: boolean;
  status: 'APPROVED' | 'EXPIRED' | 'INVALID' | 'NOT_APPROVED';
  message: string;
  citizenName: string | null;
  citizenPhoto: string | null;
  aadhaarNumber: string | null;
  address: string | null;
  city: string | null;
  appointmentDate: string | null;
  companionsCount: number | null;
  purposeOfVisit: string | null;
}