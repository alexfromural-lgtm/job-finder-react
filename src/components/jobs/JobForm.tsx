// ─── JobForm.tsx ─────────────────────────────────────────────────────────────
//
// PURPOSE:
//   A controlled form component for creating or editing a job posting.
//   Used by the Recruiter Dashboard inside a Modal.
//
// DESIGN PATTERN:
//   "Controlled form" — every input's value is stored in React state (`form`).
//   The curried setter `set(field)` returns an event handler bound to that
//   field, eliminating a separate onChange function per input.
//
//   "Client validation before submit" — required fields are checked in
//   `validate()` before the API call; individual field errors are displayed
//   beneath each input via the Input component's `error` prop.
//
// USAGE:
//   // Create mode (no initial data)
//   <JobForm onSubmit={handleCreate} onCancel={closeModal} submitLabel="Post Job" />
//
//   // Edit mode (pre-populate fields)
//   <JobForm initial={existingJob} onSubmit={handleEdit} submitLabel="Save Changes" />
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect } from 'react';        // State + side-effect hooks
import type { JobFormData, Job } from '../../types'; // Data shape types
import { Input, Textarea } from '../ui/Input';       // Labelled input + textarea
import Button from '../ui/Button';                   // Reusable button
import { extractApiError } from '../../utils/apiError'; // Normalises API errors to strings

// Props the parent (RecruiterDashboard) passes in
interface JobFormProps {
  initial?: Partial<Job>;                           // Pre-fill form for edit mode
  onSubmit: (data: JobFormData) => Promise<void>;   // Parent's create or update handler
  onCancel?: () => void;                            // Close button (optional)
  submitLabel?: string;                             // "Post Job" or "Save Changes"
}

// Fixed list of category options for the <select> dropdown
const CATEGORIES = [
  'Engineering',
  'Design',
  'Marketing',
  'Sales',
  'Finance',
  'Operations',
  'HR',
  'Legal',
  'Product',
  'Data',
  'Customer Support',
  'Other',
];

