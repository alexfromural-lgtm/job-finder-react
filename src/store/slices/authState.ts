import type { AuthState } from './authTypes';

// ── Initial state ─────────────────────────────────────────────────────────────

export const initialState: AuthState = {
  user: null,
  isLoading: true, // true on startup so ProtectedRoute waits for session restore
  error: null,
};
