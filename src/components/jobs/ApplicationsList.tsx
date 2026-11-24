// ─── ApplicationsList.tsx ────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders a vertical list of job applications for a job seeker.
//   Each row shows job info, a status badge, the applied date, and a Withdraw
//   action with a two-step confirm flow ("Withdraw" → "Withdraw?" Yes / No).
//
// DESIGN PATTERN:
//   "Two-state row" UI: each application card can independently be in one of
//   two modes — "idle" (shows Withdraw button) or "confirm" (shows Yes/No).
//   We track both via a single `confirmId` state string — only one row at a
//   time can be in confirm mode.
//   A second `withdrawingId` tracks which row is actively awaiting the API.
//
// USAGE:
//   <ApplicationsList
//     applications={applications}
//     loading={loading}
//     onWithdraw={(id) => removeFromList(id)}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import { useState } from 'react';                              // Local UI state
import type { Application, ApplicationStatus } from '../../types'; // Type imports
import { withdrawApplication } from '../../api/applications.api'; // API call
import Badge from '../ui/Badge';   // Coloured pill label
import Button from '../ui/Button'; // Reusable button

// Props the parent (ApplicationsPage) passes in
interface Props {
  applications: Application[]; // Array of the user's applications
  loading: boolean;            // True while the page is fetching
  onWithdraw: (id: string) => void; // Callback to remove the row from the parent's list
}

// ── Status → badge colour mapping ──────────────────────────────────────────
// Record<K, V> is a TypeScript utility type that creates an object type
// where every key of type K maps to a value of type V.
//
// Here every ApplicationStatus key is mapped to a Badge colour string.
// This prevents typos: TypeScript will error if a status is missing.
//
// Example:  STATUS_COLOR['shortlisted'] === 'green'
const STATUS_COLOR: Record<ApplicationStatus, 'blue' | 'yellow' | 'green' | 'red'> = {
  submitted: 'blue',
  under_review: 'yellow',
  shortlisted: 'green',
  rejected: 'red',
};

// ── Status → human-readable label mapping ──────────────────────────────────
const STATUS_LABEL: Record<ApplicationStatus, string> = {
  submitted: '📨 Submitted',
  under_review: '🔍 Under Review',
  shortlisted: '⭐ Shortlisted',
  rejected: '✗ Rejected',
};

