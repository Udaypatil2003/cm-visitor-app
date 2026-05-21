import { ApiResponse } from '../types/api.types';
import { CitizenUser, OnboardingFormData } from '../types/user.types';
import { Config } from '../constants/config';
import { mockDelay, apiClient } from './api';
import * as Endpoints from '../constants/endpoints';

// ─── Mock Data ────────────────────────────────────────────────────────────────

let _mockProfile: CitizenUser = {
  id: 'citizen-001',
  phone: '9876543210',
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

// ─── Mapper ───────────────────────────────────────────────────────────────────
// When backend is ready, only update this function.
// Internal CitizenUser type never changes.

function mapBackendToCitizenUser(raw: any): CitizenUser {
  return {
    id: raw.id ?? raw._id,
    phone: raw.phone ?? raw.mobile,
    fullName: raw.fullName ?? raw.full_name ?? raw.name,
    aadhaarNumber: raw.aadhaarNumber ?? raw.aadhaar_number ?? raw.aadhaar,
    dateOfBirth: raw.dateOfBirth ?? raw.date_of_birth ?? raw.dob,
    gender: raw.gender,
    address: raw.address,
    city: raw.city,
    district: raw.district,
    profilePhotoUrl: raw.profilePhotoUrl ?? raw.profile_photo_url ?? raw.photo ?? '',
    fcmToken: raw.fcmToken ?? raw.fcm_token ?? null,
    createdAt: raw.createdAt ?? raw.created_at,
  };
}

// ─── Service ──────────────────────────────────────────────────────────────────

const userService = {
  async createProfile(
    data: OnboardingFormData
  ): Promise<ApiResponse<CitizenUser>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      _mockProfile = {
        ..._mockProfile,
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        aadhaarNumber: data.aadhaarNumber,
        address: data.address,
        city: data.city,
        district: data.district,
      };

      return {
        success: true,
        data: _mockProfile,
        message: 'Profile created successfully',
      };
    }

    const response = await apiClient.post<ApiResponse<any>>(
      Endpoints.CREATE_PROFILE,
      {
        fullName: data.fullName,
        dateOfBirth: data.dateOfBirth,
        gender: data.gender,
        aadhaarNumber: data.aadhaarNumber,
        address: data.address,
        city: data.city,
        district: data.district,
      }
    );

    return {
      ...response.data,
      data: mapBackendToCitizenUser(response.data.data),
    };
  },

  async getProfile(): Promise<ApiResponse<CitizenUser>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();
      return {
        success: true,
        data: _mockProfile,
        message: 'Profile fetched successfully',
      };
    }

    const response = await apiClient.get<ApiResponse<any>>(
      Endpoints.GET_PROFILE
    );

    return {
      ...response.data,
      data: mapBackendToCitizenUser(response.data.data),
    };
  },

  async updateProfile(
    data: Partial<OnboardingFormData>
  ): Promise<ApiResponse<CitizenUser>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      _mockProfile = {
        ..._mockProfile,
        ...(data.fullName && { fullName: data.fullName }),
        ...(data.address && { address: data.address }),
        ...(data.city && { city: data.city }),
        ...(data.district && { district: data.district }),
      };

      return {
        success: true,
        data: _mockProfile,
        message: 'Profile updated successfully',
      };
    }

    const response = await apiClient.patch<ApiResponse<any>>(
      Endpoints.UPDATE_PROFILE,
      data
    );

    return {
      ...response.data,
      data: mapBackendToCitizenUser(response.data.data),
    };
  },

  async uploadPhoto(uri: string): Promise<ApiResponse<{ photoUrl: string }>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();

      // Simulate storing the local URI as the photo URL
      _mockProfile = { ..._mockProfile, profilePhotoUrl: uri };

      return {
        success: true,
        data: { photoUrl: uri },
        message: 'Photo uploaded successfully',
      };
    }

    // Real implementation — multipart form upload
    const formData = new FormData();
    const filename = uri.split('/').pop() ?? 'photo.jpg';
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : 'image/jpeg';

    formData.append('photo', { uri, name: filename, type } as any);

    const response = await apiClient.post<ApiResponse<{ photoUrl: string }>>(
      Endpoints.UPLOAD_PHOTO,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return response.data;
  },

  async updateFCMToken(token: string): Promise<ApiResponse<void>> {
    if (Config.IS_MOCK_MODE) {
      await mockDelay();
      _mockProfile = { ..._mockProfile, fcmToken: token };
      return {
        success: true,
        data: undefined as unknown as void,
        message: 'FCM token updated',
      };
    }

    const response = await apiClient.patch<ApiResponse<void>>(
      Endpoints.UPDATE_FCM_TOKEN,
      { fcmToken: token }
    );

    return response.data;
  },
};

export default userService;