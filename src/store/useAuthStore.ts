import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { AuthState } from './authTypes';
import { storeFactory } from './authActions';

// ── Re-exports (public surface — keeps all existing imports unbroken) ───────────
export type { AuthState } from './authTypes';

// ── Create store — devtools only in development ────────────────────────────────

export const useAuthStore = import.meta.env.DEV
  ? create<AuthState>()(devtools(storeFactory, { name: 'AuthStore' }))
  : create<AuthState>()(storeFactory);
