export type AppointmentStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
export type CompanionsCount = 0 | 1 | 2;

export interface Appointment {
  id: string;
  citizenId: string;
  appointmentDate: string;       // ISO date string, date only
  companionsCount: CompanionsCount;
  purposeOfVisit: string;
  whomToVisit: string;           // NEW — required
  referenceName: string;         // NEW — required (person who referred)
  vehicleNumber: string | null;  // NEW — optional, null when not provided
  status: AppointmentStatus;
  rejectionReason: string | null;
  qrToken: string;
  qrExpiresAt: string;
  createdAt: string;
  updatedAt: string;
}


export interface CreateAppointmentPayload {
  appointmentDate: string;
  companionsCount: CompanionsCount;
  purposeOfVisit: string;
  whomToVisit: string;           // NEW
  referenceName: string;         // NEW
 vehicleNumber?: string; 
}