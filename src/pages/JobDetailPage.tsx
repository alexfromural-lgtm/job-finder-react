// ─── JobDetailPage.tsx ───────────────────────────────────────────────────────
//
// PURPOSE:
//   Full detail view for a single job posting.  Fetches the job, checks whether
//   the current user has applied or saved it, and handles the apply modal + save
//   toggle with async queue polling.
//
// DESIGN PATTERN:
//   "Parallel async fetch with AbortController":
//     • Effect 1 fetches the job by ID.
//     • Effect 2 (job-seeker only) fetches applications + saved jobs IN PARALLEL
//       using Promise.all, sharing one AbortController.
//     • A third effect (cleanup only) aborts any in-flight save-queue poll on unmount.
//
//   "useRef for mutable side-effect references":
//     saveAbortRef holds the AbortController for the BullMQ save poll without
//     causing a re-render when it changes (useRef updates don't trigger renders).
//
//   "useCallback for stable callbacks":
//     handleApplySuccess and handleSaveToggle are wrapped in useCallback so their
//     identity stays stable across renders, preventing unnecessary child re-renders.
//
// USAGE:
//   Route: /jobs/:id
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Job } from '../types';
import * as JobsApi from '../api/jobs.api';
import { getMyApplications, getSavedJobs, saveJob, unsaveJob } from '../api/applications.api';
import { pollUntilDone } from '../api/queue.api'; // Polls BullMQ until job completes
import Button from '../components/ui/Button';
import ApplyModal from '../components/jobs/ApplyModal';
import JobDetailHeader from '../components/jobs/JobDetailHeader';
import JobDetailBody from '../components/jobs/JobDetailBody';
import { useAuth } from '../context/AuthContext';

