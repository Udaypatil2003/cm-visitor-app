// AUTH
export const REQUEST_OTP = "/auth/citizen/request-otp";
export const VERIFY_OTP = "/auth/citizen/verify-otp";
export const CITIZEN_REGISTER = "/auth/citizen/register"; // ← NEW
export const CITIZEN_LOGIN = "/auth/citizen/login";
export const GUARD_LOGIN = "/auth/guard/login";
export const REFRESH_TOKEN = "/auth/refresh-token";
export const LOGOUT = "/auth/logout";

// CITIZEN PROFILE
export const CREATE_PROFILE = "/citizen/profile";
export const GET_PROFILE = "/citizen/profile";
export const UPDATE_PROFILE = "/citizen/profile";
export const UPLOAD_PHOTO = "/citizen/profile/photo";

// APPOINTMENTS
export const CREATE_APPOINTMENT = "/appointments";
export const GET_APPOINTMENTS = "/appointments";
export const GET_APPOINTMENT_BY_ID = (id: string) => `/appointments/${id}`;

// GUARD
export const VERIFY_QR = "/guard/verify-qr";

// NOTIFICATIONS
export const UPDATE_FCM_TOKEN = "/citizen/fcm-token";
