// ─── ApplicationsPage.tsx ────────────────────────────────────────────────────
//
// PURPOSE:
//   Shows a job seeker's complete application history with status stats at the
//   top and a withdrawable list below.  Uses the ApplicationsList component for
//   the actual rows.
//
// DESIGN PATTERN:
//   "Lift state up": the page owns the `applications` array; ApplicationsList
//   calls `onWithdraw(id)` to tell the page to remove that item, keeping state
//   in one authoritative place.
//
//   "Derived state" (no extra useState): submitted/shortlisted/underReview are
//   computed on every render from the `applications` array — no separate state
//   variable needed. React re-renders are fast enough for small arrays.
//
// USAGE:
//   Route: /applications (protected, JOB_SEEKER only)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';          // For user.name
import { getMyApplications } from '../../api/applications.api'; // GET /applications/mine
import { extractApiError } from '../../utils/apiError';
import type { Application } from '../../types';
import ApplicationsList from '../../components/jobs/ApplicationsList'; // List component
import Button from '../../components/ui/Button';

export default function ApplicationsPage() {
  const { user } = useAuth();     // We only need user.name for the subtitle
  const navigate = useNavigate();

  // ── State ─────────────────────────────────────────────────────────────
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // ── Fetch applications ─────────────────────────────────────────────────
  // Runs once on mount.  AbortController cancels the request on unmount.
  useEffect(() => {
    const controller = new AbortController();
    getMyApplications(controller.signal)
      .then(setApplications)
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return; // Ignore abort errors
        setError(extractApiError(err, 'Failed to load your applications.'));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []); // [] = run once on mount

  // ── Withdraw callback ─────────────────────────────────────────────────
  // Called by ApplicationsList when the user confirms a withdrawal.
  // We use a functional update: (prev) => prev.filter(…) so we always
  // operate on the latest state rather than a stale closure.
  const handleWithdraw = (id: string) => {
    setApplications((prev) => prev.filter((a) => a.id !== id));
  };

  // ── Derived stats ─────────────────────────────────────────────────────
  // .filter(predicate).length counts matching elements without storing them.
  // These re-compute on every render — React is fast enough for small arrays.
  //
  // Example: applications = [{status:'submitted'}, {status:'shortlisted'}]
  //   submitted   = 1
  //   shortlisted = 1
  //   underReview = 0
  const submitted = applications.filter((a) => a.status === 'submitted').length;
  const shortlisted = applications.filter((a) => a.status === 'shortlisted').length;
  const underReview = applications.filter((a) => a.status === 'under_review').length;

  return (
    <div className="page hero-gradient">
      <div className="container">

        {/* ── Header card ───────────────────────────────────────────── */}
        <div
          className="glass-strong"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            marginBottom: '2rem',
            animation: 'slideUp 0.3s ease',
          }}
        >
          {/* Top row: title/subtitle + stats */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              flexWrap: 'wrap',
              gap: '1rem',
            }}
          >
            <div>
              <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 800 }}>
                My Applications
              </h1>
              {/*
                user?.name?.split(' ')[0]
                  user?.name  → safe access (user might be null during load)
                  .split(' ') → ["John", "Smith"]
                  [0]         → "John"   (first name only)
              */}
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {user?.name?.split(' ')[0]}'s job applications
              </p>
            </div>

            {/* Stats row: each Stat is a small coloured counter box */}
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              {/* Total = all applications; uses primary colour */}
              <Stat label="Total" value={applications.length} color="var(--color-primary)" />
              <Stat label="Submitted" value={submitted} color="var(--color-primary)" />
              <Stat label="In Review" value={underReview} color="#f59e0b" /> {/* amber */}
              <Stat label="Shortlisted" value={shortlisted} color="#22c55e" /> {/* green */}
            </div>
          </div>

          {/* Nav buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Button
              id="back-to-dashboard-btn"
              variant="ghost"
              size="sm"
              onClick={() => navigate('/dashboard/seeker')}
            >
              ← Back to Dashboard
            </Button>
            <Button id="browse-jobs-btn" variant="primary" size="sm" onClick={() => navigate('/')}>
              Browse Jobs →
            </Button>
          </div>
        </div>

        {/* Error alert (shown above the list if fetch failed) */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/*
          ApplicationsList handles its own loading + empty states.
          onWithdraw is the callback that removes a row from this page's state.
        */}
        <ApplicationsList
          applications={applications}
          loading={loading}
          onWithdraw={handleWithdraw}
        />
      </div>
    </div>
  );
}

// ─── Stat sub-component ───────────────────────────────────────────────────────
// A small coloured counter box used in the header stats strip.
// Defined in the same file because it's only used here and is very small.
//
// Props are typed inline with the function signature — a quick alternative to
// a separate `interface` declaration when the component is local.
function Stat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      className="glass"  // Glassmorphism card
      style={{
        padding: '0.75rem 1.25rem',
        borderRadius: 'var(--radius-md)',
        textAlign: 'center',
        minWidth: 72,  // Minimum width so single-digit numbers don't look cramped
      }}
    >
      {/* Number (large, coloured) */}
      <div style={{ fontSize: '1.4rem', fontWeight: 800, color }}>{value}</div>
      {/* Label (small, muted) */}
      <div style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}>
        {label}
      </div>
    </div>
  );
}
