// ─── FieldRow.tsx ────────────────────────────────────────────────────────────
//
// PURPOSE:
//   A single labelled form field that switches between two modes:
//     • View mode (editing=false): displays the value as a <p> with an underline
//     • Edit mode (editing=true):  shows an <input> or <textarea> (if multiline)
//
// DESIGN PATTERN:
//   "View/Edit duality" — the same component renders both the read-only display
//   and the editable input.  The parent controls the mode via the `editing` prop.
//   This keeps profile sections clean: add a FieldRow and get both display and
//   edit for free.
//
// USAGE EXAMPLE:
//   <FieldRow
//     label="Location"
//     name="location"
//     value={form.location}
//     editing={editing}
//     placeholder="e.g. San Francisco, CA"
//     onChange={handleChange}
//   />
// ─────────────────────────────────────────────────────────────────────────────

// Props exported so parent components can reference the type if needed
export interface FieldRowProps {
  label: string;                           // Label text shown above the field
  value?: string;                          // Current field value (undefined → "Not set")
  editing: boolean;                        // true = edit mode, false = view mode
  placeholder?: string;                    // Hint text in the input when empty
  name: string;                            // Field key passed back to onChange
  onChange: (name: string, value: string) => void; // Generic updater from parent
  multiline?: boolean;                     // true → <textarea>, false → <input>
}

export default function FieldRow({
  label,
  value,
  editing,
  placeholder,
  name,
  onChange,
  multiline,
}: FieldRowProps) {
  return (
    // Column flex container: label on top, field below
    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.375rem' }}>

      {/* Label — clicking it focuses the matching input (htmlFor links them) */}
      {/*
        htmlFor={`profile-field-${name}`}
        Uses a template literal to build a unique id.
        Example: name='bio' → htmlFor='profile-field-bio'
        This matches the id on the input/textarea below.
      */}
      <label className="input-label" htmlFor={`profile-field-${name}`}>
        {label}
      </label>

      {/*
        Conditional rendering with nested ternaries:
          editing ? (
            multiline ? <textarea> : <input>
          ) : (
            <p> (view mode)
          )

        This tree:
          editing=false                 → <p> view mode
          editing=true, multiline=false → <input> (single line)
          editing=true, multiline=true  → <textarea> (multi-line)
      */}
      {editing ? (
        multiline ? (
          // Multi-line edit mode
          <textarea
            id={`profile-field-${name}`}
            className="input textarea" // textarea adds min-height from global CSS
            value={value ?? ''}        // ?? '' prevents "controlled → uncontrolled" React warning
            placeholder={placeholder}
            onChange={(e) => onChange(name, e.target.value)}
            // onChange calls the parent's handleChange(name, value)
            // so the parent's form state is updated: { ...prev, [name]: e.target.value }
          />
        ) : (
          // Single-line edit mode
          <input
            id={`profile-field-${name}`}
            className="input"
            value={value ?? ''}
            placeholder={placeholder}
            onChange={(e) => onChange(name, e.target.value)}
          />
        )
      ) : (
        // ── View mode ─────────────────────────────────────────────────
        // Styled as a text paragraph with a bottom border (like an underline).
        <p
          style={{
            margin: 0,
            fontSize: '0.95rem',
            // Colour changes based on whether a value exists:
            //   has value → primary text colour
            //   empty     → muted colour (same as placeholder)
            color: value ? 'var(--color-text)' : 'var(--color-text-muted)',
            padding: '0.625rem 0',
            borderBottom: '1px solid var(--color-border)', // Underline-style separator
          }}
        >
          {/*
            value || <em>Not set</em>
            If value is a non-empty string, render it.
            Otherwise render an italic "Not set" placeholder.

            Note: || (OR) treats empty string '' as falsy, which is correct here.
          */}
          {value || <em style={{ opacity: 0.5 }}>Not set</em>}
        </p>
      )}
    </div>
  );
}
