// ─── context/AuthContext.tsx — Authentication State (React Context) ───────────
//
// React Context is a way to share state across the entire component tree
// without passing props through every intermediate component ("prop drilling").
//
// This context provides:
//   • user         — the currently logged-in User object (or null)
//   • isLoading    — true while we're checking if a session exists on mount
//   • isAuthenticated — shorthand for user !== null
//   • hasRole()    — checks if the user has a specific role
//   • login / logout / signupJobSeeker / signupRecruiter — auth actions
//
// Usage in any component below <AuthProvider>:
//   const { user, isAuthenticated, hasRole } = useAuth();
//   if (hasRole('RECRUITER')) { /* show recruiter-only UI */ }

import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { User, Role, JobSeekerSignupRequest, RecruiterSignupRequest } from '../types';
import * as AuthApi from '../api/auth.api';

// ── Context Shape Definition ──────────────────────────────────────────────────
// This interface describes everything the context provides.
// Components call useAuth() to get this object.

interface AuthContextValue {
  user: User | null;                    // null = not logged in
  isLoading: boolean;                   // true = session check in progress
  isAuthenticated: boolean;             // !!user shorthand
  hasRole: (role: Role) => boolean;     // e.g. hasRole('JOB_SEEKER')
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  signupJobSeeker: (data: JobSeekerSignupRequest) => Promise<void>;
  signupRecruiter: (data: RecruiterSignupRequest) => Promise<void>;
}

// createContext — creates the context object.
// The initial value is null (typed as AuthContextValue | null).
// We'll throw an error in useAuth() if someone uses it outside <AuthProvider>.
const AuthContext = createContext<AuthContextValue | null>(null);

// ── Provider Component ────────────────────────────────────────────────────────
// Wrap <AuthProvider> around your app (done in main.tsx) to inject the context.
// { children } is the JSX content passed between the opening and closing tags.
//
// Example:
//   <AuthProvider>
//     <App />  ← "children"
//   </AuthProvider>

export function AuthProvider({ children }: { children: ReactNode }) {
  // useState<User | null>(null) — user starts as null (not logged in).
  // When we call setUser(me), all components reading useAuth().user re-render.
  const [user, setUser] = useState<User | null>(null);

  // isLoading starts as true so ProtectedRoute doesn't redirect before we
  // know whether a session exists. Set to false after the /auth/me check.
  const [isLoading, setIsLoading] = useState(true);

  // ── hasRole ───────────────────────────────────────────────────────────────
  // useCallback memoises the function — only recreates it when `user` changes.
  // Without this, every render would create a new function reference, which
  // would unnecessarily re-render any component that receives it as a prop.
  //
  // user?.roles.includes(role) — optional chaining: safe if user is null.
  // ?? false — if user is null, the whole expression evaluates to false.
  //
  // Example:
  //   hasRole('JOB_SEEKER')  // true if user.roles includes 'JOB_SEEKER'
  const hasRole = useCallback((role: Role) => user?.roles.includes(role) ?? false, [user]);

  // ── login ─────────────────────────────────────────────────────────────────
  const login = useCallback(async (email: string, password: string) => {
    // Backend sets accessToken + refreshToken cookies; just fetch the user profile
    await AuthApi.login({ email, password });
    // After login, fetch the user object so the whole app knows who's logged in.
    const me = await AuthApi.getMe();
    setUser(me);
  }, []);

  // ── logout ────────────────────────────────────────────────────────────────
  const logout = useCallback(async () => {
    try {
      await AuthApi.logout(); // backend clears both cookies
    } finally {
      // Clear local state even if the logout request fails.
      // 'finally' always runs (like a Java/Python finally block).
      setUser(null);
    }
  }, []);

  // ── signupJobSeeker ───────────────────────────────────────────────────────
  /**
   * Signs up a job seeker and immediately hydrates the auth context.
   * This ensures the user is "logged in" right after signup without
   * a separate login step.
   */
  const signupJobSeeker = useCallback(async (data: JobSeekerSignupRequest) => {
    await AuthApi.signupJobSeeker(data);
    // The backend sets auth cookies during signup — call getMe() to hydrate state.
    const me = await AuthApi.getMe();
    setUser(me);
  }, []);

  /**
   * Signs up a recruiter and immediately hydrates the auth context.
   */
  const signupRecruiter = useCallback(async (data: RecruiterSignupRequest) => {
    await AuthApi.signupRecruiter(data);
    const me = await AuthApi.getMe();
    setUser(me);
  }, []);

  // ── Session Restore on Mount ──────────────────────────────────────────────
  // On mount: attempt to restore session by calling /auth/me.
  // The browser sends the accessToken cookie automatically.
  // If the token is expired, the axios interceptor will transparently refresh it.
  //
  // useEffect(() => { ... }, []) — the [] means "run once after first render".
  //
  // AbortController: creates a signal we can pass to async calls to cancel them.
  // When the cleanup function runs (on unmount), controller.abort() cancels the
  // in-flight request, preventing setState calls on an unmounted component.
  useEffect(() => {
    const controller = new AbortController();
    AuthApi.getMe(controller.signal)
      .then((me) => setUser(me))
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return; // ignore aborted requests
        setUser(null);
      })
      .finally(() => {
        // Only clear the loading flag if this effect instance was NOT aborted.
        // In React 18 StrictMode, the first mount is immediately unmounted and
        // its controller is aborted. Setting isLoading=false on that aborted
        // request would make ProtectedRoute redirect to /login before the
        // second (real) request completes.
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      });

    // Cleanup function — runs when the component unmounts or the effect re-runs.
    return () => controller.abort();
  }, []);

  // ── Listen for 401 Events from the Axios Interceptor ─────────────────────
  // When the token refresh also fails (axiosClient dispatches 'auth:unauthorized'),
  // we clear the user state so the UI shows the login screen.
  //
  // Why a custom event instead of a direct call?
  // axiosClient.ts can't import AuthContext (circular dependency).
  // The event acts as a decoupled communication channel.
  useEffect(() => {
    const handleUnauthorized = () => setUser(null);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    // Cleanup: remove listener when this effect is cleaned up.
    return () => window.removeEventListener('auth:unauthorized', handleUnauthorized);
  }, []);

  // ── Render ────────────────────────────────────────────────────────────────
  // AuthContext.Provider makes the value available to all children via useAuth().
  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user, // !! converts null → false, User → true
        hasRole,
        login,
        logout,
        signupJobSeeker,
        signupRecruiter,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

// ── useAuth Hook ──────────────────────────────────────────────────────────────
// Custom hook that reads the AuthContext. Components call this instead of
// useContext(AuthContext) directly.
//
// The guard (if (!ctx)) ensures a helpful error message if someone forgets
// to wrap their app in <AuthProvider>.
//
// eslint-disable-next-line react-refresh/only-export-components
export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within <AuthProvider>');
  return ctx;
}
