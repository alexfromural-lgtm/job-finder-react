// ─── SavedJobsPage.tsx ───────────────────────────────────────────────────────
//
// PURPOSE:
//   Shows a job seeker's bookmarked (saved) jobs.  Each card has a "View →"
//   button (navigates to JobDetailPage) and an "✕ Unsave" button (fires a
//   synchronous DELETE and removes the card optimistically from the list).
//
// DESIGN PATTERN:
//   "Optimistic remove": after a successful unsave API call, the item is
//   filtered out of the list immediately without re-fetching.
//
//   "Sub-component in same file": SavedJobCard is defined below and only
//   used by this page — no need for a separate file.
//
// USAGE:
//   Route: /saved-jobs (protected, JOB_SEEKER only)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { getSavedJobs, unsaveJob } from '../../api/applications.api';
import { extractApiError } from '../../utils/apiError';
import type { SavedJob } from '../../types';
import Button from '../../components/ui/Button';
import Badge from '../../components/ui/Badge';
import Card from '../../components/ui/Card';
import { usePageTitle } from '../../hooks/usePageTitle'; // Sets browser tab title

export default function SavedJobsPage() {
  const { user } = useAuth();   // For the personalised subtitle
  const navigate = useNavigate();
  usePageTitle('Saved Jobs');   // Sets <title> to "Saved Jobs | JobFinder"

  // ── State ─────────────────────────────────────────────────────────────
  const [savedJobs, setSavedJobs] = useState<SavedJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  // unsavingId: the jobId currently being unsaved.  Drives the spinner
  // on that specific card's Unsave button.  null = nothing being unsaved.
  const [unsavingId, setUnsavingId] = useState<string | null>(null);

  // ── Fetch saved jobs ───────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    getSavedJobs(controller.signal)
      .then(setSavedJobs)
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setError(extractApiError(err, 'Failed to load saved jobs.'));
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []); // Run once on mount

  // ── Unsave handler ─────────────────────────────────────────────────────
  // Takes a SavedJob object so we have access to both jobId and savedAt.
  const handleUnsave = async (savedJob: SavedJob) => {
    setUnsavingId(savedJob.jobId); // Show spinner on this specific card
    try {
      await unsaveJob(savedJob.jobId); // DELETE /applications/saved/:jobId
      // Filter out the removed job from local state — no need to re-fetch
      setSavedJobs((prev) => prev.filter((s) => s.jobId !== savedJob.jobId));
    } catch {
      // Silently ignore — the card stays in the list; the user can retry
    } finally {
      setUnsavingId(null); // Clear spinner regardless of outcome
    }
  };

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
                🔖 Saved Jobs
              </h1>
              {/*
                user?.name?.split(' ')[0]
                  Split the full name on spaces → take index 0 (first name).
                  Example: "Jane Doe" → "Jane"
              */}
              <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
                {user?.name?.split(' ')[0]}'s bookmarked opportunities
              </p>
            </div>

            {/* Count chip: shows how many jobs are saved */}
            <div
              className="glass"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 'var(--radius-md)',
                textAlign: 'center',
                minWidth: 72,
              }}
            >
              <div style={{ fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-primary)' }}>
                {savedJobs.length} {/* Live count — updates when user unsaves */}
              </div>
              <div
                style={{ fontSize: '0.72rem', color: 'var(--color-text-muted)', marginTop: '0.1rem' }}
              >
                Saved
              </div>
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

        {/* Error alert */}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
            {error}
          </div>
        )}

        {/* ── Content: loading / empty / list ───────────────────────── */}
        {loading ? (
          // Loading spinner
          <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : savedJobs.length === 0 ? (
          // Empty state card
          <div
            className="glass"
            style={{
              borderRadius: 'var(--radius-xl)',
              padding: '3rem 2rem',
              textAlign: 'center',
              animation: 'slideUp 0.3s ease',
            }}
          >
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🏷️</div>
            <p style={{ fontSize: '1.1rem', fontWeight: 600, margin: '0 0 0.5rem' }}>
              No saved jobs yet
            </p>
            <p style={{ color: 'var(--color-text-muted)', margin: '0 0 1.5rem', fontSize: '0.9rem' }}>
              Bookmark jobs from the job detail page to keep track of them here.
            </p>
            <Button id="find-jobs-btn" variant="primary" onClick={() => navigate('/')}>
              Find Jobs →
            </Button>
          </div>
        ) : (
          // List of saved job cards
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            {/*
              .map() creates one SavedJobCard per item.
              key={saved.jobId} — unique key required by React for list reconciliation.
              unsaving prop — tracks which card's button shows a spinner.
            */}
            {savedJobs.map((saved) => (
              <SavedJobCard
                key={saved.jobId}
                saved={saved}
                unsaving={unsavingId === saved.jobId} // true only for the card being unsaved
                onView={() => navigate(`/jobs/${saved.jobId}`)}
                onUnsave={() => handleUnsave(saved)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ─── SavedJobCard sub-component ───────────────────────────────────────────────
// Renders a single saved job entry.  Receives handlers from the page so it has
// no internal state — purely presentational.

interface SavedJobCardProps {
  saved: SavedJob;       // The saved job record (includes nested job object)
  unsaving: boolean;     // Show spinner on the Unsave button?
  onView: () => void;    // Navigate to job detail
  onUnsave: () => void;  // Trigger the unsave flow
}

function SavedJobCard({ saved, unsaving, onView, onUnsave }: SavedJobCardProps) {
  // saved.job is an optional nested Job object (may be null if job was deleted)
  const job = saved.job;

  return (
    // Card component with hover state; row layout
    <Card hover style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
      {/* ── Left: job info ───────────────────────────────────────── */}
      <div style={{ flex: 1, minWidth: 0 }}> {/* minWidth:0 prevents overflow in flex */}
        {/* Clickable title — navigates to detail page */}
        <h3
          style={{
            margin: '0 0 0.4rem',
            fontSize: '1rem',
            fontWeight: 700,
            cursor: 'pointer',
            color: 'var(--color-text)',
            lineHeight: 1.3,
          }}
          onClick={onView}
        >
          {/* ?? 'Job Listing' fallback for deleted jobs */}
          {job?.title ?? 'Job Listing'}
        </h3>

        {/* Company name — optional chaining guards against null */}
        {job?.recruiter?.companyName && (
          <p style={{ margin: '0 0 0.5rem', fontSize: '0.82rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
            🏢 {job.recruiter.companyName}
          </p>
        )}

        {/* Badge pills: location, category, salary, closed status */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.35rem' }}>
          {job?.location && <Badge color="teal">📍 {job.location}</Badge>}
          {job?.category && <Badge color="purple">{job.category}</Badge>}
          {job?.salaryRange && <Badge color="green">💰 {job.salaryRange}</Badge>}
          {/* Show "Closed" badge if job exists but is deactivated */}
          {job && !job.isActive && <Badge color="red">Closed</Badge>}
        </div>

        {/* "Saved on Mar 15, 2025" footer */}
        <p style={{ margin: '0.4rem 0 0', fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
          Saved{' '}
          {/*
            new Date(saved.savedAt).toLocaleDateString(undefined, {…})
            `undefined` as locale uses the browser's locale automatically.
          */}
          {new Date(saved.savedAt).toLocaleDateString(undefined, {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </p>
      </div>

      {/* ── Right: action buttons ─────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '0.5rem', flexShrink: 0 }}>
        <Button id={`view-saved-${saved.jobId}`} variant="secondary" size="sm" onClick={onView}>
          View →
        </Button>
        {/* Unsave button: shows spinner when this card's unsavingId matches */}
        <Button
          id={`unsave-${saved.jobId}`}
          variant="ghost"
          size="sm"
          loading={unsaving}
          onClick={onUnsave}
          style={{ color: 'var(--color-text-muted)' }}
        >
          {/* Hide label text while spinner is showing (Button renders spinner when loading=true) */}
          {unsaving ? '' : '✕ Unsave'}
        </Button>
      </div>
    </Card>
  );
}
