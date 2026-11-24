// ─── components/jobs/ApplyModal.tsx — Job Application Dialog ──────────────────
//
// A modal that lets a job seeker apply to a job with an optional cover letter.
// The application is submitted asynchronously via the job queue.
//
// Flow:
//   1. User clicks "Apply Now" on the job detail page
//   2. This modal opens (isOpen=true via JobDetailPage state)
//   3. User optionally types a cover letter
//   4. User clicks "Submit Application"
//   5. POST /jobseeker/apply/:jobId → receives { queueJobId }
//   6. Poll GET /queue/job/:queueJobId until completed or failed
//   7. On success: call onSuccess(applicationId), close modal
//   8. On failure: show error message
//
// AbortController: cancels in-flight requests when the modal closes mid-poll.
// This prevents the poll from updating state after the component unmounts.

import { useState, useRef, useEffect } from 'react';
import { applyToJob } from '../../api/applications.api';
import { pollUntilDone } from '../../api/queue.api';
import Button from '../ui/Button';

interface Props {
  jobId: string;
  jobTitle: string;
  companyName?: string;
  onSuccess: (applicationId: string) => void; // called when application is confirmed
  onClose: () => void;
}

export default function ApplyModal({ jobId, jobTitle, companyName, onSuccess, onClose }: Props) {
  const [coverLetter, setCoverLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // abortRef: holds an AbortController so we can cancel the poll when the modal closes.
  // We use useRef (not useState) because changing it shouldn't trigger a re-render.
  const abortRef = useRef<AbortController | null>(null);

  // Cleanup effect: abort any in-flight poll when the modal unmounts.
  // This handles the case where the user closes the modal while polling is in progress.
  useEffect(() => {
    return () => {
      abortRef.current?.abort(); // ?. = safe to call even if abortRef.current is null
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); // prevent default form submission (page reload)
    setLoading(true);
    setError('');

    // Create a new AbortController for this submission attempt.
    const controller = new AbortController();
    abortRef.current = controller;

    try {
      // Step 5: POST the application — backend queues the work and returns immediately.
      // The 202 Accepted response contains a queueJobId for polling.
      const { queueJobId } = await applyToJob(jobId, coverLetter || undefined);
      // coverLetter || undefined — send undefined instead of empty string
      // so the backend can tell "no cover letter" from "empty cover letter"

      // Step 6: Poll until the queue job completes.
      // pollUntilDone returns the final QueueJobResult.
      // We pass the signal so the poll stops if the modal closes.
      const result = await pollUntilDone(queueJobId, 600, 30_000, controller.signal);

      // Step 7: Extract the application ID from the queue result.
      // The backend stores the new application ID in result.result.
      // We cast to { applicationId: string } because we know the shape.
      const applicationId = (result.result as { applicationId?: string })?.applicationId ?? '';

      onSuccess(applicationId); // notify the parent — it will update its state
    } catch (err) {
      // Ignore abort errors — these happen when the user closes the modal mid-poll.
      if (err instanceof DOMException && err.name === 'AbortError') return;
      setError(err instanceof Error ? err.message : 'Application failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    // We render the modal inline (not using the Modal component) so we can
    // keep it as a simple overlay without the extra abstraction.
    <div
      className="modal-overlay"
      onClick={onClose} // click backdrop → close
      role="dialog"
      aria-modal="true"
      aria-labelledby="apply-modal-title"
    >
      {/* e.stopPropagation() prevents clicks inside from closing the modal */}
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div className="modal-header">
          <h2 id="apply-modal-title" className="modal-title">Apply for this Role</h2>
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">✕</Button>
        </div>

        {/* Job info */}
        <p style={{ margin: '0 0 1.25rem', fontSize: '0.9rem', color: 'var(--color-text-muted)' }}>
          <strong style={{ color: 'var(--color-text)' }}>{jobTitle}</strong>
          {companyName && <> at {companyName}</>}
          {/* <> at {companyName}</> — React Fragment with text before the company name */}
        </p>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {error && <div className="alert alert-error">{error}</div>}

          <div className="input-wrapper">
            <label htmlFor="cover-letter" className="input-label">
              Cover Letter <span style={{ color: 'var(--color-text-muted)', fontWeight: 400 }}>(optional)</span>
            </label>
            <textarea
              id="cover-letter"
              className="input textarea"
              placeholder="Tell the recruiter why you're a great fit..."
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              style={{ minHeight: 140 }}
            />
          </div>

          {/* Footer buttons */}
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
            <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button id="submit-application-btn" type="submit" variant="primary" loading={loading}>
              {loading ? 'Submitting…' : 'Submit Application →'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
