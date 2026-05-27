import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './authState';
import {
  initAuth,
  loginThunk,
  logoutThunk,
  signupJobSeekerThunk,
  signupRecruiterThunk,
} from './authThunks';

// ── Slice ─────────────────────────────────────────────────────────────────────

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    /**
     * Called by the `auth:unauthorized` window event (axios interceptor fires
     * this when the refresh token is also expired/invalid).
     */
    clearUser(state) {
      state.user = null;
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // ── initAuth ──────────────────────────────────────────────────────────────
    builder
      .addCase(initAuth.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(initAuth.fulfilled, (state, action) => {
        // Only clear loading if the request was NOT aborted (StrictMode safety)
        state.user = action.payload;
        state.isLoading = false;
      })
      .addCase(initAuth.rejected, (state, action) => {
        if (action.payload === 'canceled') {
          // Aborted by StrictMode double-mount — keep isLoading=true so the
          // second (real) mount can resolve it.
          return;
        }
        state.user = null;
        state.isLoading = false;
      });

    // ── loginThunk ────────────────────────────────────────────────────────────
    builder
      .addCase(loginThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Login failed.';
      });

    // ── logoutThunk ───────────────────────────────────────────────────────────
    builder
      .addCase(logoutThunk.pending, (state) => {
        state.error = null;
      })
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
      })
      .addCase(logoutThunk.rejected, (state) => {
        // Still clear the user on the client even if backend call failed
        state.user = null;
      });

    // ── signupJobSeekerThunk ──────────────────────────────────────────────────
    builder
      .addCase(signupJobSeekerThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupJobSeekerThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signupJobSeekerThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Signup failed.';
      });

    // ── signupRecruiterThunk ──────────────────────────────────────────────────
    builder
      .addCase(signupRecruiterThunk.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(signupRecruiterThunk.fulfilled, (state, action) => {
        state.user = action.payload;
        state.isLoading = false;
        state.error = null;
      })
      .addCase(signupRecruiterThunk.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload ?? 'Signup failed.';
      });
  },
});

export const { clearUser } = authSlice.actions;
export default authSlice.reducer;

// ── Re-exports for external consumers ─────────────────────────────────────────

export {
  initAuth,
  loginThunk,
  logoutThunk,
  signupJobSeekerThunk,
  signupRecruiterThunk,
} from './authThunks';
export type { AuthState } from './authTypes';
