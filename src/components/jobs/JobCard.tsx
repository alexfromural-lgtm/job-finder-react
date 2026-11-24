// ─── components/jobs/JobCard.tsx — Single Job Listing Card ───────────────────
//
// Displays one job in a card format. Used inside JobList which renders a grid.
// Clicking the title or "View Details" button navigates to /jobs/:id.
//
// Features:
//   • timeAgo() — human-friendly relative date ("Today", "3 days ago", "2mo ago")
//   • Optional actions slot — the recruiter dashboard passes Edit/Delete buttons here
//   • Badges for location, category, salary, closed status
//   • 3-line description excerpt (CSS -webkit-line-clamp)
//
// Usage:
//   <JobCard job={job} />                           // basic
//   <JobCard job={job} actions={<EditButton />} />  // with extra buttons

import { useNavigate } from 'react-router-dom';
import type { Job } from '../../types';
import Badge from '../ui/Badge';
import Card from '../ui/Card';
import Button from '../ui/Button';

interface JobCardProps {
  job: Job;
  actions?: React.ReactNode; // optional slot for extra buttons (edit, delete, etc.)
}

// timeAgo: converts an ISO date string to a human-readable relative time.
// This is a "pure function" — no side effects, same output for same input.
//
// Examples:
//   timeAgo('2024-01-15T10:00:00Z')  when today is 2024-01-15 → 'Today'
//   timeAgo('2024-01-14T10:00:00Z')  yesterday                → 'Yesterday'
//   timeAgo('2024-01-10T10:00:00Z')  5 days ago               → '5 days ago'
//   timeAgo('2024-01-01T10:00:00Z')  2 weeks ago              → '2w ago'
//   timeAgo('2023-12-01T10:00:00Z')  ~6 weeks ago             → '1mo ago'
function timeAgo(date: string): string {
  // Date.now() = current timestamp in ms
  // new Date(date).getTime() = the ISO date as ms
  // diff = elapsed ms
  const diff = Date.now() - new Date(date).getTime();
  // 86400000 = 1 day in ms (24 * 60 * 60 * 1000)
  const days = Math.floor(diff / 86400000);
  if (days === 0) return 'Today';
  if (days === 1) return 'Yesterday';
  if (days < 7) return `${days} days ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;  // e.g. '2w ago'
  return `${Math.floor(days / 30)}mo ago`;               // e.g. '1mo ago'
}

export default function JobCard({ job, actions }: JobCardProps) {
  // useNavigate returns a function that programmatically changes the URL.
  // navigate(`/jobs/${job.id}`) → goes to the job detail page
  const navigate = useNavigate();

  return (
    // Card with hover effect — the whole card lifts slightly on hover via CSS
    <Card
      hover
      className="job-card"
      style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
    >
      {/* ── Header: title + posted date ──────────────────────────────────── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '0.5rem' }}>
        {/* Clicking the title navigates to the job detail page */}
        <h3
          style={{ margin: 0, fontSize: '1.05rem', fontWeight: 700, lineHeight: 1.3, cursor: 'pointer', color: 'var(--color-text)' }}
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          {job.title}
        </h3>
        {/* flexShrink: 0 prevents the date from shrinking/wrapping */}
        <span style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', flexShrink: 0 }}>
          {timeAgo(job.createdAt)}
        </span>
      </div>

      {/* ── Company name (optional — from recruiter profile) ──────────────── */}
      {/* Optional chaining: job.recruiter?.companyName only truthy if both exist */}
      {job.recruiter?.companyName && (
        <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', fontWeight: 500 }}>
          🏢 {job.recruiter.companyName}
        </p>
      )}

      {/* ── Badge row: location, category, salary, closed ────────────────── */}
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
        {/* Location badge — always shown */}
        <Badge color="teal">📍 {job.location}</Badge>
        {/* Optional badges — only shown if the value exists */}
        {job.category && <Badge color="purple">{job.category}</Badge>}
        {job.salaryRange && <Badge color="green">💰 {job.salaryRange}</Badge>}
        {/* !job.isActive = job is closed → show red "Closed" badge */}
        {!job.isActive && <Badge color="red">Closed</Badge>}
      </div>

      {/* ── Description excerpt (3 lines max) ────────────────────────────── */}
      {/* -webkit-line-clamp: CSS property that limits text to N lines with "…" */}
      <p style={{
        margin: 0, fontSize: '0.85rem', color: 'var(--color-text-muted)', lineHeight: 1.6,
        display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden',
      }}>
        {job.description}
      </p>

      {/* ── Footer: "View Details" button + optional actions ─────────────── */}
      {/* marginTop: 'auto' pushes the footer to the bottom of the card (flex column) */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 'auto' }}>
        <Button
          id={`view-job-${job.id}`}  // unique ID per card (useful for E2E testing)
          variant="secondary"
          size="sm"
          onClick={() => navigate(`/jobs/${job.id}`)}
        >
          View Details →
        </Button>
        {/* actions slot — renders Edit/Delete buttons on recruiter dashboard */}
        {actions && <div style={{ display: 'flex', gap: '0.5rem' }}>{actions}</div>}
      </div>
    </Card>
  );
}
