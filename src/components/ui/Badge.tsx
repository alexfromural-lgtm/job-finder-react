// ─── components/ui/Badge.tsx — Colored Label Badge ───────────────────────────
//
// A small inline tag/pill used to label metadata like job location, category,
// application status, etc.
//
// Usage examples:
//   <Badge color="teal">📍 Remote</Badge>
//   <Badge color="green">💰 $80k–$120k</Badge>
//   <Badge color={statusColor[app.status]}>{app.status}</Badge>

// BadgeColor: a union type listing all valid color names.
// This prevents passing an invalid color like color="pink".
type BadgeColor = 'blue' | 'teal' | 'purple' | 'green' | 'red' | 'yellow' | 'gray';

interface BadgeProps {
  children: React.ReactNode;
  color?: BadgeColor;      // defaults to 'blue'
  className?: string;
}

// Badge: a simple <span> with dynamic CSS classes.
// badge-${color} → e.g. 'badge-teal', 'badge-green' (styled in CSS)
export default function Badge({ children, color = 'blue', className = '' }: BadgeProps) {
  return <span className={`badge badge-${color} ${className}`}>{children}</span>;
}

// ── Status-to-Color Mapping ───────────────────────────────────────────────────
// Maps ApplicationStatus strings to badge colors.
// Record<string, BadgeColor> = an object with string keys and BadgeColor values.
//
// Example usage:
//   <Badge color={statusColor['shortlisted']}>Shortlisted</Badge>
//   → <Badge color="green">Shortlisted</Badge>  → green badge
//
// This avoids repeating color logic in every component that shows an application status.
export const statusColor: Record<string, BadgeColor> = {
  submitted: 'blue',
  shortlisted: 'green',
  rejected: 'red',
  under_review: 'yellow',
};
