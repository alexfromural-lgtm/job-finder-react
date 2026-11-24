// ─── components/layout/Navbar.tsx — Top Navigation Bar ───────────────────────
//
// The persistent navigation bar shown on every page of the app.
// It reads auth state to show role-appropriate links.
//
// Nav links shown based on role:
//   Everyone:          Browse Jobs
//   JOB_SEEKER:        My Dashboard, My Applications, Saved Jobs, My Profile
//   RECRUITER:         My Jobs, My Profile
//   Authenticated:     User name + Logout button
//   Not authenticated: Login + Sign Up buttons
//
// NavLink (from react-router-dom) automatically adds 'active' class to the
// link matching the current URL — no manual active state needed.

import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Button from '../ui/Button';
import { useState } from 'react';

export default function Navbar() {
  // Destructure only what this component needs from auth context.
  // user = the User object (for displaying the name)
  // isAuthenticated = shorthand for user !== null
  // isLoading = true while session check is in-flight (avoid flickering)
  // logout = async function that clears the session
  // hasRole = checks if user has a specific role
  const { user, isAuthenticated, isLoading, logout, hasRole } = useAuth();

  // useNavigate: programmatic navigation (like a redirect from code, not JSX).
  // Example: navigate('/login') → go to the login page
  const navigate = useNavigate();

  // Local state for the logout button's loading spinner.
  // We don't use auth's isLoading here because that tracks session init, not logout.
  const [loggingOut, setLoggingOut] = useState(false);

  // handleLogout: triggers the logout API call, then redirects home.
  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout(); // calls POST /auth/logout, clears cookies, sets user=null
      navigate('/');  // go to home page after logout
    } finally {
      setLoggingOut(false); // reset spinner even if logout fails
    }
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo / Brand link — NavLink goes to "/" */}
          <NavLink to="/" className="navbar-logo" aria-label="JobFinder home">
            ⚡ JobFinder
          </NavLink>

          {/* Navigation links */}
          <div className="navbar-links" style={{ display: 'flex' }}>
            {/* Browse Jobs — always visible */}
            <NavLink
              to="/"
              // The className prop can be a function that receives { isActive }.
              // This is a React Router v6 pattern for active link styling.
              // ({ isActive }) => `nav-link ${isActive ? 'active' : ''}`
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end // 'end' ensures "/" only matches exactly "/" not all paths
            >
              Browse Jobs
            </NavLink>

            {/* JOB_SEEKER links — only shown when logged in as a seeker */}
            {/* isAuthenticated && hasRole('JOB_SEEKER') && <JSX>
                Short-circuit: renders JSX only when BOTH conditions are true */}
            {isAuthenticated && hasRole('JOB_SEEKER') && (
              <NavLink
                to="/dashboard/seeker"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Dashboard
              </NavLink>
            )}

            {isAuthenticated && hasRole('JOB_SEEKER') && (
              <NavLink
                to="/dashboard/seeker/applications"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Applications
              </NavLink>
            )}

            {isAuthenticated && hasRole('JOB_SEEKER') && (
              <NavLink
                to="/dashboard/seeker/saved"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Saved Jobs
              </NavLink>
            )}

            {isAuthenticated && hasRole('JOB_SEEKER') && (
              <NavLink
                to="/profile/seeker"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Profile
              </NavLink>
            )}

            {/* RECRUITER links */}
            {isAuthenticated && hasRole('RECRUITER') && (
              <NavLink
                to="/dashboard/recruiter"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Jobs
              </NavLink>
            )}

            {isAuthenticated && hasRole('RECRUITER') && (
              <NavLink
                to="/profile/recruiter"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Profile
              </NavLink>
            )}

            {/* Auth buttons — right side of the navbar.
                Three cases handled with nested ternaries:
                  1. isLoading → invisible placeholder (keeps navbar height stable)
                  2. isAuthenticated → user name + Logout button
                  3. not authenticated → Login + Sign Up buttons */}
            {isLoading ? (
              // Placeholder keeps the navbar height stable while session resolves.
              // Without this, the navbar would jump in height after auth loads.
              <div style={{ width: 120, height: 32 }} />
            ) : isAuthenticated ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginLeft: '0.5rem' }}>
                {/* Show first name — user?.name is optional chaining (safe if null) */}
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  👤 {user?.name}
                </span>
                <Button
                  id="logout-btn"
                  variant="secondary"
                  size="sm"
                  loading={loggingOut}
                  onClick={handleLogout}
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div style={{ display: 'flex', gap: '0.5rem', marginLeft: '0.5rem' }}>
                <Button
                  id="nav-login-btn"
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/login')}
                >
                  Login
                </Button>
                <Button
                  id="nav-signup-btn"
                  variant="primary"
                  size="sm"
                  onClick={() => navigate('/signup')}
                >
                  Sign Up
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
