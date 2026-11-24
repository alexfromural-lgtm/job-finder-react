// ─── JobDetailBody.tsx ───────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders the lower "content" portion of a job detail page — the description,
//   requirements, optional company website link, and posted-date footer.
//
// DESIGN PATTERN:
//   Thin composition component: it imports JobDetailSection and renders two
//   instances of it.  All styling is inline; no CSS modules needed.
//   Conditional rendering uses the && short-circuit pattern.
//
// USAGE:
//   <JobDetailBody job={job} />
// ─────────────────────────────────────────────────────────────────────────────

import type { Job } from '../../types';        // TypeScript Job shape (id, title, description…)
import JobDetailSection from './JobDetailSection'; // Reusable titled-paragraph component

// Props interface — only the full Job object is needed.
interface JobDetailBodyProps {
  job: Job;
}

export default function JobDetailBody({ job }: JobDetailBodyProps) {
  return (
    // Glassmorphism card — `.glass` applies backdrop-filter blur + semi-transparent bg
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-xl)', // Rounded corners from CSS custom property
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column', // Stack children top-to-bottom
        gap: '2rem',             // 2rem space between each section
      }}
    >
      {/* ── Section 1: Job description ──────────────────────────── */}
      {/* JobDetailSection renders a <h3> title + <p> with pre-wrap text */}
      <JobDetailSection title="📋 About This Role" content={job.description} />

      {/* Horizontal rule as visual separator between sections */}
      <hr className="divider" />

      {/* ── Section 2: Requirements ─────────────────────────────── */}
      <JobDetailSection title="✅ Requirements" content={job.requirements} />

      {/*
        ── Optional Section 3: Company website ───────────────────
        job.recruiter?.companyWebsite uses optional chaining (?.) to safely
        access a nested property that may not exist.

        The && operator short-circuits: if the left side is falsy (null/undefined/''),
        React renders nothing.  If truthy, React renders the right side (the JSX).

        Example:
          job.recruiter?.companyWebsite = "https://acme.com"  → renders the link
          job.recruiter?.companyWebsite = undefined           → renders nothing
      */}
      {job.recruiter?.companyWebsite && (
        // React Fragment (<>…</>) lets us return two sibling elements without
        // wrapping them in an extra <div>.  Here we render <hr> + the link div.
        <>
          <hr className="divider" />
          <div>
            <h3
              style={{
                margin: '0 0 0.5rem',
                fontSize: '1rem',
                fontWeight: 700,
                color: 'var(--color-text-muted)',
              }}
            >
              🔗 Company Website
            </h3>
            {/*
              target="_blank"            → opens the link in a new browser tab
              rel="noopener noreferrer"  → security best practice for external links:
                "noopener"   prevents the new tab from accessing window.opener
                             (stops malicious sites from redirecting your page)
                "noreferrer" additionally hides the Referer header, protecting
                             user privacy
            */}
            <a
              href={job.recruiter.companyWebsite}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: 'var(--color-primary)', fontWeight: 500 }}
            >
              {job.recruiter.companyWebsite} {/* Display the URL as link text */}
            </a>
          </div>
        </>
      )}

      {/* ── Footer: Posted date ─────────────────────────────────── */}
      <hr className="divider" />
      <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--color-text-muted)' }}>
        Posted on{' '}
        {/*
          new Date(job.createdAt) converts the ISO 8601 string from the API
          (e.g. "2025-03-15T12:00:00.000Z") into a JavaScript Date object.

          .toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })
          formats it as human-readable text: "March 15, 2025"
        */}
        {new Date(job.createdAt).toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })}
      </p>
    </div>
  );
}
