import { create } from 'zustand';

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  gorev?: string;
  role: string;
  avatar?: string;
  xp: number;
  level: number;
}

interface AuthStore {
  user: User | null;
  setUser: (user: User | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    set({ user: null });
  },
}));
