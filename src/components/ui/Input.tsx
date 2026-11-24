// ─── components/ui/Input.tsx — Reusable Input and Textarea Components ─────────
//
// Two accessible form inputs that handle the common label + input + error pattern.
//
// Features:
//   • Optional label above the input
//   • Optional error message below the input (with error styling on the input itself)
//   • forwardRef: allows parent components to access the DOM element directly
//     (needed for focus management, form libraries, etc.)
//
// Why forwardRef?
//   Normally, React components hide their internal DOM nodes. But sometimes a
//   parent needs to call .focus() on an input directly. forwardRef passes a
//   ref through to the underlying <input> or <textarea>.
//
//   Example:
//     const ref = useRef<HTMLInputElement>(null);
//     <Input ref={ref} … />
//     ref.current.focus(); // focuses the actual DOM input

import { type InputHTMLAttributes, type TextareaHTMLAttributes, forwardRef } from 'react';

// InputProps adds `label` and `error` on top of all native <input> attributes.
// By extending InputHTMLAttributes we get type, placeholder, value, onChange, etc. for free.
interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;   // shown above the input (optional)
  error?: string;   // error message shown below (optional)
}

// forwardRef<DOMType, PropsType>(renderFunction)
// The render function receives (props, ref) where ref comes from the parent.
// We pass ref to the underlying <input> so the parent can access the DOM node.
//
// Example usage:
//   <Input id="email" label="Email address" type="email" error={errors.email} />
export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', id, ...props }, ref) => (
    <div className="input-wrapper"> {/* wrapper groups label + input + error */}
      {/* Conditional rendering: only show label if the label prop is provided.
          Short-circuit: label && <JSX> renders JSX only when label is truthy */}
      {label && (
        <label htmlFor={id} className="input-label">
          {/* htmlFor links the label to the input by ID.
              Clicking the label focuses the input (accessibility). */}
          {label}
        </label>
      )}
      <input
        ref={ref}  {/* pass the forwarded ref to the DOM input */}
        id={id}    {/* must match the label's htmlFor */}
        // Apply error class when error is present — adds a red border via CSS.
        // Template literal: `input ${error ? 'input-error' : ''} ${className}`
        className={`input ${error ? 'input-error' : ''} ${className}`}
        {...props}  {/* spread: type, value, onChange, placeholder, disabled, etc. */}
      />
      {/* Show the error message below the input, if present. */}
      {error && <span className="error-msg">{error}</span>}
    </div>
  )
);
// displayName helps React DevTools show "Input" instead of "ForwardRef".
Input.displayName = 'Input';

// ── Textarea ──────────────────────────────────────────────────────────────────
// Same pattern as Input but for multi-line text (<textarea>).
// Used for job description, requirements, cover letters, bio, etc.

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, className = '', id, ...props }, ref) => (
    <div className="input-wrapper">
      {label && (
        <label htmlFor={id} className="input-label">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        id={id}
        // 'textarea' class adds extra styling (min-height, resize behavior)
        className={`input textarea ${error ? 'input-error' : ''} ${className}`}
        {...props}
      />
      {error && <span className="error-msg">{error}</span>}
    </div>
  )
);
Textarea.displayName = 'Textarea';