export default function ApplicationsList({ applications, loading, onWithdraw }: Props) {

  // ── Local state ────────────────────────────────────────────────────────
  // confirmId: the application.id whose row is in "Withdraw?" confirm mode.
  // null means no row is in confirm mode.
  const [confirmId, setConfirmId] = useState<string | null>(null);

  // withdrawingId: the application.id whose row is actively waiting for the
  // DELETE /applications/:id API response.  Drives the loading spinner.
  const [withdrawingId, setWithdrawingId] = useState<string | null>(null);

  // A single global error message shown above the list if withdraw fails.
  const [withdrawError, setWithdrawError] = useState('');

  // ── Withdraw handler ────────────────────────────────────────────────────
  // This async function is called when the user confirms "Yes" in the
  // two-step confirm flow.
  const handleWithdraw = async (id: string) => {
    setWithdrawingId(id);    // Show spinner on this row
    setWithdrawError('');     // Clear any previous error

    try {
      await withdrawApplication(id); // DELETE /applications/:id
      onWithdraw(id); // Tell the parent to remove this application from its list
                      // Parent does: setApplications(prev => prev.filter(a => a.id !== id))
    } catch {
      // If the API call fails, show an error message.  We don't have an error
      // object because the catch block uses an empty parameter (TS 4+).
      setWithdrawError('Failed to withdraw. Please try again.');
    } finally {
      // finally runs whether the try succeeded or the catch handled an error.
      setWithdrawingId(null); // Clear spinner
      setConfirmId(null);     // Exit confirm mode on the row
    }
  };

  // ── Loading state ───────────────────────────────────────────────────────
  // Render a centred spinner while the parent is fetching applications.
  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  // ── Empty state ─────────────────────────────────────────────────────────
  // Render a friendly empty-state card if there are no applications yet.
  if (applications.length === 0) {
    return (
      <div
        className="glass"
        style={{
          borderRadius: 'var(--radius-xl)',
          padding: '3rem',
          textAlign: 'center',
          color: 'var(--color-text-muted)',
        }}
      >
        <div style={{ fontSize: '2.5rem', marginBottom: '0.75rem' }}>📭</div>
        <p style={{ margin: 0, fontWeight: 600 }}>No applications yet.</p>
        <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
          Browse jobs and hit <strong>Apply Now</strong> to get started.
        </p>
      </div>
    );
  }

  // ── List of application rows ────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Global error message shown above the list */}
      {withdrawError && <div className="alert alert-error">{withdrawError}</div>}

      {/*
        .map() iterates over the applications array and returns one JSX element
        per item.  `key={app.id}` is required by React for efficient re-renders:
        it lets React identify which item changed without re-rendering all rows.
      */}
      {applications.map((app) => (
        <div
          key={app.id} // Unique key for React's reconciler
          className="glass"
          style={{
            borderRadius: 'var(--radius-lg)',
            padding: '1.25rem 1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1rem',
            flexWrap: 'wrap',           // Allow wrapping on mobile
            animation: 'slideUp 0.25s ease',
            transition: 'opacity 0.3s ease',
          }}
        >
          {/* ── Job info (left, flexible) ─────────────────────────── */}
          <div style={{ flex: 1, minWidth: 200 }}>
            {/*
              Optional chaining: app.job?.title
              app.job might be null if the job was deleted after applying.
              ?? 'Unknown Job' is the nullish coalescing fallback.
            */}
            <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: '0.25rem' }}>
              {app.job?.title ?? 'Unknown Job'}
            </div>
            {/* Metadata row: company, location, salary — each conditionally rendered */}
            <div
              style={{
                fontSize: '0.85rem',
                color: 'var(--color-text-muted)',
                display: 'flex',
                flexWrap: 'wrap',
                gap: '0.5rem',
              }}
            >
              {/* app.job?.recruiter?.companyName — doubly optional chained */}
              {app.job?.recruiter?.companyName && <span>🏢 {app.job.recruiter.companyName}</span>}
              {app.job?.location && <span>📍 {app.job.location}</span>}
              {app.job?.salaryRange && <span>💰 {app.job.salaryRange}</span>}
            </div>
          </div>

          {/* ── Status badge (fixed width) ────────────────────────── */}
          <div style={{ flexShrink: 0 }}>
            {/*
              Look up the colour and label for this application's status.
              Example:
                app.status = 'shortlisted'
                STATUS_COLOR['shortlisted'] = 'green'
                STATUS_LABEL['shortlisted'] = '⭐ Shortlisted'
            */}
            <Badge color={STATUS_COLOR[app.status]}>{STATUS_LABEL[app.status]}</Badge>
          </div>

          {/* ── Applied date (fixed width, right-aligned) ─────────── */}
          <div
            style={{
              flexShrink: 0,
              fontSize: '0.8rem',
              color: 'var(--color-text-muted)',
              minWidth: 90,
              textAlign: 'right',
            }}
          >
            {/*
              app.createdAt is an ISO date string from the server.
              new Date(app.createdAt) parses it into a Date object.
              .toLocaleDateString('en-US', {…}) formats it as "Mar 15, 2025".
            */}
            {new Date(app.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </div>

          {/* ── Withdraw action (fixed width) ─────────────────────── */}
          <div style={{ flexShrink: 0 }}>
            {/*
              Two-step confirm pattern:
                confirmId === app.id  → this row is in "confirm" mode
                otherwise            → show the initial "Withdraw" button

              This prevents accidental withdrawals by requiring a second click.
            */}
            {confirmId === app.id ? (
              // ── Confirm mode: show Yes / No ─────────────────────
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
                  Withdraw?
                </span>
                {/* Yes — calls the actual API */}
                <Button
                  id={`confirm-withdraw-${app.id}`}
                  variant="primary"
                  size="sm"
                  loading={withdrawingId === app.id} // Show spinner on this specific row
                  onClick={() => handleWithdraw(app.id)}
                >
                  Yes
                </Button>
                {/* No — exits confirm mode without doing anything */}
                <Button
                  id={`cancel-withdraw-${app.id}`}
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmId(null)}
                  disabled={withdrawingId === app.id} // Disable while API is running
                >
                  No
                </Button>
              </div>
            ) : (
              // ── Idle mode: show Withdraw button ─────────────────
              // Clicking sets confirmId to this row's id → enters confirm mode
              <Button
                id={`withdraw-${app.id}`}
                variant="secondary"
                size="sm"
                onClick={() => setConfirmId(app.id)}
              >
                Withdraw
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
