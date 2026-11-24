// ─── pages/NotFoundPage.tsx — 404 Page ────────────────────────────────────────
//
// Renders when no other route matches the current URL.
// Registered as the catch-all route in App.tsx: <Route path="*" element={<NotFoundPage />} />
//
// A good 404 page:
//   • Clearly communicates the page doesn't exist
//   • Gives the user a way out (a link back to home)
//   • Has a memorable visual (the big "404" number)

import { Link } from 'react-router-dom';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NotFoundPage() {
  // Set the browser tab title to "Page Not Found | Job Finder"
  usePageTitle('Page Not Found');

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '80vh',    // occupy 80% of viewport height for centering
        gap: '1.25rem',
        textAlign: 'center',
        padding: '2rem',
        fontFamily: 'system-ui, sans-serif',
      }}
    >
      {/* Big "404" number — the indigo color (#4f46e5) makes it eye-catching */}
      <h1 style={{ fontSize: '6rem', fontWeight: 700, margin: 0, lineHeight: 1, color: '#4f46e5' }}>
        404
      </h1>

      <h2 style={{ fontSize: '1.5rem', fontWeight: 600, margin: 0 }}>Page Not Found</h2>

      {/* &apos; and &apos; are HTML entities for apostrophes.
          Needed inside JSX to avoid confusion with the quote characters used in JSX attributes. */}
      <p style={{ color: '#6b7280', maxWidth: '360px', margin: 0 }}>
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>

      {/* Link — a client-side navigation link (no page reload).
          Styled to look like a button with inline styles. */}
      <Link
        to="/"
        style={{
          marginTop: '0.5rem',
          padding: '0.75rem 1.5rem',
          background: '#4f46e5',
          color: '#fff',
          borderRadius: '8px',
          textDecoration: 'none',    // remove default underline
          fontWeight: 500,
        }}
      >
        Go Home
      </Link>
    </div>
  );
}
