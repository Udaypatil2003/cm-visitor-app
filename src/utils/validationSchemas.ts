import { z } from 'zod';
import { Config } from '../constants/config';

export const phoneSchema = z.object({
  phone: z
    .string()
    .min(10, 'Enter a valid 10-digit mobile number')
    .max(10, 'Enter a valid 10-digit mobile number')
    .regex(/^[6-9]\d{9}$/, 'Enter a valid Indian mobile number'),
});

export const otpSchema = z.object({
  otp: z
    .string()
    .length(6, 'OTP must be 6 digits')
    .regex(/^\d{6}$/, 'OTP must contain only digits'),
});

export const guardLoginSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username too long'),
  password: z
    .string()
    .min(4, 'Password must be at least 4 characters')
    .max(100, 'Password too long'),
});

export const onboardingStep1Schema = z.object({
  fullName: z
    .string()
    .min(3, 'Full name must be at least 3 characters')
    .max(100, 'Full name too long')
    .regex(/^[a-zA-Z\s]+$/, 'Full name can only contain letters and spaces'),
  dateOfBirth: z
    .string()
    .min(1, 'Date of birth is required')
    .refine((val) => {
      const dob = new Date(val);
      const today = new Date();
      const age = today.getFullYear() - dob.getFullYear();
      return age >= 18 && age <= 120;
    }, 'You must be at least 18 years old'),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER'], {
    message: 'Please select a gender' ,
  }),
});

export const onboardingStep2Schema = z.object({
  aadhaarNumber: z
    .string()
    .length(12, 'Aadhaar number must be 12 digits')
    .regex(/^\d{12}$/, 'Aadhaar number must contain only digits'),
});

export const onboardingStep3Schema = z.object({
  address: z
    .string()
    .min(10, 'Please enter a complete address')
    .max(255, 'Address too long'),
  city: z
    .string()
    .min(2, 'City name too short')
    .max(100, 'City name too long'),
  taluka: z
    .string()
    .min(2, 'Taluka name too short')
    .max(100, 'Taluka name too long'),
  district: z
    .string()
    .min(2, 'District name too short')
    .max(100, 'District name too long'),
});

export const onboardingStep4Schema = z.object({
  profilePhotoUri: z.string().optional().default(''),
});

export const onboardingSchema = onboardingStep1Schema
  .merge(onboardingStep2Schema)
  .merge(onboardingStep3Schema)
  .merge(onboardingStep4Schema);


export const bookAppointmentSchema = z.object({
  appointmentDate: z
    .string()
    .min(1, 'Please select a date')
    .refine((val) => {
      const selected = new Date(val);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selected.setHours(0, 0, 0, 0);
      return selected >= today;
    }, 'Cannot book a past date'),
  companionsCount: z.union([z.literal(0), z.literal(1), z.literal(2)]),
  purposeOfVisit: z
    .string()
    .min(Config.MIN_PURPOSE_LENGTH, `Purpose must be at least ${Config.MIN_PURPOSE_LENGTH} characters`)
    .max(500, 'Purpose too long'),
     whomToVisit: z.string().trim().min(1, "Please specify whom you wish to meet."),    // make .optional() to relax
  referenceName: z.string().trim().min(1, "Please enter a reference."),              // make .optional() to relax
  vehicleNumber: z.string().trim().max(15).optional().or(z.literal("")), 
});

// Inferred types for use with react-hook-form
export type PhoneFormData = z.infer<typeof phoneSchema>;
export type OTPFormData = z.infer<typeof otpSchema>;
export type GuardLoginFormData = z.infer<typeof guardLoginSchema>;
export type OnboardingStep1Data = z.infer<typeof onboardingStep1Schema>;
export type OnboardingStep2Data = z.infer<typeof onboardingStep2Schema>;
export type OnboardingStep3Data = z.infer<typeof onboardingStep3Schema>;
export type OnboardingStep4Data = z.infer<typeof onboardingStep4Schema>;
export type BookAppointmentFormData = z.infer<typeof bookAppointmentSchema>;