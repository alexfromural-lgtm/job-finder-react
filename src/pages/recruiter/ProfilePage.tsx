// ─── ProfilePage.tsx (Recruiter) ─────────────────────────────────────────────
//
// PURPOSE:
//   Edit the recruiter's company profile: company name, industry, website,
//   and description.  Uses the same view/edit pattern as the job seeker profile
//   but simpler (no skills section, no sub-components — all in one file).
//
// DESIGN PATTERN:
//   "In-file FieldRow" — RecruiterProfile fields are simpler and fewer than
//   the job seeker's profile, so a local FieldRow component is defined in this
//   file rather than importing from a shared module.  This keeps the import
//   count low and the component self-contained.
//
//   "Triple state": profile (server truth), form (editable draft), editing flag.
//   On Cancel: form is reset from profile.
//   On Save: API response updates both profile and form.
//
// USAGE:
//   Route: /profile/recruiter (protected, RECRUITER only)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';
import { getRecruiterProfile, updateRecruiterProfile } from '../../api/profile.api';
import type { RecruiterProfile } from '../../types';
import Button from '../../components/ui/Button';

// ─── Local FieldRow (same pattern as job seeker's, with an added `required` prop) ──
// Defined here because it's specific to this file — no need to export it.
interface FieldRowProps {
  label: string;
  value?: string;
  editing: boolean;
  required?: boolean;    // Extra: shows a red * and passes required to the input
  placeholder?: string;
  name: string;
  onChange: (name: string, value: string) => void;
  multiline?: boolean;
}

function FieldRow({
  label,
  value,
  editing,
  required,
  placeholder,
  name,
  onChange,
  multiline,
}: FieldRowProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>
      {/* Label with optional red asterisk for required fields */}
      <label className="input-label" htmlFor={`profile-field-${name}`}>
        {label} {required && <span style={{ color: 'var(--color-danger)' }}>*</span>}
      </label>

      {/* Three-way conditional: editing? (multiline? textarea : input) : <p> */}
      {editing ? (
        multiline ? (
          <textarea
            id={`profile-field-${name}`}
            className="input textarea"
            value={value ?? ''}
            placeholder={placeholder}
            required={required}
            onChange={(e) => onChange(name, e.target.value)}
          />
        ) : (
          <input
            id={`profile-field-${name}`}
            className="input"
            value={value ?? ''}
            placeholder={placeholder}
            required={required}
            onChange={(e) => onChange(name, e.target.value)}
          />
        )
      ) : (
        // View mode: styled paragraph with bottom border
        <p
          style={{
            margin: 0,
            fontSize: '0.95rem',
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
            padding: '0.625rem 0',
            borderBottom: '1px solid var(--color-border)',
          }}
        >
          {value || <em style={{ opacity: 0.5 }}>Not set</em>}
        </p>
      )}
    </div>
  );
}

