// ─── JobDetailSection.tsx ────────────────────────────────────────────────────
//
// PURPOSE:
//   A tiny presentational component that renders one labeled text section
//   inside the Job Detail page (e.g. "About This Role" or "Requirements").
//
// DESIGN PATTERN:
//   "Dumb" / presentational component — it has no state and does nothing except
//   render what it receives via props.  Keeping it separate means JobDetailBody
//   stays readable and you can reuse this pattern for any titled text block.
//
// USAGE EXAMPLE:
//   <JobDetailSection title="📋 About This Role" content={job.description} />
// ─────────────────────────────────────────────────────────────────────────────

// Define the shape of the props this component expects.
// Both fields are required strings.
interface JobDetailSectionProps {
  title: string;   // The heading label (e.g. "📋 About This Role")
  content: string; // The body text to display beneath the heading
}

// Export a default function component that accepts the two props above.
// Destructuring ({ title, content }) pulls the values directly from the props object.
export default function JobDetailSection({ title, content }: JobDetailSectionProps) {
  return (
    // A plain <div> wrapper — no extra styles needed; parent controls spacing.
    <div>
      {/* Section heading */}
      <h3
        style={{
          margin: '0 0 0.75rem', // No top margin; 0.75rem gap below before the paragraph
          fontSize: '1rem',
          fontWeight: 700,
          color: 'var(--color-text-muted)', // Slightly de-emphasised vs body text
        }}
      >
        {title} {/* Renders whatever string was passed, e.g. "✅ Requirements" */}
      </h3>

      {/*
        Body text paragraph.

        Key style: whiteSpace: 'pre-wrap'
        ─────────────────────────────────
        By default HTML collapses all whitespace and ignores newlines.
        'pre-wrap' preserves newlines (\n) and whitespace runs in the string
        while still wrapping long lines to fit the container.
        This matters because job descriptions stored in the database often
        contain literal line breaks for readability.

        Example:
          content = "Must have:\n- 3 yrs React\n- TypeScript"
          Without pre-wrap → "Must have: - 3 yrs React - TypeScript"
          With pre-wrap    → three separate lines as the author intended
      */}
      <p style={{ margin: 0, lineHeight: 1.8, whiteSpace: 'pre-wrap', color: 'var(--color-text)' }}>
        {content}
      </p>
    </div>
  );
}
