// ─── BackgroundSection.tsx ───────────────────────────────────────────────────
//
// PURPOSE:
//   Renders the "Background" card on the job seeker profile page.
//   Contains multi-line FieldRows for experience and education, plus the
//   Save and Cancel buttons (shown only while in edit mode).
//
// DESIGN PATTERN:
//   The Save/Cancel buttons live here (not in ProfileHeader) because this is
//   the last card in the form — the natural place for a user to submit after
//   filling in the last field.  The parent provides the handlers.
//
// USAGE:
//   <BackgroundSection
//     form={form}
//     editing={editing}
//     saving={saving}
//     onChange={handleChange}
//     onSave={handleSave}
//     onCancel={handleCancel}
//   />
// ─────────────────────────────────────────────────────────────────────────────

import type { JobSeekerProfile } from '../../../types';
import Button from '../../../components/ui/Button';
import FieldRow from './FieldRow'; // View/edit field component

interface BackgroundSectionProps {
  form: Partial<JobSeekerProfile>; // Editable draft (fields may be undefined)
  editing: boolean;                // Show inputs + Save/Cancel when true
  saving: boolean;                 // True while PATCH /profile request is in-flight
  onChange: (name: string, value: string) => void; // Generic field updater
  onSave: () => void;    // Calls ProfilePage.handleSave()
  onCancel: () => void;  // Calls ProfilePage.handleCancel() — resets form
}

export default function BackgroundSection({
  form,
  editing,
  saving,
  onChange,
  onSave,
  onCancel,
}: BackgroundSectionProps) {
  return (
    // Glass card — longest animation delay so it cascades in last
    <div
      className="glass"
      style={{
        borderRadius: 'var(--radius-xl)',
        padding: '2rem',
        display: 'flex',
        flexDirection: 'column',
        gap: '1.5rem',
        animation: 'slideUp 0.45s ease', // 0.45s — after SkillsSection (0.4s)
      }}
    >
      {/* Section heading */}
      <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Background</h2>

      {/*
        Experience field — multiline textarea in edit mode.
        name="experience" → onChange('experience', newValue)
        → parent does: setForm(prev => ({ ...prev, experience: newValue }))
      */}
      <FieldRow
        label="Experience"
        name="experience"
        value={form.experience}
        editing={editing}
        placeholder="Describe your work experience..."
        onChange={onChange}
        multiline // boolean prop shorthand for multiline={true}
      />

      {/* Education field — also multi-line */}
      <FieldRow
        label="Education"
        name="education"
        value={form.education}
        editing={editing}
        placeholder="Your educational background..."
        onChange={onChange}
        multiline
      />

      {/*
        Save + Cancel buttons — ONLY rendered when in edit mode.
        editing && (…) short-circuits: renders nothing when editing is false.
        This prevents the buttons from appearing in view mode.
      */}
      {editing && (
        <div
          style={{
            display: 'flex',
            gap: '0.75rem',
            justifyContent: 'flex-end', // Right-align the button group
            paddingTop: '0.5rem',        // Small top gap to separate from fields
          }}
        >
          {/* Cancel: resets form state to last saved profile data */}
          <Button id="profile-cancel-btn" variant="ghost" onClick={onCancel}>
            Cancel
          </Button>

          {/*
            Save: calls the API; loading={saving} shows a spinner on the button
            while the PATCH request is in-flight.
          */}
          <Button id="profile-save-btn" variant="primary" loading={saving} onClick={onSave}>
            Save Changes
          </Button>
        </div>
      )}
    </div>
  );
}
