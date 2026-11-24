// ─── ProfilePage.tsx (Job Seeker) ────────────────────────────────────────────
//
// PURPOSE:
//   Orchestrates the job seeker's profile page by composing five sub-components:
//   ProfileHeader, ProfileAlerts, AboutSection, SkillsSection, BackgroundSection.
//
// DESIGN PATTERN:
//   "Triple state for profile editing":
//     `profile` — the last confirmed data from the server (source of truth for Cancel)
//     `form`    — the in-progress editable copy of profile data
//     `skills`  — a separate array state because skills are managed differently
//                 (array add/remove, not a simple string field)
//
//   On "Cancel": form + skills are reset from `profile` (last known good state).
//   On "Save":   the API response is used to update both `profile` and `form` / `skills`,
//                so a second Cancel would still work correctly.
//
//   "Generic field updater":
//     handleChange(name, value) uses a computed property key `[name]` to update
//     any field without a separate setter per field.
//
// USAGE:
//   Route: /profile/seeker (protected, JOB_SEEKER only)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getJobSeekerProfile, updateJobSeekerProfile } from '../../api/profile.api';
import type { JobSeekerProfile } from '../../types';
import ProfileHeader from './profile/ProfileHeader';
import ProfileAlerts from './profile/ProfileAlerts';
import AboutSection from './profile/AboutSection';
import SkillsSection from './profile/SkillsSection';
import BackgroundSection from './profile/BackgroundSection';

export default function JobSeekerProfilePage() {
  // ── Triple state ──────────────────────────────────────────────────────
  // profile: the data as it exists on the server.  Used to restore `form`
  //          and `skills` when the user cancels editing.
  const [profile, setProfile] = useState<JobSeekerProfile | null>(null);

  // form: the editable draft.  Every change updates this, not `profile`.
  // Partial<JobSeekerProfile> means every field is optional — fields we
  // haven't fetched yet default to undefined rather than causing TypeScript errors.
  const [form, setForm] = useState<Partial<JobSeekerProfile>>({});

  // skills: separate from `form` because it's an array that the SkillTagInput
  // component manages via add/remove (not a string input onChange).
  const [skills, setSkills] = useState<string[]>([]);

  // ── UI state ─────────────────────────────────────────────────────────
  const [editing, setEditing] = useState(false);  // Is the profile in edit mode?
  const [loading, setLoading] = useState(true);   // Initial fetch loading flag
  const [saving, setSaving] = useState(false);    // Save API call in-flight
  const [error, setError] = useState('');         // Error message
  const [success, setSuccess] = useState('');     // Success message (auto-clears)

  // ── Fetch profile ─────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    getJobSeekerProfile(controller.signal)
      .then((p) => {
        setProfile(p);    // Store the server copy
        setForm(p);       // Pre-populate the editable form
        setSkills(p.skills ?? []); // ?? [] handles null/undefined skills gracefully
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setError('Failed to load profile. Please try again.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []); // Run once on mount

  // ── Generic field updater ─────────────────────────────────────────────
  // Called by AboutSection and BackgroundSection when any field changes.
  // `name` is the form field key (e.g. 'bio', 'location').
  // [name]: value uses a computed property name — equivalent to { bio: value }
  // when name='bio', or { location: value } when name='location'.
  //
  // Example:
  //   handleChange('bio', 'Software engineer with 5 years…')
  //   → setForm(prev => ({ ...prev, bio: 'Software engineer with 5 years…' }))
  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Save handler ──────────────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      // Send only the fields the API accepts
      const updated = await updateJobSeekerProfile({
        bio: form.bio,
        location: form.location,
        skills,          // From the separate skills state
        education: form.education,
        experience: form.experience,
        resumeUrl: form.resumeUrl,
      });
      // Update both `profile` (source of truth) and `form` / `skills` with
      // the server's response.  This ensures Cancel still works after a Save.
      setProfile(updated);
      setForm(updated);
      setSkills(updated.skills ?? []);
      setEditing(false);
      setSuccess('Profile updated successfully! ✅');
      // Auto-clear the success message after 3.5 seconds
      setTimeout(() => setSuccess(''), 3500);
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel handler ────────────────────────────────────────────────────
  // Discard all edits by resetting form + skills from the last known `profile`.
  // profile ?? {} handles the unlikely case where profile is still null.
  const handleCancel = () => {
    setForm(profile ?? {});
    setSkills(profile?.skills ?? []);
    setEditing(false);
    setError('');
  };

  // ── Loading state ─────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="page hero-gradient">
        <div className="spinner-page">
          <div className="spinner" style={{ width: 40, height: 40 }} />
        </div>
      </div>
    );
  }

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className="page hero-gradient">
      {/* maxWidth: 720 — a readable width for a form-heavy page */}
      <div className="container" style={{ maxWidth: 720 }}>

        {/* Avatar, name, email, edit button */}
        <ProfileHeader
          profile={profile}
          location={form.location} // Show current (possibly edited) location
          editing={editing}
          onEdit={() => setEditing(true)}
        />

        {/* Success / error alerts */}
        <ProfileAlerts success={success} error={error} />

        {/* Bio, location, resumeUrl fields */}
        <AboutSection form={form} editing={editing} onChange={handleChange} />

        {/* Skill tags + add-skill input */}
        <SkillsSection skills={skills} editing={editing} onSkillsChange={setSkills} />

        {/* Experience, education, Save/Cancel buttons */}
        <BackgroundSection
          form={form}
          editing={editing}
          saving={saving}
          onChange={handleChange}
          onSave={handleSave}
          onCancel={handleCancel}
        />
      </div>
    </div>
  );
}
