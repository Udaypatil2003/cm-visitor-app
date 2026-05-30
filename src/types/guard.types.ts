export interface QRVerifyPayload {
  qrtoken: string; // ← real API field name (was: token)
}

export type QRFailReason = 'EXPIRED' | 'NOT_APPROVED' | 'INVALID';

export interface QRVerifyResult {
  isValid: boolean;                              // derived in service mapper
  status: 'APPROVED' | 'EXPIRED' | 'INVALID' | 'NOT_APPROVED';
  message: string;
  failReason: QRFailReason | null;               // derived in service mapper

  // Flat citizen + appointment fields (matches real API .data shape)
  username: string | null;
  fullname: string | null;
  mobilenumber: string | null;
  visitorphoto: string | null;
  aadharnumber: string | null;
  city: string | null;
  address: string | null;
  appointmentdate: string | null;
  companionscount: number | null;
  purposeofvisit: string | null;
    whomtovisit?: string | null;
  referencename?: string | null;
  vehiclenumber?: string | null;
}

export interface GuardBookVisitorPayload {
  mobilenumber:   string;
  username:       string;
  password:       string;
  appointmentDate: string;
  companionsCount: number;
  purposeOfVisit:  string;
  referenceName?:  string;
  vehicleNumber?:  string;
  photoUri?:       string;   // local file URI from image picker
}
