import { NavLink, useNavigate } from 'react-router-dom';
import Button from '../ui/Button';
import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '../../store/hooks';
import {
  selectUser,
  selectIsAuthenticated,
  selectIsLoading,
  selectHasRole,
} from '../../store/selectors/authSelectors';
import { logoutThunk } from '../../store/slices/authSlice';

export default function Navbar() {
  const dispatch = useAppDispatch();
  const user = useAppSelector(selectUser);
  const isAuthenticated = useAppSelector(selectIsAuthenticated);
  const isLoading = useAppSelector(selectIsLoading);
  const isJobSeeker = useAppSelector(selectHasRole('JOB_SEEKER'));
  const isRecruiter = useAppSelector(selectHasRole('RECRUITER'));
  const navigate = useNavigate();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await dispatch(logoutThunk()).unwrap();
      navigate('/');
    } catch {
      // logout always clears the client session even if the backend call fails
      navigate('/');
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <nav className="navbar" role="navigation" aria-label="Main navigation">
      <div className="container">
        <div className="navbar-inner">
          {/* Logo */}
          <NavLink to="/" className="navbar-logo" aria-label="JobFinder home">
            ⚡ JobFinder
          </NavLink>

          {/* Desktop links */}
          <div className="navbar-links" style={{ display: 'flex' }}>
            <NavLink
              to="/"
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              end
            >
              Browse Jobs
            </NavLink>

            {isAuthenticated && isJobSeeker && (
              <NavLink
                to="/dashboard/seeker"
                end
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Dashboard
              </NavLink>
            )}

            {isAuthenticated && isJobSeeker && (
              <NavLink
                to="/dashboard/seeker/applications"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Applications
              </NavLink>
            )}

            {isAuthenticated && isJobSeeker && (
              <NavLink
                to="/dashboard/seeker/saved"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                Saved Jobs
              </NavLink>
            )}

            {isAuthenticated && isJobSeeker && (
              <NavLink
                to="/profile/seeker"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Profile
              </NavLink>
            )}

            {isAuthenticated && isRecruiter && (
              <NavLink
                to="/dashboard/recruiter"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Jobs
              </NavLink>
            )}

            {isAuthenticated && isRecruiter && (
              <NavLink
                to="/profile/recruiter"
                className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
              >
                My Profile
              </NavLink>
            )}

            {isLoading ? (
              // Placeholder keeps the navbar height stable while session resolves
              <div style={{ width: 120, height: 32 }} />
            ) : isAuthenticated ? (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  marginLeft: '0.5rem',
                }}
              >
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
