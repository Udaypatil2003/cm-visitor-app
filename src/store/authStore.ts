import { create } from 'zustand';
import * as SecureStore from 'expo-secure-store';
import { CitizenUser, GuardUser } from '../types/user.types';
import { Config } from '../constants/config';

type UserRole = 'citizen' | 'guard';

interface AuthState {
  citizenUser: CitizenUser | null;
  guardUser: GuardUser | null;
  role: UserRole | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  token: string | null;

  // Actions
  setCitizenUser: (user: CitizenUser) => void;
  setGuardUser: (user: GuardUser) => void;
  setToken: (token: string, role: UserRole) => Promise<void>;
  setLoading: (loading: boolean) => void;
  hydrateFromStorage: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  citizenUser: null,
  guardUser: null,
  role: null,
  isAuthenticated: false,
  isLoading: true,   // true on boot — SplashScreen waits for hydration
  token: null,

  // Always call setToken() before this — token must be persisted first

  setCitizenUser: (user) =>
    set({ citizenUser: user, role: 'citizen', isAuthenticated: true }),

  setGuardUser: (user) =>
    set({ guardUser: user, role: 'guard', isAuthenticated: true }),

  setToken: async (token, role) => {
    try {
      await SecureStore.setItemAsync(Config.TOKEN_STORAGE_KEY, token);
      await SecureStore.setItemAsync(Config.ROLE_STORAGE_KEY, role);
    } catch {
      // SecureStore write failed — token lives in memory only this session
    }
    set({ token, role, isAuthenticated: true });
  },

  setLoading: (loading) => set({ isLoading: loading }),

  /**
   * Called once on app boot from SplashScreen.
   * Reads token + role from SecureStore to restore session.
   */
  hydrateFromStorage: async () => {
    set({ isLoading: true });
    try {
      const token = await SecureStore.getItemAsync(Config.TOKEN_STORAGE_KEY);
      const role = await SecureStore.getItemAsync(Config.ROLE_STORAGE_KEY) as UserRole | null;

      if (token && role) {
        set({ token, role, isAuthenticated: true });
      } else {
        set({ isAuthenticated: false });
      }
    } catch {
      set({ isAuthenticated: false });
    } finally {
      set({ isLoading: false });
    }
  },

  logout: async () => {
    try {
      await SecureStore.deleteItemAsync(Config.TOKEN_STORAGE_KEY);
      await SecureStore.deleteItemAsync(Config.ROLE_STORAGE_KEY);
    } catch {
      // ignore — clear store regardless
    }
    set({
      citizenUser: null,
      guardUser: null,
      role: null,
      isAuthenticated: false,
      token: null,
    });
  },
}));