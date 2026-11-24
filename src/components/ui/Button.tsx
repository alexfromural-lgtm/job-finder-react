// ─── components/ui/Button.tsx — Reusable Button Component ────────────────────
//
// A flexible, styled button that supports:
//   • 4 visual variants: primary, secondary, danger, ghost
//   • 3 sizes: sm, md (default), lg
//   • A loading state (shows a spinner and disables the button)
//
// Design pattern: "extends HTML attributes"
// ButtonHTMLAttributes<HTMLButtonElement> gives us ALL native button props
// (onClick, type, disabled, aria-*, data-*, etc.) for free.
// We only ADD our custom props (variant, size, loading) on top.
//
// Usage examples:
//   <Button>Submit</Button>
//   <Button variant="danger" size="sm" onClick={handleDelete}>Delete</Button>
//   <Button loading={isSubmitting}>Saving…</Button>  ← spinner + auto-disabled
//   <Button variant="ghost" size="lg" disabled>Unavailable</Button>

import { type ButtonHTMLAttributes, type ReactNode } from 'react';

// ButtonProps extends ALL native <button> HTML attributes.
// This means you can pass any <button> prop to <Button>:
//   <Button type="submit" aria-label="Submit form" data-testid="submit-btn">…</Button>
interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  children: ReactNode;  // ReactNode accepts string, JSX, or null
}

// Default parameter values via destructuring:
//   variant = 'primary'  → used if no variant prop is passed
//   size = 'md'          → used if no size prop is passed
//   loading = false      → used if no loading prop is passed
//
// ...props collects ALL remaining HTML attributes (onClick, type, etc.)
// and spreads them onto the <button> element below.
export default function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  children,
  className = '',
  disabled,
  ...props // remaining HTML button attributes
}: ButtonProps) {
  // Build CSS class strings from props.
  // 'btn-sm', 'btn-lg', or '' (empty string for md — base 'btn' already styles it)
  const sizeClass = size === 'sm' ? 'btn-sm' : size === 'lg' ? 'btn-lg' : '';
  // 'btn-primary', 'btn-secondary', 'btn-danger', 'btn-ghost'
  const variantClass = `btn-${variant}`;

  return (
    <button
      // Template literal concatenates all classes. Extra spaces don't matter in CSS.
      className={`btn ${variantClass} ${sizeClass} ${className}`}
      // Disable the button if either explicitly disabled OR if loading.
      // This prevents double-clicks on forms.
      // || = logical OR: true if either condition is true
      disabled={disabled || loading}
      // ...props spreads onClick, type, aria-*, etc. onto the native <button>
      {...props}
    >
      {/* Conditional rendering: show spinner during loading, children otherwise.
          Ternary: condition ? ifTrue : ifFalse
          Example: loading=true → <span className="spinner" />
                   loading=false → "Submit"  */}
      {loading ? <span className="spinner" /> : children}
    </button>
  );
}
