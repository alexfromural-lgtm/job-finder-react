// ─── ProfileHeader.tsx ───────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders the top identity card of the job seeker profile page:
//     • Gradient avatar circle with emoji
//     • User's name + email + optional location
//     • "JOB SEEKER" role badge
//     • "✏️ Edit Profile" button (hidden while editing is active)
//
// DESIGN PATTERN:
//   Presentational component — no local state.  The parent controls `editing`
//   and provides `onEdit` to transition into edit mode.
//
// USAGE:
//   <ProfileHeader
//     profile={profile}
//     location={form.location}
//     editing={editing}
//     onEdit={() => setEditing(true)}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import type { JobSeekerProfile } from '../../../types'; // User + profile fields
import Button from '../../../components/ui/Button';

interface ProfileHeaderProps {
  profile: JobSeekerProfile | null; // null during initial fetch
  location?: string;                // Shows the in-progress edited location value
  editing: boolean;                 // Hides the "Edit Profile" button when true
  onEdit: () => void;               // Called to enter edit mode
}

export default function ProfileHeader({ profile, location, editing, onEdit }: ProfileHeaderProps) {
  return (
    // Glass-strong card with flex row layout: avatar | info | edit button
    <div
      className="glass-strong"
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        marginBottom: '1.5rem',
        display: 'flex',
        alignItems: 'center',
        gap: '1.5rem',
        flexWrap: 'wrap',         // Stack on mobile
        animation: 'slideUp 0.3s ease', // Entrance animation
      }}
    >
      {/* ── Avatar circle ─────────────────────────────────────────── */}
      {/*
        A pure CSS circle rendered with a linear gradient background.
        No image is used — just an emoji centred inside the circle.
        borderRadius: '50%' makes any rectangle a circle.
        flexShrink: 0 prevents the circle from compressing in a flex row.
      */}
      <div
        style={{
          width: 72,
          height: 72,
          borderRadius: '50%',
          background: 'linear-gradient(135deg, var(--color-accent), var(--color-primary))',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '2rem',
          flexShrink: 0,
        }}
      >
        👤
      </div>

      {/* ── Info column ───────────────────────────────────────────── */}
      {/*
        flex: 1  → takes all remaining horizontal space
        minWidth: 0 → allows text to truncate if the container is too narrow
      */}
      <div style={{ flex: 1, minWidth: 0 }}>
        {/*
          profile?.user?.name ?? 'Job Seeker'
            profile?.user?.name → optional chain: safe even if profile is null
            ?? 'Job Seeker'      → fallback shown while profile loads
        */}
        <h1
          style={{
            margin: '0 0 0.25rem',
            fontSize: '1.6rem',
            fontWeight: 800,
            wordBreak: 'break-word', // Prevent long names from overflowing the card
          }}
        >
          {profile?.user?.name ?? 'Job Seeker'}
        </h1>

        {/* Email address (always present once loaded) */}
        <p style={{ margin: '0 0 0.5rem', color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
          {profile?.user?.email}
        </p>

        {/* Location — conditionally rendered; shows the edited value from parent */}
        {location && (
          <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.85rem' }}>
            📍 {location}
          </p>
        )}

        {/* Role badge */}
        <div style={{ marginTop: '0.5rem' }}>
          {/* badge badge-purple is a global CSS class: purple-tinted pill */}
          <span className="badge badge-purple">JOB SEEKER</span>
        </div>
      </div>

      {/*
        Only show the Edit button when NOT already in edit mode.
        !editing && (…) short-circuits: renders nothing when editing is true.
      */}
      {!editing && (
        <Button id="profile-edit-btn" variant="secondary" onClick={onEdit}>
          ✏️ Edit Profile
        </Button>
      )}
    </div>
  );
}
