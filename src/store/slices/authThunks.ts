import { createAsyncThunk } from '@reduxjs/toolkit';
import type { User, JobSeekerSignupRequest, RecruiterSignupRequest } from '../../types';
import * as AuthApi from '../../api/auth.api';

// ── initAuth ──────────────────────────────────────────────────────────────────

/**
 * Restores the session on app mount by calling GET /auth/me.
 * The accessToken cookie is sent automatically by the browser.
 * If expired, the axios interceptor transparently refreshes it first.
 */
export const initAuth = createAsyncThunk<User | null, AbortSignal | undefined>(
  'auth/init',
  async (signal, { rejectWithValue }) => {
    try {
      return await AuthApi.getMe(signal);
    } catch (err: unknown) {
      const e = err as { code?: string; name?: string };
      if (e?.code === 'ERR_CANCELED' || e?.name === 'AbortError') {
        // Aborted by React 18 StrictMode double-mount — not a real error
        return rejectWithValue('canceled');
      }
      // No active session — this is expected, not an error
      return null;
    }
  }
);

// ── loginThunk ────────────────────────────────────────────────────────────────

/** Logs in the user and fetches their profile. */
export const loginThunk = createAsyncThunk<
  User,
  { email: string; password: string },
  { rejectValue: string }
>('auth/login', async ({ email, password }, { rejectWithValue }) => {
  try {
    await AuthApi.login({ email, password });
    return await AuthApi.getMe();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } };
    return rejectWithValue(e?.response?.data?.error ?? 'Invalid email or password.');
  }
});

// ── logoutThunk ───────────────────────────────────────────────────────────────

/** Logs out the user. */
export const logoutThunk = createAsyncThunk<void, void>('auth/logout', async () => {
  try {
    await AuthApi.logout();
  } catch {
    // Swallow — backend-side logout errors don't affect the client clear
  }
});

// ── signupJobSeekerThunk ──────────────────────────────────────────────────────

/** Signs up a job seeker and immediately hydrates the auth state. */
export const signupJobSeekerThunk = createAsyncThunk<
  User,
  JobSeekerSignupRequest,
  { rejectValue: string }
>('auth/signupJobSeeker', async (data, { rejectWithValue }) => {
  try {
    await AuthApi.signupJobSeeker(data);
    return await AuthApi.getMe();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } };
    return rejectWithValue(e?.response?.data?.error ?? 'Registration failed. Please try again.');
  }
});

// ── signupRecruiterThunk ──────────────────────────────────────────────────────

/** Signs up a recruiter and immediately hydrates the auth state. */
export const signupRecruiterThunk = createAsyncThunk<
  User,
  RecruiterSignupRequest,
  { rejectValue: string }
>('auth/signupRecruiter', async (data, { rejectWithValue }) => {
  try {
    await AuthApi.signupRecruiter(data);
    return await AuthApi.getMe();
  } catch (err: unknown) {
    const e = err as { response?: { data?: { error?: string } } };
    return rejectWithValue(e?.response?.data?.error ?? 'Registration failed. Please try again.');
  }
});
