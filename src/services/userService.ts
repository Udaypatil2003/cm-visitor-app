import { ApiResponse } from "../types/api.types";
import { CitizenUser, OnboardingFormData } from "../types/user.types";
import { apiClient } from "./api";
import * as Endpoints from "../constants/endpoints";

// ─── Raw API shape from backend ───────────────────────────────────────────────
// Backend returns citizen object with dual naming — snake_case fields are
// always null, lowercase fields have real values. Never change internal types
// to match this — only this mapper changes when backend changes.

// Remove all snake_case fields from RawCitizenFromAPI — only keep plain fields
interface RawCitizenFromAPI {
  id: number;
  username: string;
  mobilenumber: string;
  fullname: string | null;
  aadharnumber: string | null;
  dateofbirth: string | null;
  gender: string | null;
  address: string | null;
  city: string | null;
  district: string | null;
  profilephotourl: string | null;
  fcmtoken: string | null;
  created_at: string;
  updated_at: string;
}

function mapBackendToCitizenUser(raw: RawCitizenFromAPI): CitizenUser {
  return {
    id: String(raw.id),
    phone: raw.mobilenumber ?? "",
    fullName: raw.fullname ?? "",
    aadhaarNumber: raw.aadharnumber ?? "",
    dateOfBirth: raw.dateofbirth ?? "",
    gender: normalizeGender(raw.gender),
    address: raw.address ?? "",
    city: raw.city ?? "",
    district: raw.district ?? "",
    profilePhotoUrl: raw.profilephotourl ?? "",
    fcmToken: raw.fcmtoken ?? null,
    createdAt: raw.created_at,
  };
}

function normalizeGender(raw: string | null): CitizenUser["gender"] {
  if (!raw) return "OTHER";
  const g = raw.toUpperCase();
  if (g === "MALE") return "MALE";
  if (g === "FEMALE") return "FEMALE";
  return "OTHER";
}

// ─── Service ──────────────────────────────────────────────────────────────────

const userService = {
  async createProfile(
    data: OnboardingFormData,
  ): Promise<ApiResponse<CitizenUser>> {
    // Request body uses backend's field names (confirmed from Postman)
    const response = await apiClient.post<{
      success: boolean;
      message: string;
      citizen: RawCitizenFromAPI;
    }>(Endpoints.CREATE_PROFILE, {
      fullname: data.fullName,
      aadharnumber: data.aadhaarNumber,
      dateofbirth: data.dateOfBirth,
      gender: data.gender.toLowerCase(),
      address: data.address,
      city: data.city,
      district: data.district,
    });

    return {
      success: response.data.success,
      data: mapBackendToCitizenUser(response.data.citizen),
      message: response.data.message,
    };
  },

  async getProfile(): Promise<ApiResponse<CitizenUser>> {
    const response = await apiClient.get<{
      success: boolean;
      message: string;
      citizen: RawCitizenFromAPI;
    }>(Endpoints.GET_PROFILE);

    return {
      success: response.data.success,
      data: mapBackendToCitizenUser(response.data.citizen),
      message: response.data.message,
    };
  },

  async updateProfile(
    data: Partial<OnboardingFormData>,
  ): Promise<ApiResponse<CitizenUser>> {
    // Only send fields that are present — PATCH semantics
    const payload: Record<string, string> = {};
    if (data.fullName) payload.fullname = data.fullName;
    if (data.aadhaarNumber) payload.aadharnumber = data.aadhaarNumber;
    if (data.dateOfBirth) payload.dateofbirth = data.dateOfBirth;
    if (data.gender) payload.gender = data.gender.toLowerCase();
    if (data.address) payload.address = data.address;
    if (data.city) payload.city = data.city;
    if (data.district) payload.district = data.district;

    const response = await apiClient.patch<{
      success: boolean;
      message: string;
      citizen: RawCitizenFromAPI;
    }>(Endpoints.UPDATE_PROFILE, payload);

    return {
      success: response.data.success,
      data: mapBackendToCitizenUser(response.data.citizen),
      message: response.data.message,
    };
  },

  // AFTER
  async uploadPhoto(uri: string): Promise<ApiResponse<{ photoUrl: string }>> {
    const formData = new FormData();
    const filename = uri.split("/").pop() ?? "photo.jpg";
    const match = /\.(\w+)$/.exec(filename);
    const type = match ? `image/${match[1]}` : "image/jpeg";

    formData.append("photo", { uri, name: filename, type } as any);

    const response = await apiClient.post<{
      success: boolean;
      message: string;
      photourl: string; // ← backend returns flat + lowercase key
    }>(Endpoints.UPLOAD_PHOTO, formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    // Map flat backend shape → internal ApiResponse shape
    return {
      success: response.data.success,
      message: response.data.message,
      data: { photoUrl: response.data.photourl }, // ← normalize the key
    };
  },

  async updateFCMToken(token: string): Promise<ApiResponse<void>> {
    const response = await apiClient.patch<ApiResponse<void>>(
      Endpoints.UPDATE_FCM_TOKEN,
      { fcmToken: token },
    );
    return response.data;
  },
};

export default userService;
