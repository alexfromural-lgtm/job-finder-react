// ─── JobDetailHeader.tsx ─────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders the top "hero" card of a job detail page, containing:
//     • Job title, company name, industry
//     • Location / category / salary / status badges
//     • The CTA area (apply + save buttons, via JobDetailCTA)
//     • Optional save-error message below the CTA
//
// DESIGN PATTERN:
//   Prop-drilling: JobDetailPage owns all state (applicationId, isSaved…) and
//   passes it down through JobDetailHeader → JobDetailCTA.  This keeps state in
//   one place while keeping each component focused.
//
// USAGE:
//   <JobDetailHeader job={job} isAuthenticated={…} isJobSeeker={…} … />
// ─────────────────────────────────────────────────────────────────────────────

import type { Job } from '../../types'; // Job type: id, title, location, recruiter…
import Badge from '../ui/Badge';         // Coloured pill label component
import JobDetailCTA from './JobDetailCTA'; // Apply + Save button area

// All props are owned by JobDetailPage and threaded down here.
interface JobDetailHeaderProps {
  job: Job;                        // The job to display
  isAuthenticated: boolean;        // Is the visitor logged in?
  isJobSeeker: boolean;            // Does the user have the JOB_SEEKER role?
  checkingApplication: boolean;    // Still loading application status from API?
  applicationId: string | null;    // ID of an existing application, or null
  isSaved: boolean;                // Has this job been saved by the seeker?
  savingJob: boolean;              // Is a save/unsave request in-flight?
  saveError: string;               // Error message from a failed save attempt
  onApplyClick: () => void;        // Opens the Apply modal
  onSaveClick: () => void;         // Triggers save / unsave toggle
}

export default function JobDetailHeader({
  job,
  isAuthenticated,
  isJobSeeker,
  checkingApplication,
  applicationId,
  isSaved,
  savingJob,
  saveError,
  onApplyClick,
  onSaveClick,
}: JobDetailHeaderProps) {
  return (
    // Stronger glassmorphism card — `.glass-strong` has higher opacity/blur
    <div
      className="glass-strong"
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        marginBottom: '1.5rem',
        animation: 'slideUp 0.3s ease', // CSS keyframe defined globally: fade in + rise
      }}
    >
      {/*
        Two-column flex layout:
          Left  → job info (title, company, badges) — flex: 1 means it grows to fill space
          Right → CTA area (apply/save buttons) — flexShrink: 0 means it won't compress

        flexWrap: 'wrap' lets the right column drop below on narrow screens.
      */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start', // Align to top, not center, so long titles don't push buttons
          flexWrap: 'wrap',
          gap: '1rem',
        }}
      >
        {/* ── Left: Job metadata ───────────────────────────────────── */}
        <div style={{ flex: 1 }}> {/* flex: 1 → takes all remaining horizontal space */}
          {/* Job title */}
          <h1
            style={{ margin: '0 0 0.5rem', fontSize: '1.7rem', fontWeight: 800, lineHeight: 1.2 }}
          >
            {job.title}
          </h1>

          {/*
            Optional chaining: job.recruiter?.companyName
            If recruiter or companyName is null/undefined, the whole expression
            evaluates to undefined and nothing renders (short-circuit &&).
          */}
          {job.recruiter?.companyName && (
            <p
              style={{
                margin: '0 0 1rem',
                color: 'var(--color-text-muted)',
                fontWeight: 500,
                fontSize: '1rem',
              }}
            >
              🏢 {job.recruiter.companyName}
              {/* Template literal adds " · Industry" only when industry exists */}
              {job.recruiter.industry && ` · ${job.recruiter.industry}`}
            </p>
          )}

          {/* Row of coloured badge pills — flexWrap so they wrap on mobile */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {/* Location badge — always present (non-optional field) */}
            <Badge color="teal">📍 {job.location}</Badge>

            {/* Category badge — only shown when a category was set */}
            {job.category && <Badge color="purple">{job.category}</Badge>}

            {/* Salary badge — only shown when salaryRange was set */}
            {job.salaryRange && <Badge color="green">💰 {job.salaryRange}</Badge>}

            {/*
              Active/Closed status badge:
              job.isActive is a boolean; ternary picks color and label.
              Example: true  → blue badge "● Active"
                       false → red  badge "● Closed"
            */}
            <Badge color={job.isActive ? 'blue' : 'red'}>
              {job.isActive ? '● Active' : '● Closed'}
            </Badge>
          </div>
        </div>

        {/* ── Right: CTA (Call To Action) area ────────────────────── */}
        <div style={{ flexShrink: 0 }}> {/* flexShrink:0 — don't compress this column */}
          {/*
            JobDetailCTA handles all authentication-aware button logic:
              • Not logged in  → "Login to Apply" button
              • Recruiter       → renders nothing (null)
              • Job seeker      → Apply Now + Save bookmark button
          */}
          <JobDetailCTA
            isAuthenticated={isAuthenticated}
            isJobSeeker={isJobSeeker}
            checkingApplication={checkingApplication}
            applicationId={applicationId}
            isSaved={isSaved}
            savingJob={savingJob}
            onApplyClick={onApplyClick}
            onSaveClick={onSaveClick}
          />

          {/* Show a small error message beneath the buttons when save fails */}
          {saveError && (
            <p
              style={{
                marginTop: '0.5rem',
                fontSize: '0.75rem',
                color: 'var(--color-error, #f87171)', // CSS var with #f87171 fallback
                textAlign: 'right',
                maxWidth: 220,
              }}
            >
              ⚠ {saveError}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