export default function JobForm({
  initial,
  onSubmit,
  onCancel,
  submitLabel = 'Post Job', // Default value used when prop is not provided
}: JobFormProps) {

  // ── Form state ─────────────────────────────────────────────────────────
  // `form` holds the current value of every field.  Initialised from `initial`
  // props (edit mode) or empty strings (create mode).
  //
  // initial?.title ?? ''  means:
  //   if initial is undefined/null → ''
  //   if initial.title is undefined/null → ''
  //   otherwise → initial.title
  const [form, setForm] = useState<JobFormData>({
    title: initial?.title ?? '',
    description: initial?.description ?? '',
    requirements: initial?.requirements ?? '',
    location: initial?.location ?? '',
    salaryRange: initial?.salaryRange ?? '',
    category: initial?.category ?? '',
  });

  // Per-field validation error messages
  // Partial<Record<K,V>> means every key is optional (may be undefined or string).
  const [errors, setErrors] = useState<Partial<Record<keyof JobFormData, string>>>({});

  // True while the API call is running
  const [loading, setLoading] = useState(false);

  // Server-side error shown above the form
  const [serverError, setServerError] = useState('');

  // ── Sync form with updated `initial` prop ─────────────────────────────
  // When the parent opens the edit modal for a *different* job, `initial` changes.
  // This useEffect keeps the form in sync.
  //
  // Dependency array [initial]: only re-run when initial changes.
  useEffect(() => {
    if (initial) {
      setForm({
        title: initial.title ?? '',
        description: initial.description ?? '',
        requirements: initial.requirements ?? '',
        location: initial.location ?? '',
        salaryRange: initial.salaryRange ?? '',
        category: initial.category ?? '',
      });
    }
  }, [initial]); // <-- runs whenever the `initial` prop object reference changes

  // ── Curried field setter ───────────────────────────────────────────────
  // `set` is a function that takes a field name and returns an event handler.
  //
  // Why curry?  It avoids writing a separate handler for each input:
  //   onChange={set('title')}   instead of  onChange={(e) => setForm({…, title: e.target.value})}
  //
  // How it works:
  //   set('title')   → returns (e) => { setForm(prev => ({...prev, title: e.target.value})); … }
  //   set('location')→ returns a similar handler for the 'location' field
  //
  // keyof JobFormData is a union of the form field names: 'title'|'description'|…
  // React.ChangeEvent<…> is the event emitted by input, textarea, and select elements.
  const set =
    (field: keyof JobFormData) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
      // Spread prev (copy all existing fields) and override just the changed field.
      // [field] uses a computed property name: the bracket notation makes `field`
      // the actual key name.  Example: [field] = 'title' → { ...prev, title: e.target.value }
      setForm((prev) => ({ ...prev, [field]: e.target.value }));

      // Clear the error for this field as soon as the user starts typing
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    };

  // ── Client-side validation ─────────────────────────────────────────────
  // Checks required fields before making an API call.
  // Returns true if all required fields pass, false otherwise.
  const validate = (): boolean => {
    const errs: typeof errors = {}; // `typeof errors` = Partial<Record<keyof JobFormData, string>>

    // .trim() removes leading/trailing whitespace so "   " counts as empty
    if (!form.title.trim()) errs.title = 'Title is required';
    if (!form.description.trim()) errs.description = 'Description is required';
    if (!form.requirements.trim()) errs.requirements = 'Requirements are required';
    if (!form.location.trim()) errs.location = 'Location is required';

    setErrors(errs); // Update state so error messages appear beneath each input

    // Object.keys(errs).length === 0  means no errors were found
    return Object.keys(errs).length === 0;
  };

  // ── Form submission ────────────────────────────────────────────────────
  // e is the native form submit event.
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // Stop the browser's default page reload on form submit

    if (!validate()) return; // Abort if client validation fails

    setLoading(true);
    setServerError('');

    try {
      await onSubmit({
        ...form, // Spread all form fields
        // Convert empty strings to undefined for optional fields:
        // The API ignores undefined keys but may reject empty strings.
        salaryRange: form.salaryRange || undefined,
        category: form.category || undefined,
      });
      // On success the parent closes the modal — no code needed here.
    } catch (err) {
      // extractApiError normalises the error to a human-readable string.
      setServerError(extractApiError(err, 'Something went wrong'));
    } finally {
      setLoading(false); // Always re-enable the button, success or failure
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    // noValidate disables the browser's native validation UI so our custom
    // error messages (via the `errors` state) show instead.
    <form
      onSubmit={handleSubmit}
      noValidate
      style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}
    >
      {/* Show server error at the top of the form if the API call failed */}
      {serverError && <div className="alert alert-error">{serverError}</div>}

      {/* Job Title — required, full width */}
      <Input
        id="job-title"
        label="Job Title *"
        placeholder="e.g. Senior React Developer"
        value={form.title}
        onChange={set('title')}  // set('title') returns the onChange handler
        error={errors.title}     // Shown as red text beneath the input
      />

      {/* Two-column grid: Location + Salary side-by-side */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
        <Input
          id="job-location"
          label="Location *"
          placeholder="e.g. New York, NY / Remote"
          value={form.location}
          onChange={set('location')}
          error={errors.location}
        />
        {/* Salary is optional — no `error` prop */}
        <Input
          id="job-salary"
          label="Salary Range"
          placeholder="e.g. $80,000 – $120,000"
          value={form.salaryRange ?? ''}  // ?? '' handles undefined gracefully
          onChange={set('salaryRange')}
        />
      </div>

      {/* Category dropdown — optional, uses native <select> */}
      <div className="input-wrapper">
        <label htmlFor="job-category" className="input-label">
          Category
        </label>
        {/* <select> is controlled via value + onChange like any other input */}
        <select
          id="job-category"
          className="input"
          value={form.category ?? ''} // Controlled value — drives which <option> is selected
          onChange={set('category')}  // Updates form.category when user selects an option
        >
          <option value="">Select a category</option>
          {/*
            CATEGORIES.map() creates one <option> per category string.
            key={c} is required by React for list reconciliation.
            value={c} is what gets stored in form.category when selected.
          */}
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Description — required, multi-line textarea */}
      <Textarea
        id="job-description"
        label="Job Description *"
        placeholder="Describe the role, responsibilities, and what makes it exciting..."
        value={form.description}
        onChange={set('description')}
        error={errors.description}
        style={{ minHeight: 120 }} // Taller than default for readability
      />

      {/* Requirements — required, multi-line textarea */}
      <Textarea
        id="job-requirements"
        label="Requirements *"
        placeholder="List skills, experience, and qualifications..."
        value={form.requirements}
        onChange={set('requirements')}
        error={errors.requirements}
        style={{ minHeight: 100 }}
      />

      {/* Action buttons — right-aligned */}
      <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
        {/*
          onCancel is optional. The && short-circuit renders the Cancel button
          only when the parent provided an onCancel callback.
        */}
        {onCancel && (
          <Button type="button" variant="ghost" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
        )}
        {/* Submit button — shows spinner when loading=true */}
        <Button id="job-form-submit" type="submit" loading={loading}>
          {submitLabel} {/* "Post Job" or "Save Changes" depending on context */}
        </Button>
      </div>
    </form>
  );
}
