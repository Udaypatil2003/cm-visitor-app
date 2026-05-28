import { ApiResponse } from '../types/api.types';
import { CitizenUser, GuardUser } from '../types/user.types';
import { apiClient } from './api';
import * as Endpoints from '../constants/endpoints';

// ─── Request / Response Shapes ────────────────────────────────────────────────

export interface RegisterPayload {
  username: string;
  mobilenumber: string;
  password: string;
}

export interface LoginPayload {
  username: string;
  password: string;
}

interface RequestOTPResponse {
  message: string;
}

interface VerifyOTPResponse {
  token: string;
  isNewUser: boolean;
  user: CitizenUser | null;
}

interface CitizenAuthResponse {
  token: string;
  isNewUser: boolean;
  user: CitizenUser;
}

interface GuardLoginResponse {
  token: string;
  guard: GuardUser;
}

interface RefreshTokenResponse {
  token: string;
}

// ─── Raw API shape from backend ───────────────────────────────────────────────
// Register returns minimal object (id, username, mobilenumber only).
// Login returns full object. All profile fields optional to handle both.

interface RawCitizenFromAPI {
  id: number;
  username: string;
  mobilenumber: string;
  fullname?: string | null;
  aadharnumber?: string | null;
  dateofbirth?: string | null;
  gender?: string | null;
  address?: string | null;
  city?: string | null;
  district?: string | null;
  profilephotourl?: string | null;
  fcmtoken?: string | null;
  created_at: string;
  updated_at: string;
}

interface RawGuardFromAPI {
  id: number;
  username: string;
  fullname: string;   // backend sends lowercase 'n'
}



// ─── Mapper ───────────────────────────────────────────────────────────────────
// Only place in the codebase where backend field names appear.
// Internal types never change — only this function changes when backend changes.

function mapRawCitizenToUser(raw: RawCitizenFromAPI): CitizenUser {
  return {
    id: String(raw.id),
    phone: raw.mobilenumber ?? '',
    fullName: raw.fullname ?? '',
    aadhaarNumber: raw.aadharnumber ?? '',
    dateOfBirth: raw.dateofbirth ?? '',
    gender: normalizeGender(raw.gender ?? null),
    address: raw.address ?? '',
    city: raw.city ?? '',
    district: raw.district ?? '',
    profilePhotoUrl: raw.profilephotourl ?? '',
    fcmToken: raw.fcmtoken ?? null,
    createdAt: raw.created_at,
  };
}

function normalizeGender(raw: string | null): CitizenUser['gender'] {
  if (!raw) return 'OTHER';
  const g = raw.toUpperCase();
  if (g === 'MALE') return 'MALE';
  if (g === 'FEMALE') return 'FEMALE';
  return 'OTHER';
}

// Citizen needs onboarding if fullname has never been set
function isNewCitizen(raw: RawCitizenFromAPI): boolean {
  return !raw.fullname || raw.fullname.trim() === '';
}

function mapRawGuardToUser(raw: RawGuardFromAPI): GuardUser {
  return {
    id: String(raw.id),
    username: raw.username,
    fullName: raw.fullname,   // map backend 'fullname' → internal 'fullName'
    createdAt: '',            // backend doesn't return this field yet
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const authService = {

  async registerCitizen(
    payload: RegisterPayload
  ): Promise<ApiResponse<CitizenAuthResponse>> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      token: string;
      citizen: RawCitizenFromAPI;
    }>(Endpoints.CITIZEN_REGISTER, payload);

    const { token, citizen } = response.data;
    return {
      success: true,
      data: {
        token,
        isNewUser: true, // register always → onboarding
        user: mapRawCitizenToUser(citizen),
      },
      message: response.data.message,
    };
  },

  async loginCitizen(
    payload: LoginPayload
  ): Promise<ApiResponse<CitizenAuthResponse>> {
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      token: string;
      citizen: RawCitizenFromAPI;
    }>(Endpoints.CITIZEN_LOGIN, payload);

    const { token, citizen } = response.data;
    return {
      success: true,
      data: {
        token,
        isNewUser: isNewCitizen(citizen),
        user: mapRawCitizenToUser(citizen),
      },
      message: response.data.message,
    };
  },

  async requestOTP(phone: string): Promise<ApiResponse<RequestOTPResponse>> {
    const response = await apiClient.post<ApiResponse<RequestOTPResponse>>(
      Endpoints.REQUEST_OTP,
      { phone }
    );
    return response.data;
  },

  async verifyOTP(
    phone: string,
    otp: string
  ): Promise<ApiResponse<VerifyOTPResponse>> {
    const response = await apiClient.post<ApiResponse<VerifyOTPResponse>>(
      Endpoints.VERIFY_OTP,
      { phone, otp }
    );
    return response.data;
  },

async guardLogin(
  username: string,
  password: string
): Promise<ApiResponse<GuardLoginResponse>> {
  const response = await apiClient.post<{
    success: boolean;
    message: string;
    token: string;
    guard: RawGuardFromAPI;   // flat response, no 'data' wrapper
  }>(Endpoints.GUARD_LOGIN, { username, password });

  return {
    success: true,
    data: {
      token: response.data.token,
      guard: mapRawGuardToUser(response.data.guard),
    },
    message: response.data.message,
  };
},

  async logout(): Promise<void> {
    try {
      await apiClient.post(Endpoints.LOGOUT);
    } catch {
      // Non-fatal — local state cleared regardless
    }
  },

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      Endpoints.REFRESH_TOKEN
    );
    return response.data;
  },
};

export default authService;