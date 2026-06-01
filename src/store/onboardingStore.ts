import { create } from 'zustand';
import { OnboardingFormData, Gender } from '../types/user.types';

const TOTAL_STEPS = 4;

const initialFormData: OnboardingFormData = {
  fullName: '',
  dateOfBirth: '',
  gender: 'MALE',
  aadhaarNumber: '',
  address: '',
  city: '',
  district: '',
  taluka: '',      
  profilePhotoUri: '',
};

interface OnboardingState {
  formData: OnboardingFormData;
  currentStep: number;    // 1-indexed, 1 to 4
  isSubmitting: boolean;

  // Actions
  updateField: <K extends keyof OnboardingFormData>(
    field: K,
    value: OnboardingFormData[K]
  ) => void;
  updateStep1: (data: Pick<OnboardingFormData, 'fullName' | 'dateOfBirth' | 'gender'>) => void;
  updateStep2: (data: Pick<OnboardingFormData, 'aadhaarNumber'>) => void;
updateStep3: (
  data: Pick<OnboardingFormData, 'address' | 'city' | 'district' | 'taluka'>
) => void;
  updateStep4: (data: Pick<OnboardingFormData, 'profilePhotoUri'>) => void;
  nextStep: () => void;
  prevStep: () => void;
  setSubmitting: (submitting: boolean) => void;
  resetForm: () => void;
  isFirstStep: () => boolean;
  isLastStep: () => boolean;
}

export const useOnboardingStore = create<OnboardingState>((set, get) => ({
  formData: initialFormData,
  currentStep: 1,
  isSubmitting: false,

  updateField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),

  updateStep1: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  updateStep2: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  updateStep3: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  updateStep4: (data) =>
    set((state) => ({
      formData: { ...state.formData, ...data },
    })),

  nextStep: () =>
    set((state) => ({
      currentStep: Math.min(state.currentStep + 1, TOTAL_STEPS),
    })),

  prevStep: () =>
    set((state) => ({
      currentStep: Math.max(state.currentStep - 1, 1),
    })),

  setSubmitting: (submitting) => set({ isSubmitting: submitting }),

  resetForm: () =>
    set({ formData: initialFormData, currentStep: 1, isSubmitting: false }),

  isFirstStep: () => get().currentStep === 1,
  isLastStep: () => get().currentStep === TOTAL_STEPS,
}));