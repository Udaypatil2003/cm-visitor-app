export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export interface CitizenUser {
  id: string;
  phone: string;
  fullName: string;
  aadhaarNumber: string;
  dateOfBirth: string;       // ISO date string
  gender: Gender;
  address: string;
  taluka: string;     
  city: string;
  district: string;
  profilePhotoUrl: string;
  fcmToken: string | null;
  createdAt: string;
}

export interface GuardUser {
  id: string;
  username: string;
  fullName: string;
  createdAt: string;
}

export interface OnboardingFormData {
  fullName: string;
  dateOfBirth: string;
  gender: Gender;
  aadhaarNumber: string;
  address: string;
  city: string;
  taluka: string;     
  district: string;
profilePhotoUri?: string;
}