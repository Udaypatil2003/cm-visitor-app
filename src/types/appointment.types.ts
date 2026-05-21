export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CompanionsCount = 0 | 1 | 2;

export interface Appointment {
  id: string;
  citizenId: string;
  appointmentDate: string;       // ISO date string, date only
  companionsCount: CompanionsCount;
  purposeOfVisit: string;
  status: AppointmentStatus;
  rejectionReason: string | null;
  qrToken: string;               // signed JWT from backend
  qrExpiresAt: string;           // midnight of appointmentDate
  createdAt: string;
  updatedAt: string;
}

export interface CreateAppointmentPayload {
  appointmentDate: string;
  companionsCount: CompanionsCount;
  purposeOfVisit: string;
}