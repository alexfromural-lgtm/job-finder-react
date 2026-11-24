// ─── pages/LoginPage.tsx — Login Form Page ───────────────────────────────────
//
// A centered login form. After successful login, redirects to the user's
// role-specific dashboard.
//
// Pattern: "Controlled form" — all input values live in React state.
// Every keystroke calls a state setter, keeping the state as the single source
// of truth. The form never reads directly from the DOM.
//
// Key concepts demonstrated:
//   • useAuth() — calls the login function and checks role for redirect
//   • useNavigate() — programmatic redirect after login
//   • usePageTitle() — sets "Sign In | Job Finder" in the browser tab
//   • extractApiError() — converts server/network errors to user-friendly strings
//   • e.preventDefault() — stops form from doing a full-page POST submit

import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { extractApiError } from '../utils/apiError';
import { usePageTitle } from '../hooks/usePageTitle';
import { Input } from '../components/ui/Input';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login, hasRole } = useAuth(); // get login function + role checker
  const navigate = useNavigate();
  usePageTitle('Sign In'); // → "Sign In | Job Finder"

  // Controlled form state: each field has its own useState.
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    // e.preventDefault() stops the browser from submitting the form natively.
    // Without this, the page would reload on form submit.
    e.preventDefault();

    // Client-side validation: check required fields before hitting the server.
    if (!email || !password) {
      setError('Please fill in all fields.');
      return; // early return stops the function here
    }

    setLoading(true);
    setError('');

    try {
      // login() calls POST /auth/login + GET /auth/me, then sets user state.
      await login(email, password);

      // After login, hasRole() now returns the correct value.
      // Redirect to the appropriate dashboard based on role.
      if (hasRole('RECRUITER')) {
        navigate('/dashboard/recruiter');
      } else if (hasRole('JOB_SEEKER')) {
        navigate('/dashboard/seeker');
      } else {
        navigate('/'); // fallback for ADMIN or unknown roles
      }
    } catch (err) {
      // extractApiError converts the AxiosError to a human-readable string.
      // 'Invalid email or password.' is the fallback if the error is unknown.
      setError(extractApiError(err, 'Invalid email or password.'));
    } finally {
      setLoading(false); // always reset the spinner
    }
  };

  return (
    // Centered full-screen layout
    <div className="hero-gradient" style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
      {/* glass-strong: frosted glass card */}
      <div className="glass-strong" style={{ width: '100%', maxWidth: 420, borderRadius: 'var(--radius-xl)', padding: '2.5rem', boxShadow: 'var(--shadow-card)', animation: 'slideUp 0.3s ease' }}>
        {/* Logo / branding */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Welcome back</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Sign in to your JobFinder account
          </p>
        </div>

        {/* Login form */}
        <form onSubmit={handleSubmit} noValidate style={{ display: 'flex', flexDirection: 'column', gap: '1.1rem' }}>
          {/* noValidate: disables native browser validation so we control it ourselves */}

          {/* Error alert — only shown when error is a non-empty string */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* Email input using our reusable Input component */}
          <Input
            id="login-email"
            type="email"
            label="Email address"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)} // update state on every keystroke
            autoComplete="email"  // browser autofill hint
            autoFocus             // focus this field when the page loads
          />

          <Input
            id="login-password"
            type="password"       // masks the input text
            label="Password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />

          <Button
            id="login-submit"
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}   // shows spinner + disables button during API call
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            Sign In
          </Button>
        </form>

        <hr className="divider" />

        {/* Link to signup page */}
        <p style={{ textAlign: 'center', fontSize: '0.875rem', color: 'var(--color-text-muted)', margin: 0 }}>
          Don't have an account?{' '}
          {/* Link from react-router-dom — no page reload (SPA navigation) */}
          <Link to="/signup" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign up free
          </Link>
        </p>
      </div>
    </div>
  );
}
