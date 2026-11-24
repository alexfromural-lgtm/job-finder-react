// ─── JobDetailCTA.tsx ────────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders the "Call-To-Action" area on a job detail page — the Apply and Save
//   buttons — with four distinct states:
//
//   1. Unauthenticated visitor   → "Login to Apply" button
//   2. Recruiter (not a seeker)  → renders nothing (null)
//   3. Loading application check → spinner "Checking…" button
//   4. Job seeker                → Bookmark toggle + Apply Now (or ✓ Applied)
//
// DESIGN PATTERN:
//   "Early return" guards: each conditional branch returns early so the
//   happy-path JSX at the bottom stays clean and unindented.
//
// USAGE:
//   <JobDetailCTA isAuthenticated={…} isJobSeeker={…} … />
// ─────────────────────────────────────────────────────────────────────────────

import { useNavigate } from 'react-router-dom'; // Hook for programmatic navigation
import Button from '../ui/Button';               // Reusable button component

// Props passed down from JobDetailHeader
interface JobDetailCTAProps {
  isAuthenticated: boolean;        // Is the user logged in?
  isJobSeeker: boolean;            // Does the user have the JOB_SEEKER role?
  checkingApplication: boolean;    // Still loading apply/save status from API?
  applicationId: string | null;    // Existing application ID, or null
  isSaved: boolean;                // Has the job been bookmarked?
  savingJob: boolean;              // Is a save/unsave API call running?
  onApplyClick: () => void;        // Opens the Apply modal
  onSaveClick: () => void;         // Triggers save / unsave toggle
}

export default function JobDetailCTA({
  isAuthenticated,
  isJobSeeker,
  checkingApplication,
  applicationId,
  isSaved,
  savingJob,
  onApplyClick,
  onSaveClick,
}: JobDetailCTAProps) {
  // useNavigate returns a function for navigating programmatically.
  // Example: navigate('/login') pushes "/login" onto the history stack.
  const navigate = useNavigate();

  // ── Guard 1: Not logged in ──────────────────────────────────────────────
  // Returning early here means none of the job-seeker JSX below runs.
  if (!isAuthenticated) {
    return (
      // Clicking navigates to /login so the user can sign in and come back.
      <Button
        id="apply-login-prompt"
        variant="primary"
        size="lg"
        onClick={() => navigate('/login')}
      >
        Login to Apply
      </Button>
    );
  }

  // ── Guard 2: Logged in but not a job seeker (e.g. recruiter) ───────────
  // Returning null renders absolutely nothing — React supports this.
  // Recruiters can view job details but cannot apply to jobs.
  if (!isJobSeeker) return null;

  // ── Guard 3: Still loading apply / saved status ─────────────────────────
  // The parent fetched getMyApplications + getSavedJobs in parallel.
  // While that's pending, show a disabled spinner button.
  if (checkingApplication) {
    return (
      <Button id="apply-btn" variant="primary" size="lg" disabled>
        {/* Inline spinner — className="spinner" triggers CSS animation */}
        <span
          className="spinner"
          style={{ width: 16, height: 16, display: 'inline-block', marginRight: '0.5rem' }}
        />
        Checking…
      </Button>
    );
  }

  // ── Happy path: job seeker, fully loaded ────────────────────────────────
  return (
    <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>

      {/* ── Save / Unsave bookmark button ──────────────────────────── */}
      {/*
        This is a raw <button> (not our Button component) so we can fully
        customise its border and icon.

        style={...} receives an object cast to React.CSSProperties.
        The cast (`as React.CSSProperties`) is needed because some properties
        (like CSS custom properties or computed values) might not be inferred
        correctly by TypeScript without it.

        Border appearance:
          isSaved=true  → solid blue border (highlighted)
          isSaved=false → dashed semi-transparent border (subtle)
      */}
      <button
        id="save-job-btn"
        onClick={onSaveClick}          // Calls parent's handleSaveToggle
        disabled={savingJob}           // Prevent double-clicks while API call runs
        title={isSaved ? 'Unsave job' : 'Save job'}       // Tooltip on hover
        aria-label={isSaved ? 'Unsave job' : 'Save job'}  // Screen reader label
        style={
          {
            border: isSaved
              ? '2px solid var(--color-primary)'
              : '2px dashed rgba(255,255,255,0.35)',
            borderRadius: 'var(--radius-md)',
            padding: '0.55rem 0.8rem',
            cursor: savingJob ? 'not-allowed' : 'pointer', // Visual feedback when disabled
            color: isSaved ? 'var(--color-primary)' : 'rgba(255,255,255,0.5)',
            fontSize: '1.3rem',
            lineHeight: 1,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.35rem',
            transition: 'all 0.2s ease', // Smooth border/color transition on toggle
            opacity: savingJob ? 0.6 : 1, // Dim button while saving
            background: isSaved ? 'rgba(99,102,241,0.12)' : 'transparent',
          } as React.CSSProperties      // Cast tells TypeScript this is valid
        }
      >
        {/*
          Three-way conditional (ternary within ternary) for the icon:
            savingJob → spinning loader  (API call in-flight)
            isSaved   → filled bookmark SVG
            else      → outline bookmark SVG

          SVG icons are inlined rather than imported as files so they react
          instantly to color changes driven by the parent <button>'s `color`.
        */}
        {savingJob ? (
          <span className="spinner" style={{ width: 16, height: 16 }} />
        ) : isSaved ? (
          /* Filled bookmark — indicates "saved" state */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="currentColor"       // Inherits color from parent <button>
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M5 3C5 2.44772 5.44772 2 6 2H18C18.5523 2 19 2.44772 19 3V21.382C19 21.7607 18.786 22.107 18.4472 22.2764C18.1085 22.4458 17.7049 22.4124 17.4 22.2L12 18.3333L6.6 22.2C6.29511 22.4124 5.89151 22.4458 5.55279 22.2764C5.21407 22.107 5 21.7607 5 21.382V3Z" />
          </svg>
        ) : (
          /* Outline bookmark — indicates "not saved" state */
          <svg
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"               // No fill for outline style
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M19 21L12 16L5 21V5C5 4.46957 5.21071 3.96086 5.58579 3.58579C5.96086 3.21071 6.46957 3 7 3H17C17.5304 3 18.0391 3.21071 18.4142 3.58579C18.7893 3.96086 19 4.46957 19 5V21Z" />
          </svg>
        )}
      </button>

      {/* ── Apply button ───────────────────────────────────────────── */}
      {/*
        If the user has already applied (applicationId is not null), show a
        disabled green "✓ Applied" badge instead of the Apply Now button.

        applicationId ? (applied state) : (not applied state)
      */}
      {applicationId ? (
        // Disabled green button — acts as a visual confirmation badge
        <Button
          id="applied-badge"
          variant="primary"
          size="lg"
          disabled
          style={{
            background: 'linear-gradient(135deg,#22c55e,#16a34a)', // Green gradient
            cursor: 'default',  // No pointer cursor — this is not interactive
            opacity: 1,         // Override Button's default disabled opacity
          }}
        >
          ✓ Applied
        </Button>
      ) : (
        // Active Apply Now button — clicking opens the ApplyModal
        <Button id="apply-btn" variant="primary" size="lg" onClick={onApplyClick}>
          Apply Now →
        </Button>
      )}
    </div>
  );
}
