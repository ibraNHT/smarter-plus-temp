import { create } from 'zustand';
import { UserRole, type UserSession } from '../types';

type SessionState = {
  user: UserSession | null;
  setUser: (user: UserSession | null) => void;
  clear: () => void;
  isRole: (role: UserRole) => boolean;
};

export const useSessionStore = create<SessionState>((set, get) => ({
  user: null,
  setUser: (user) => set({ user }),
  clear: () => set({ user: null }),
  isRole: (role) => get().user?.role === role,
}));
