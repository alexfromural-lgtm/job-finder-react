import * as AuthApi from '../api/auth.api';
import type { AuthState } from './authTypes';

// ── Store factory (extracted so we can wrap with devtools conditionally) ───────

export const storeFactory = (
  set: (partial: Partial<AuthState> | ((s: AuthState) => Partial<AuthState>)) => void,
  get: () => AuthState
): AuthState => ({
  user: null,
  isLoading: true,
  isAuthenticated: false,

  // ── Derived getters ──────────────────────────────────────────────────────────
  hasRole: (role) => get().user?.roles.includes(role) ?? false,

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
