// ─── ProfileAlerts.tsx ───────────────────────────────────────────────────────
//
// PURPOSE:
//   Renders success and/or error alert banners for the profile page.
//   Extracted into its own component to keep ProfilePage.tsx clean.
//
// DESIGN PATTERN:
//   "Alert display only" — no logic, no state.  The parent owns the success/error
//   strings and passes them in; this component just renders them conditionally.
//
// USAGE:
//   <ProfileAlerts success={success} error={error} />
// ─────────────────────────────────────────────────────────────────────────────

interface ProfileAlertsProps {
  success: string; // Non-empty → show green success alert
  error: string;   // Non-empty → show red error alert
}

export default function ProfileAlerts({ success, error }: ProfileAlertsProps) {
  return (
    /*
      React Fragment (<>…</>) returns two siblings without wrapping them in a <div>.
      This is useful here because we may render 0, 1, or 2 alert divs depending
      on which strings are non-empty.

      Short-circuit rendering:
        success && (…)  → renders the div only when success is a non-empty string
        error   && (…)  → renders the div only when error is a non-empty string

      A falsy string ('') evaluates to false → nothing rendered.
      A truthy string ('Profile saved!') evaluates to true → div rendered.
    */
    <>
      {/* ── Success alert (green) ────────────────────────────────── */}
      {success && (
        // alert alert-success is defined in global CSS:
        //   green background + border + text colour
        <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
          {success} {/* e.g. "Profile updated successfully! ✅" */}
        </div>
      )}

      {/* ── Error alert (red) ────────────────────────────────────── */}
      {error && (
        <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
          {error} {/* e.g. "Failed to save changes. Please try again." */}
        </div>
      )}
    </>
  );
}
