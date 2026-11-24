// ─── AboutSection.tsx ────────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders the "About" card on the job seeker profile page.
//   Contains three FieldRow components for: bio, location, and resume URL.
//
// DESIGN PATTERN:
//   "Composed from FieldRow" — no raw inputs here; FieldRow handles both
//   the view and edit mode for each field, keeping this component thin.
//
// USAGE:
//   <AboutSection form={form} editing={editing} onChange={handleChange} />
// ─────────────────────────────────────────────────────────────────────────────

import type { JobSeekerProfile } from '../../../types';
import FieldRow from './FieldRow'; // View/edit field component

interface AboutSectionProps {
  form: Partial<JobSeekerProfile>; // The editable form copy (may have undefined fields)
  editing: boolean;                // Toggle FieldRow between view/edit mode
  onChange: (name: string, value: string) => void; // Generic field updater from ProfilePage
}

export default function AboutSection({ form, editing, onChange }: AboutSectionProps) {
  return (
    // Glass card with slide-up entrance animation
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column', // Stack fields top-to-bottom
        gap: '1.5rem',           // Space between each FieldRow
        marginBottom: '1.25rem',
        animation: 'slideUp 0.35s ease', // Slightly delayed vs ProfileHeader
      }}
    >
      {/* Section heading */}
      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>About</h2>

      {/*
        Each FieldRow receives:
          label      → shown above the field
          name       → passed back to onChange so the parent knows which field changed
          value      → current field value from `form` (Partial means may be undefined)
          editing    → passed through to show input or plain text
          placeholder→ shown when input is empty in edit mode
          onChange   → parent's handleChange(name, value) generic updater
          multiline  → renders a <textarea> instead of <input>

        When the user edits "Bio":
          onChange('bio', 'New bio text')
          → setForm(prev => ({ ...prev, bio: 'New bio text' }))
      */}
      <FieldRow
        label="Bio"
        name="bio"              // This name is used as the form key
        value={form.bio}        // form.bio might be undefined — FieldRow handles that
        editing={editing}
        placeholder="Write a short bio about yourself..."
        onChange={onChange}
        multiline               // boolean prop — same as multiline={true}
      />
      <FieldRow
        label="Location"
        name="location"
        value={form.location}
        editing={editing}
        placeholder="e.g. San Francisco, CA"
        onChange={onChange}
        // No multiline → single-line <input> in edit mode
      />
      <FieldRow
        label="Resume URL"
        name="resumeUrl"
        value={form.resumeUrl}
        editing={editing}
        placeholder="https://yourresume.com/resume.pdf"
        onChange={onChange}
      />
    </div>
  );
}