// ─── Main page component ──────────────────────────────────────────────────────
export default function RecruiterProfilePage() {
  // ── Triple state ──────────────────────────────────────────────────────
  const [profile, setProfile] = useState<RecruiterProfile | null>(null); // Server truth
  const [form, setForm] = useState<Partial<RecruiterProfile>>({}); // Editable draft
  const [editing, setEditing] = useState(false);

  // ── UI state ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // ── Fetch profile ─────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    getRecruiterProfile(controller.signal)
      .then((p) => {
        setProfile(p);  // Store the server copy
        setForm(p);     // Pre-populate the editable form with server data
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setError('Failed to load profile. Please try again.');
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, []);

  // ── Generic field updater ─────────────────────────────────────────────
  // Uses computed property key: [name] dynamically sets the field.
  // Example: handleChange('companyName', 'Acme')
  //   → setForm(prev => ({ ...prev, companyName: 'Acme' }))
  const handleChange = (name: string, value: string) => {
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  // ── Save handler ──────────────────────────────────────────────────────
  const handleSave = async () => {
    // Client-side validation: company name is required
    if (!form.companyName?.trim()) {
      setError('Company name is required.');
      return;
    }
    setSaving(true);
    setError('');
    try {
      // PATCH /profile/recruiter — only send the updatable fields
      const updated = await updateRecruiterProfile({
        companyName: form.companyName,
        companyWebsite: form.companyWebsite,
        description: form.description,
        industry: form.industry,
      });
      // Update both `profile` and `form` with the server's response
      setProfile(updated);
      setForm(updated);
      setEditing(false);
      setSuccess('Profile updated successfully! ✅');
      setTimeout(() => setSuccess(''), 3500); // Auto-clear after 3.5 seconds
    } catch {
      setError('Failed to save changes. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  // ── Cancel handler ────────────────────────────────────────────────────
  // Discard all edits by resetting form to the last known server state.
  const handleCancel = () => {
    setForm(profile ?? {}); // profile ?? {} handles the unlikely null case
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
      {/* maxWidth: 720 — readable form width */}
      <div className="container" style={{ maxWidth: 720 }}>

        {/* ── Identity card: avatar + name + badge + edit button ────── */}
        <div
          className="glass-strong"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            marginBottom: '1.5rem',
            display: 'flex',
            alignItems: 'center',
            gap: '1.5rem',
            flexWrap: 'wrap',
            animation: 'slideUp 0.3s ease',
          }}
        >
          {/* Company avatar circle — gradient + building emoji */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
              flexShrink: 0,
            }}
          >
            🏢
          </div>

          {/* Name + email + role badge */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1
              style={{
                margin: '0 0 0.25rem',
                fontSize: '1.6rem',
                fontWeight: 800,
                wordBreak: 'break-word', // Prevents long names overflowing
              }}
            >
              {profile?.user?.name ?? 'Recruiter'}
            </h1>
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.875rem' }}>
              {profile?.user?.email}
            </p>
            <div style={{ marginTop: '0.5rem' }}>
              {/* badge badge-blue is a global CSS class: blue-tinted pill */}
              <span className="badge badge-blue">RECRUITER</span>
            </div>
          </div>

          {/* Edit button — hidden while already editing */}
          {!editing && (
            <Button id="profile-edit-btn" variant="secondary" onClick={() => setEditing(true)}>
              ✏️ Edit Profile
            </Button>
          )}
        </div>

        {/* ── Alerts ────────────────────────────────────────────────── */}
        {success && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            {success}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {/* ── Company info form card ─────────────────────────────────── */}
        <div
          className="glass"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem',
            animation: 'slideUp 0.35s ease',
          }}
        >
          <h2 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700 }}>Company Information</h2>

          {/* Company Name — required field (shows red *) */}
          <FieldRow
            label="Company Name"
            name="companyName"
            value={form.companyName}
            editing={editing}
            required
            placeholder="Your company name"
            onChange={handleChange}
          />
          <FieldRow
            label="Industry"
            name="industry"
            value={form.industry}
            editing={editing}
            placeholder="e.g. Technology, Finance, Healthcare"
            onChange={handleChange}
          />
          <FieldRow
            label="Company Website"
            name="companyWebsite"
            value={form.companyWebsite}
            editing={editing}
            placeholder="https://yourcompany.com"
            onChange={handleChange}
          />
          {/* Description — multi-line textarea in edit mode */}
          <FieldRow
            label="Company Description"
            name="description"
            value={form.description}
            editing={editing}
            placeholder="Tell candidates about your company..."
            onChange={handleChange}
            multiline
          />

          {/* Save + Cancel buttons — only shown in edit mode */}
          {editing && (
            <div
              style={{
                display: 'flex',
                gap: '0.75rem',
                justifyContent: 'flex-end',
                paddingTop: '0.5rem',
              }}
            >
              <Button id="profile-cancel-btn" variant="ghost" onClick={handleCancel}>
                Cancel
              </Button>
              <Button id="profile-save-btn" variant="primary" loading={saving} onClick={handleSave}>
                Save Changes
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
