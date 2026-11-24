// ─── SignupPage.tsx ──────────────────────────────────────────────────────────
//
// PURPOSE:
//   Registration page with a tab switcher that toggles between two sign-up
//   flows: Job Seeker (3 fields) and Recruiter (3 + 3 extra company fields).
//   On success, navigates directly to the appropriate dashboard.
//
// DESIGN PATTERN:
//   "Tab switcher with conditional fields" — a `tab` state drives both the
//   active tab UI and which form fields render.  The form is fully controlled:
//   every <input> value is bound to its own useState variable.
//
// DESIGN NOTES:
//   • `useSearchParams` reads ?role=seeker / ?role=recruiter from the URL so
//     the hero CTA buttons ("Get Hired →", "Post a Job") deep-link to the
//     correct tab.
//   • After signup the AuthContext's signupJobSeeker/signupRecruiter methods
//     call getMe() internally, so user state is populated before navigation.
//
// USAGE:
//   Route: /signup  (also /signup?role=recruiter)
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';       // Provides signup methods
import { extractApiError } from '../utils/apiError';   // Normalises API errors
import { Input } from '../components/ui/Input';        // Labelled text input
import Button from '../components/ui/Button';          // Reusable button

// ── Tab type ─────────────────────────────────────────────────────────────────
// A TypeScript union type: `tab` can only ever be one of these two strings.
// Using a named type makes the code self-documenting and prevents typos.
type Tab = 'seeker' | 'recruiter';