export default function JobDetailPage() {
  // useParams reads the :id segment from the URL (/jobs/abc123 → id = 'abc123')
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  // isLoading from AuthContext: true while getMe() is in-flight on first load
  // hasRole('JOB_SEEKER') returns true if the user's role matches
  const { isAuthenticated, isLoading: isAuthLoading, hasRole } = useAuth();

  // ── Job state ─────────────────────────────────────────────────────────
  const [job, setJob] = useState<Job | null>(null);       // The fetched job object
  const [loading, setLoading] = useState(true);           // Initial fetch loading flag
  const [error, setError] = useState('');                 // Error from job fetch

  // ── Apply state ───────────────────────────────────────────────────────
  const [checkingApplication, setCheckingApplication] = useState(false);
  // applicationId: set when the user has already applied; null otherwise
  const [applicationId, setApplicationId] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false); // Apply modal visibility

  // ── Save state ────────────────────────────────────────────────────────
  const [isSaved, setIsSaved] = useState(false);          // Has the user saved this job?
  const [savingJob, setSavingJob] = useState(false);       // Save/unsave in-flight
  const [saveError, setSaveError] = useState('');          // Save error message

  /*
    useRef creates a "box" that holds a mutable value.
    Unlike useState, changing ref.current does NOT trigger a re-render.
    We use it here to hold the AbortController for the BullMQ poll so we
    can cancel it on unmount without affecting render cycles.

    Initial value: null (no poll running yet)
  */
  const saveAbortRef = useRef<AbortController | null>(null);

  // ── Effect 1: Fetch the job ───────────────────────────────────────────
  // Runs when `id` changes (i.e. whenever the route param changes).
  useEffect(() => {
    if (!id) return; // Guard: id could be undefined if route is misconfigured

    // AbortController allows us to cancel the fetch when the component unmounts
    // or when the id changes before the previous fetch completes.
    const controller = new AbortController();

    // .then(setJob) — shorthand for .then((data) => setJob(data))
    // .catch handles network errors and 404s
    // .finally always clears the loading spinner, success or failure
    JobsApi.getJobById(id, controller.signal)
      .then(setJob)
      .catch((err) => {
        // ERR_CANCELED is thrown when controller.abort() is called; ignore it
        if (err?.code === 'ERR_CANCELED') return;
        setError('Job not found or unavailable.');
      })
      .finally(() => setLoading(false));

    // Cleanup: runs before the next effect call or on unmount
    return () => controller.abort();
  }, [id]); // Only re-run when id changes

  // ── Effect 2: Check apply and save status (job seekers only) ─────────
  useEffect(() => {
    // Skip entirely for unauthenticated visitors or recruiters
    if (!id || !isAuthenticated || !hasRole('JOB_SEEKER')) return;

    const controller = new AbortController();
    setCheckingApplication(true);

    /*
      Promise.all([p1, p2]) runs BOTH promises concurrently and waits for
      both to resolve.  Faster than sequential await because network requests
      run in parallel.

      Returns: [applicationsArray, savedJobsArray]
      We destructure with [apps, saved].
    */
    Promise.all([getMyApplications(controller.signal), getSavedJobs(controller.signal)])
      .then(([apps, saved]) => {
        // Check if any of the user's applications is for this job
        // .find() returns the first matching element or undefined
        const existing = apps.find((a) => a.jobId === id);
        if (existing) setApplicationId(existing.id); // Store the application ID

        // .some() returns true if any element satisfies the predicate
        setIsSaved(saved.some((s) => s.jobId === id));
      })
      .catch(() => {
        /* Non-critical: if this check fails, the Apply button still works.
           Silently swallow the error — no need to show UI feedback. */
      })
      .finally(() => setCheckingApplication(false));

    return () => controller.abort();
  }, [id, isAuthenticated, hasRole]); // Re-run if auth state or job id changes

  // ── Effect 3: Cleanup save poll on unmount ────────────────────────────
  // This effect has an empty dependency array [] — it only runs once on mount
  // and its cleanup runs on unmount.
  // If the user navigates away while a save is polling, we abort the request.
  useEffect(() => {
    return () => {
      // Optional chaining: .abort() only called if saveAbortRef.current is not null
      saveAbortRef.current?.abort();
    };
  }, []);

  // ── Callback: Apply succeeded ─────────────────────────────────────────
  /*
    useCallback memoises a function so it's the same reference between renders.
    The function is re-created only when its dependencies change.
    Here [] means it never changes after mount — the function is stable forever.

    This avoids ApplyModal re-rendering unnecessarily (it receives this as a prop).
  */
  const handleApplySuccess = useCallback((newApplicationId: string) => {
    setApplicationId(newApplicationId); // Mark as applied
    setShowModal(false);                // Close the apply modal
  }, []); // No dependencies — stable function

  // ── Callback: Save / unsave toggle ───────────────────────────────────
  /*
    Two different flows depending on direction:
      Unsave (isSaved=true)  → synchronous DELETE /jobs/:id/unsave
      Save   (isSaved=false) → queued POST /jobs/:id/save → returns { queueJobId }
                               → poll GET /queue/job/:queueJobId until 'completed'

    useCallback deps: [id, isSaved, savingJob]
    The function re-creates when any of these change, ensuring it closes over
    the latest values.
  */
  const handleSaveToggle = useCallback(async () => {
    if (!id || savingJob) return; // Guard: don't start a second request
    setSaveError('');

    if (isSaved) {
      // ── Unsave path ─────────────────────────────────────────────────
      setSavingJob(true);
      try {
        await unsaveJob(id); // DELETE /applications/saved/:id — synchronous
        setIsSaved(false);   // Update UI immediately
      } catch {
        setSaveError('Failed to unsave. Please try again.');
      } finally {
        setSavingJob(false);
      }
    } else {
      // ── Save path (queued) ──────────────────────────────────────────
      setSavingJob(true);
      try {
        // POST /applications/save — returns { queueJobId: "abc123" }
        const { queueJobId } = await saveJob(id);

        // Create a new AbortController for this poll and store it in the ref
        // so Effect 3's cleanup can cancel it if the user navigates away.
        const controller = new AbortController();
        saveAbortRef.current = controller;

        /*
          pollUntilDone(queueJobId, intervalMs, timeoutMs, signal)
          Polls GET /queue/job/:queueJobId every 600ms up to 15 seconds.
          Resolves when status = 'completed', rejects on 'failed' or timeout.
        */
        await pollUntilDone(queueJobId, 600, 15_000, controller.signal);
        saveAbortRef.current = null; // Clear ref after successful poll

        setIsSaved(true); // Job is now saved — update UI
      } catch (err) {
        // AbortError is thrown when the controller is aborted (e.g. on unmount)
        // — silently ignore it; the user navigated away anyway.
        if (err instanceof DOMException && err.name === 'AbortError') return;
        // Any other error: show a message
        const msg = err instanceof Error ? err.message : 'Failed to save job. Please try again.';
        setSaveError(msg);
      } finally {
        setSavingJob(false);
      }
    }
  }, [id, isSaved, savingJob]); // Re-create if these values change

  // ── Loading guard ─────────────────────────────────────────────────────
  // Wait for both the job fetch AND the auth context to finish loading.
  if (loading || isAuthLoading) {
    return (
      <div className="spinner-page page">
        <div className="spinner" style={{ width: 40, height: 40 }} />
      </div>
    );
  }

  // ── Error / not found guard ───────────────────────────────────────────
  if (error || !job) {
    return (
      <div className="page">
        <div className="container">
          <div className="alert alert-error">{error || 'Job not found.'}</div>
          {/* navigate(-1) goes back one step in the browser history */}
          <Button variant="ghost" onClick={() => navigate(-1)} style={{ marginTop: '1rem' }}>
            ← Go Back
          </Button>
        </div>
      </div>
    );
  }

  // ── Main render ───────────────────────────────────────────────────────
  return (
    /*
      React Fragment (<>…</>) returns two siblings without a wrapper div.
      This matters here because the Apply Modal needs to be a sibling of the
      page div (not a descendant) for proper CSS stacking context / z-index.
    */
    <>
      <div className="page hero-gradient">
        <div className="container" style={{ maxWidth: 820 }}>

          {/* ── Back navigation button ────────────────────────────── */}
          {/*
            Raw <button> (not our Button component) so we can fully control
            its appearance (no background, no border — looks like a text link).
            navigate(-1) goes one step back in history (like the browser's back button).
          */}
          <button
            onClick={() => navigate(-1)}
            style={{
              background: 'none',
              border: 'none',
              color: 'var(--color-text-muted)',
              cursor: 'pointer',
              fontSize: '0.875rem',
              marginBottom: '1.5rem',
              padding: 0,
              fontFamily: 'Inter, sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem',
            }}
          >
            ← Back to Jobs
          </button>

          {/* ── Header card: title + badges + CTA ────────────────── */}
          {/*
            Prop drilling: all state values + handlers are passed down through
            JobDetailHeader → JobDetailCTA.  The page owns the state; the child
            components just receive and display it.
          */}
          <JobDetailHeader
            job={job}
            isAuthenticated={isAuthenticated}
            isJobSeeker={hasRole('JOB_SEEKER')}
            checkingApplication={checkingApplication}
            applicationId={applicationId}
            isSaved={isSaved}
            savingJob={savingJob}
            saveError={saveError}
            onApplyClick={() => setShowModal(true)}
            onSaveClick={handleSaveToggle}
          />

          {/* ── Body: description + requirements + website ────────── */}
          <JobDetailBody job={job} />
        </div>
      </div>

      {/*
        Apply Modal — rendered OUTSIDE the page div so it appears above
        all page content in the CSS stacking context.

        The double condition {showModal && job && (…)} guards against
        rendering when either value is falsy.
      */}
      {showModal && job && (
        <ApplyModal
          jobId={job.id}
          jobTitle={job.title}
          companyName={job.recruiter?.companyName} // Optional chaining — may be undefined
          onSuccess={handleApplySuccess}
          onClose={() => setShowModal(false)}
        />
      )}
    </>
  );
}
