// ─── components/ui/Card.tsx — Reusable Card Container ────────────────────────
//
// A generic styled container for content blocks.
// Think of it as a "box with a border and background" that you can make
// clickable, hoverable, or just static.
//
// Features:
//   • Optional hover animation (card lifts on mouse hover via CSS)
//   • Optional onClick — when provided, the card becomes keyboard-accessible too
//   • Passes through any inline style
//
// Usage examples:
//   <Card>Simple content block</Card>
//   <Card hover onClick={() => navigate('/jobs/1')}>Clickable job card</Card>
//   <Card className="my-class" style={{ padding: '2rem' }}>Styled card</Card>

import type { CSSProperties, ReactNode } from 'react';

interface CardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;      // adds CSS hover effect (card lifts)
  onClick?: () => void; // makes the card clickable
  style?: CSSProperties;// inline styles (CSSProperties = type-safe React style object)
}

export default function Card({
  children,
  className = '',
  hover = false,    // default: no hover effect
  onClick,
  style,
}: CardProps) {
  return (
    <div
      // Build the class string dynamically:
      //   'card'           — always applied (base styling)
      //   'card-hover'     — only when hover=true (CSS hover animation)
      //   'cursor-pointer' — only when onClick is provided (shows hand cursor)
      className={`card ${hover ? 'card-hover' : ''} ${onClick ? 'cursor-pointer' : ''} ${className}`}
      style={style}
      onClick={onClick}

      // Accessibility: when the card is clickable, it should behave like a button.
      // role="button" tells screen readers "this is an interactive element".
      // Without a role, screen readers might skip it entirely.
      role={onClick ? 'button' : undefined}

      // tabIndex={0} makes the div focusable via the Tab key.
      // Without this, keyboard users can't reach the card.
      tabIndex={onClick ? 0 : undefined}

      // onKeyDown: allow pressing Enter to trigger the click.
      // Screen reader users expect buttons to respond to Enter key.
      // e.key === 'Enter' && onClick() — only call onClick if Enter was pressed.
      onKeyDown={onClick ? (e) => e.key === 'Enter' && onClick() : undefined}
    >
      {children}
    </div>
  );
}