export default function SignupPage() {
  // useAuth exposes the two registration methods from AuthContext
  const { signupJobSeeker, signupRecruiter } = useAuth();

  // ── URL query params ──────────────────────────────────────────────────
  // useSearchParams returns a [params, setParams] tuple (like useState).
  // params.get('role') reads the ?role= query string value.
  // We only need the reader, so we destructure just `params`.
  const [params] = useSearchParams();

  // Initialise tab from ?role= URL param, defaulting to 'seeker'.
  // params.get('role') returns null if the param is absent → ?? 'seeker' supplies the default.
  // The `as Tab` cast tells TypeScript the value is 'seeker'|'recruiter', not just string|null.
  const [tab, setTab] = useState<Tab>((params.get('role') as Tab) ?? 'seeker');

  const navigate = useNavigate(); // For redirecting after successful signup

  // ── Shared form fields ────────────────────────────────────────────────
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // ── Recruiter-only form fields ────────────────────────────────────────
  // These are only rendered when tab === 'recruiter'
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [industry, setIndustry] = useState('');

  // ── UI state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ── Form submission ───────────────────────────────────────────────────
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Prevent default browser form submit + page reload

    // ── Client validation ───────────────────────────────────────────────
    if (!name || !email || !password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }
    // Additional recruiter-specific check
    if (tab === 'recruiter' && !companyName) {
      setError('Company name is required for recruiter accounts.');
      return;
    }

    setLoading(true);
    setError(''); // Clear any previous error before the request

    try {
      if (tab === 'seeker') {
        // Job seeker signup — only requires name, email, password
        await signupJobSeeker({ name, email, password });
      } else {
        // Recruiter signup — includes optional company fields
        // companyWebsite || undefined: convert '' to undefined so API ignores it
        await signupRecruiter({
          name,
          email,
          password,
          companyName,
          companyWebsite: companyWebsite || undefined,
          industry: industry || undefined,
        });
      }
      // AuthContext.signupJobSeeker / signupRecruiter calls getMe() internally,
      // populating the user state before we navigate.
      // Redirect to the appropriate dashboard based on the selected tab.
      navigate(tab === 'seeker' ? '/dashboard/seeker' : '/dashboard/recruiter');
    } catch (err) {
      // Show API error (e.g. "Email already in use")
      setError(extractApiError(err, 'Registration failed. Please try again.'));
    } finally {
      setLoading(false); // Always re-enable the button
    }
  };

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div
      className="hero-gradient" // Global CSS: subtle animated gradient background
      style={{
        minHeight: '100vh',  // Fill the full viewport height
        display: 'flex',
        alignItems: 'center',    // Centre the card vertically
        justifyContent: 'center',
        padding: '2rem',
      }}
    >
      {/* ── Form card ─────────────────────────────────────────────── */}
      <div
        className="glass-strong" // Stronger glassmorphism card
        style={{
          width: '100%',
          maxWidth: 480,                          // Constrain card width on large screens
          borderRadius: 'var(--radius-xl)',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-card)',
          animation: 'slideUp 0.3s ease',         // Entrance animation
        }}
      >
        {/* Logo / header */}
        <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>⚡</div>
          <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 800 }}>Create your account</h1>
          <p style={{ margin: '0.5rem 0 0', color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
            Join thousands of professionals on JobFinder
          </p>
        </div>

        {/* ── Tab switcher ─────────────────────────────────────────── */}
        {/*
          A custom pill-style tab component built with two <button> elements.
          The active tab gets a solid primary background; inactive gets transparent.

          (['seeker', 'recruiter'] as Tab[]).map(…)
            Casting the array `as Tab[]` tells TypeScript the elements are of type Tab.
            Without the cast, TypeScript would infer string[] and complain when we
            compare `tab === t` (Tab vs string).
        */}
        <div
          style={{
            display: 'flex',
            background: 'rgba(255,255,255,0.04)', // Subtle inset background
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius-md)',
            padding: 4,              // Small inset so tabs have room to have their own radius
            marginBottom: '1.5rem',
          }}
        >
          {(['seeker', 'recruiter'] as Tab[]).map((t) => (
            <button
              key={t}
              id={`tab-${t}`}
              type="button"           // Prevent form submission when clicking tabs
              onClick={() => {
                setTab(t);            // Switch the active tab
                setError('');         // Clear any existing error on tab change
              }}
              style={{
                flex: 1,             // Both tabs share equal width
                padding: '0.6rem',
                border: 'none',
                borderRadius: 'calc(var(--radius-md) - 4px)', // Slightly smaller than parent
                // Active tab: solid primary colour; inactive: transparent
                background: tab === t ? 'var(--color-primary)' : 'transparent',
                color: tab === t ? '#fff' : 'var(--color-text-muted)',
                fontFamily: 'Inter, sans-serif',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
                transition: 'var(--transition)', // Smooth colour change
              }}
            >
              {/* Conditional emoji + label per tab */}
              {t === 'seeker' ? '👤 Job Seeker' : '🏢 Recruiter'}
            </button>
          ))}
        </div>

        {/* ── Registration form ─────────────────────────────────────── */}
        <form
          onSubmit={handleSubmit}
          noValidate   // Disable browser native validation; we handle it ourselves
          style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
        >
          {/* Show error at top of form when present */}
          {error && <div className="alert alert-error">{error}</div>}

          {/* ── Shared fields (shown for both tabs) ──────────────── */}
          <Input
            id="signup-name"
            label="Full Name *"
            placeholder="John Smith"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"   // Suggests saved names from browser autofill
          />

          <Input
            id="signup-email"
            type="email"           // Shows email keyboard on mobile; enables @ shortcut
            label="Email Address *"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />

          <Input
            id="signup-password"
            type="password"        // Hides characters as the user types
            label="Password * (min. 6 characters)"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password" // Signals to browser not to auto-fill a saved password
          />

          {/* ── Recruiter-only fields ────────────────────────────── */}
          {/*
            Conditional rendering: tab === 'recruiter' && (…)
            When tab is 'seeker' the whole block is hidden from the DOM entirely.

            React Fragment (<>…</>) wraps the multiple children without
            adding a real DOM element.
          */}
          {tab === 'recruiter' && (
            <>
              <hr className="divider" style={{ margin: '0.25rem 0' }} />
              <p
                style={{
                  margin: 0,
                  fontSize: '0.8rem',
                  color: 'var(--color-text-muted)',
                  fontWeight: 600,
                }}
              >
                Company Information
              </p>

              <Input
                id="signup-company"
                label="Company Name *"
                placeholder="Acme Corp"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
              />

              <Input
                id="signup-website"
                type="url"             // Enables URL keyboard on mobile
                label="Company Website"
                placeholder="https://acme.com"
                value={companyWebsite}
                onChange={(e) => setCompanyWebsite(e.target.value)}
              />

              <Input
                id="signup-industry"
                label="Industry"
                placeholder="e.g. Technology, Finance, Healthcare"
                value={industry}
                onChange={(e) => setIndustry(e.target.value)}
              />
            </>
          )}

          {/* Submit button — label changes with the active tab */}
          <Button
            id="signup-submit"
            type="submit"
            variant="primary"
            size="lg"
            loading={loading}
            style={{ width: '100%', marginTop: '0.5rem' }}
          >
            {/* Different CTA copy per tab:
                seeker    → "Start Job Hunting →"
                recruiter → "Start Hiring →"            */}
            {tab === 'seeker' ? 'Start Job Hunting →' : 'Start Hiring →'}
          </Button>
        </form>

        {/* Divider + link to login page */}
        <hr className="divider" />
        <p
          style={{
            textAlign: 'center',
            fontSize: '0.875rem',
            color: 'var(--color-text-muted)',
            margin: 0,
          }}
        >
          Already have an account?{' '}
          {/* <Link> from react-router-dom renders an <a> tag that navigates
              without a full page reload (client-side routing). */}
          <Link to="/login" style={{ color: 'var(--color-primary)', fontWeight: 600 }}>
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}
