import { ApiResponse } from '../types/api.types';
import { CitizenUser, GuardUser } from '../types/user.types';
import { Config } from '../constants/config';
import { mockDelay, apiClient } from './api';
import * as SecureStore from 'expo-secure-store';
import * as Endpoints from '../constants/endpoints';

interface RequestOTPResponse {
  message: string;
}

interface VerifyOTPResponse {
  token: string;
  isNewUser: boolean;
  user: CitizenUser | null;
}

interface GuardLoginResponse {
  token: string;
  guard: GuardUser;
}

interface RefreshTokenResponse {
  token: string;
}

// ─── Mock Data ────────────────────────────────────────────────────────────────

const MOCK_CITIZEN: CitizenUser = {
  id: 'citizen-001',
  phone: '',                        // filled dynamically on verifyOTP
  fullName: 'Rahul Sharma',
  aadhaarNumber: '123456789012',
  dateOfBirth: '1990-05-15',
  gender: 'MALE',
  address: '12, Shanti Nagar, Near Bus Stand',
  city: 'Nashik',
  district: 'Nashik',
  profilePhotoUrl: 'https://i.pravatar.cc/150?img=3',
  fcmToken: null,
  createdAt: new Date().toISOString(),
};

const MOCK_GUARD: GuardUser = {
  id: 'guard-001',
  username: 'guard01',
  fullName: 'Suresh Patil',
  createdAt: new Date().toISOString(),
};

// Track first-time OTP verify per phone across the session
const _verifiedPhones = new Set<string>();

// ─── Service ──────────────────────────────────────────────────────────────────

const authService = {
  async requestOTP(phone: string): Promise<ApiResponse<RequestOTPResponse>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();
      return {
        success: true,
        data: { message: `OTP sent to ${phone}` },
        message: 'OTP sent successfully',
      };
    }

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
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      // Any 6-digit OTP passes in mock mode
      if (!/^\d{6}$/.test(otp)) {
        throw {
          success: false,
          message: 'Invalid OTP. Please enter the 6-digit code.',
          code: 'INVALID_OTP',
        };
      }

      const isNewUser = !_verifiedPhones.has(phone);
      _verifiedPhones.add(phone);

      const user: CitizenUser | null = isNewUser
        ? null
        : { ...MOCK_CITIZEN, phone };

      return {
        success: true,
        data: {
          token: `mock-citizen-jwt-token-${phone}`,
          isNewUser,
          user,
        },
        message: 'OTP verified successfully',
      };
    }

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
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      if (username !== 'guard01' || password !== '1234') {
        throw {
          success: false,
          message: 'Invalid username or password.',
          code: 'INVALID_CREDENTIALS',
        };
      }

      return {
        success: true,
        data: {
          token: 'mock-guard-jwt-token',
          guard: MOCK_GUARD,
        },
        message: 'Login successful',
      };
    }

    const response = await apiClient.post<ApiResponse<GuardLoginResponse>>(
      Endpoints.GUARD_LOGIN,
      { username, password }
    );
    return response.data;
  },

  async logout(): Promise<void> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();
      return;
    }

    try {
      await apiClient.post(Endpoints.LOGOUT);
    } catch {
      // Logout API failure is non-fatal — local state is cleared regardless
    }
  },

  async refreshToken(): Promise<ApiResponse<RefreshTokenResponse>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();
      return {
        success: true,
        data: { token: 'mock-refreshed-jwt-token' },
        message: 'Token refreshed',
      };
    }

    const response = await apiClient.post<ApiResponse<RefreshTokenResponse>>(
      Endpoints.REFRESH_TOKEN
    );
    return response.data;
  },
};

export default authService;