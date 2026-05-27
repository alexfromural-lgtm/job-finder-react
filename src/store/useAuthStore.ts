import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { User, Role, JobSeekerSignupRequest, RecruiterSignupRequest } from '../types';
import * as AuthApi from '../api/auth.api';

// ── State shape ────────────────────────────────────────────────────────────────

interface AuthState {
  user: User | null;
  isLoading: boolean;
  // Derived
  isAuthenticated: boolean;
  hasRole: (role: Role) => boolean;
  // Actions
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signupJobSeeker: (data: JobSeekerSignupRequest) => Promise<void>;
  signupRecruiter: (data: RecruiterSignupRequest) => Promise<void>;
  /**
   * Restores the session on app start by calling GET /auth/me.
   * Designed to be called once outside the React tree (in main.tsx)
   * using `useAuthStore.getState().restoreSession()` — no Provider needed.
   */
  restoreSession: (signal?: AbortSignal) => Promise<void>;
}

// ── Store factory (extracted so we can wrap with devtools conditionally) ───────

const storeFactory = (
  set: (partial: Partial<AuthState> | ((s: AuthState) => Partial<AuthState>)) => void,
  get: () => AuthState
): AuthState => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // ── Derived getters ──────────────────────────────────────────────────────────
  hasRole: (role: Role) => get().user?.roles.includes(role) ?? false,

  // ── Actions ──────────────────────────────────────────────────────────────────
  login: async (email, password) => {
    await AuthApi.login({ email, password });
    const me = await AuthApi.getMe();
    set({ user: me, isAuthenticated: me !== null });
  },

  logout: async () => {
    try {
      await AuthApi.logout();
    } finally {
      set({ user: null, isAuthenticated: false });
    }
  },

  signupJobSeeker: async (data) => {
    await AuthApi.signupJobSeeker(data);
    const me = await AuthApi.getMe();
    set({ user: me, isAuthenticated: me !== null });
  },

  signupRecruiter: async (data) => {
    await AuthApi.signupRecruiter(data);
    const me = await AuthApi.getMe();
    set({ user: me, isAuthenticated: me !== null });
  },

  restoreSession: async (signal?: AbortSignal) => {
    try {
      const me = await AuthApi.getMe(signal);
      if (!signal?.aborted) set({ user: me, isAuthenticated: me !== null, isLoading: false });
    } catch (err: unknown) {
      const e = err as { code?: string; name?: string };
      // Ignore intentional aborts (React 18 StrictMode double-mount)
      if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError' || e?.name === 'CanceledError') {
        return;
      }
      if (!signal?.aborted) set({ user: null, isAuthenticated: false, isLoading: false });
    }
  },
});

// ── Create store — devtools only in development ────────────────────────────────

export const useAuthStore = import.meta.env.DEV
  ? create<AuthState>()(devtools(storeFactory, { name: 'AuthStore' }))
  : create<AuthState>()(storeFactory);
