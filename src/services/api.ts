import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import * as SecureStore from 'expo-secure-store';
import { Config } from '../constants/config';
import { ApiError } from '../types/api.types';

export const apiClient = axios.create({
  baseURL: Config.BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  },
});

// Request interceptor — attach Bearer token
apiClient.interceptors.request.use(
  async (config: InternalAxiosRequestConfig) => {
    try {
      const token = await SecureStore.getItemAsync(Config.TOKEN_STORAGE_KEY);
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch {
      // SecureStore read failed — proceed without token
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor — handle 401 and normalize errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError<ApiError>) => {
    if (error.response?.status === 401) {
      // Clear stored credentials on 401
      try {
        await SecureStore.deleteItemAsync(Config.TOKEN_STORAGE_KEY);
        await SecureStore.deleteItemAsync(Config.ROLE_STORAGE_KEY);
      } catch {
        // ignore
      }
      // Navigation to login is handled by RootNavigator reacting to authStore
    }

    const apiError: ApiError = {
      success: false,
      message:
        error.response?.data?.message ||
        (error.code === 'ECONNABORTED' ? 'Request timed out. Please try again.' : null) ||
        (error.message === 'Network Error' ? 'No internet connection. Please check your network.' : null) ||
        'Something went wrong. Please try again.',
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
    };

    return Promise.reject(apiError);
  }
);

/**
 * Helper — artificial delay for mock services
 */
export function mockDelay(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, Config.MOCK_DELAY_MS));
}