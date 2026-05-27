import type { User, Role, JobSeekerSignupRequest, RecruiterSignupRequest } from '../types';

// ── State shape ────────────────────────────────────────────────────────────────

export interface AuthState {
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
