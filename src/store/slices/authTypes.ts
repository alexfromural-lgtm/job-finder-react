import type { User } from '../../types';

// ── State shape ───────────────────────────────────────────────────────────────

export interface AuthState {
  user: User | null;
  isLoading: boolean;
  error: string | null;
}
