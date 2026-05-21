import { create } from 'zustand';
import { Appointment } from '../types/appointment.types';

interface AppointmentState {
  appointments: Appointment[];
  selectedAppointment: Appointment | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  setAppointments: (list: Appointment[]) => void;
  setSelected: (appointment: Appointment | null) => void;
  addAppointment: (appointment: Appointment) => void;
  updateAppointment: (updated: Appointment) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  clearError: () => void;
  reset: () => void;

  // Derived selectors (call as functions)
  getUpcoming: () => Appointment[];
  getPast: () => Appointment[];
  getNextApproved: () => Appointment | undefined;
}

export const useAppointmentStore = create<AppointmentState>((set, get) => ({
  appointments: [],
  selectedAppointment: null,
  isLoading: false,
  error: null,

  setAppointments: (list) => set({ appointments: list }),

  setSelected: (appointment) => set({ selectedAppointment: appointment }),

  addAppointment: (appointment) =>
    set((state) => ({
      appointments: [appointment, ...state.appointments],
    })),

  updateAppointment: (updated) =>
    set((state) => ({
      appointments: state.appointments.map((a) =>
        a.id === updated.id ? updated : a
      ),
      selectedAppointment:
        state.selectedAppointment?.id === updated.id
          ? updated
          : state.selectedAppointment,
    })),

  setLoading: (loading) => set({ isLoading: loading }),

  setError: (error) => set({ error }),

  clearError: () => set({ error: null }),

  reset: () =>
    set({
      appointments: [],
      selectedAppointment: null,
      isLoading: false,
      error: null,
    }),

  /**
   * Appointments today or in the future, sorted nearest first
   */
  getUpcoming: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return get()
      .appointments
      .filter((a) => {
        const d = new Date(a.appointmentDate);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .sort(
        (a, b) =>
          new Date(a.appointmentDate).getTime() -
          new Date(b.appointmentDate).getTime()
      );
  },

  /**
   * Appointments strictly before today, sorted most recent first
   */
  getPast: () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return get()
      .appointments
      .filter((a) => {
        const d = new Date(a.appointmentDate);
        d.setHours(0, 0, 0, 0);
        return d < today;
      })
      .sort(
        (a, b) =>
          new Date(b.appointmentDate).getTime() -
          new Date(a.appointmentDate).getTime()
      );
  },

  /**
   * Next upcoming APPROVED appointment (the one to show QR for)
   */
  getNextApproved: () => {
    return get()
      .getUpcoming()
      .find((a) => a.status === 'APPROVED');
  },
}));