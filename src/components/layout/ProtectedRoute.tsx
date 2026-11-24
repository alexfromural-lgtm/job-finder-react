// ─── components/layout/ProtectedRoute.tsx — Route Guard ──────────────────────
//
// A "wrapper component" that protects pages from unauthorized access.
// Used in App.tsx to wrap routes that require authentication or a specific role.
//
// Three checks happen in order:
//   1. Still loading auth state? → show a spinner (don't redirect yet)
//   2. Not authenticated? → redirect to /login
//   3. Wrong role? → redirect to / (home)
//   4. All good? → render the protected page
//
// Usage in App.tsx:
//   <ProtectedRoute requiredRole="JOB_SEEKER">
//     <JobSeekerDashboard />
//   </ProtectedRoute>

import { Navigate } from 'react-router-dom';
import type { ReactNode } from 'react';
import { useAuth } from '../../context/AuthContext';
import type { Role } from '../../types';

interface ProtectedRouteProps {
  children: ReactNode;      // the page to render if access is granted
  requiredRole?: Role;      // optional role check (omit to allow any authenticated user)
  redirectTo?: string;      // where to send unauthenticated users (default: /login)
}

export default function ProtectedRoute({
  children,
  requiredRole,
  redirectTo = '/login',    // default redirect if not authenticated
}: ProtectedRouteProps) {
  // Destructure only what we need from auth context.
  const { isAuthenticated, isLoading, hasRole } = useAuth();

  // ── Check 1: Still loading ─────────────────────────────────────────────────
  // On first render, AuthContext fires a GET /auth/me request to restore session.
  // While that's in-flight, isLoading = true. We show a spinner instead of
  // redirecting — otherwise logged-in users would briefly see the login page.
  //
  // Example: User refreshes /dashboard/seeker
  //   isLoading = true → show spinner
  //   getMe() completes → isLoading = false, isAuthenticated = true → show dashboard
  if (isLoading) {
    return (
      <div className="spinner-page">
        <div className="spinner" style={{ width: 32, height: 32 }} />
      </div>
    );
  }

  // ── Check 2: Not authenticated ─────────────────────────────────────────────
  // <Navigate to="/login" replace /> redirects to the login page.
  // `replace` means this redirect replaces the current history entry.
  // This prevents the user from pressing Back to return to the protected page.
  if (!isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  // ── Check 3: Wrong role ────────────────────────────────────────────────────
  // If a requiredRole is specified and the user doesn't have it, redirect home.
  // Example: a JOB_SEEKER trying to access /dashboard/recruiter → redirect to /
  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/" replace />;
  }

  // ── All checks passed → render the protected content ──────────────────────
  // <>{children}</> is a React Fragment — a wrapper with no DOM output.
  // We use it to return the children without adding an extra <div>.
  return <>{children}</>;
}
