// ─── DashboardPage.tsx (Recruiter) ───────────────────────────────────────────
//
// PURPOSE:
//   The recruiter's main dashboard: shows all their job postings in a card grid.
//   Three modal-driven actions: Create, Edit, and Delete a job posting.
//
// DESIGN PATTERN:
//   "Modal-driven CRUD with optimistic refresh":
//     • Each action (create/edit/delete) opens a Modal
//     • On success, calls fetchJobs() to re-fetch the latest list from the server
//     • A `flash(msg)` helper shows a timed success banner that auto-clears
//
//   "useCallback for stable fetch":
//     fetchJobs is wrapped in useCallback so it can be a dependency of the
//     useEffect without causing an infinite re-fetch loop.
//
// USAGE:
//   Route: /dashboard/recruiter (protected, RECRUITER only)
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import * as JobsApi from '../../api/jobs.api'; // createJob, updateJob, deleteJob, getRecruiterJobs
import type { Job, JobFormData } from '../../types';
import JobCard from '../../components/jobs/JobCard';   // Job listing card component
import JobForm from '../../components/jobs/JobForm';   // Create/edit form component
import Button from '../../components/ui/Button';
import Modal from '../../components/ui/Modal';         // Portal-based modal overlay
import { extractApiError } from '../../utils/apiError';
import { usePageTitle } from '../../hooks/usePageTitle';

export default function RecruiterDashboard() {
  const { user } = useAuth();     // For the personalised greeting
  const [jobs, setJobs] = useState<Job[]>([]);      // All recruiter's jobs
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  usePageTitle('My Job Postings'); // Sets browser tab title

  // ── Modal state ───────────────────────────────────────────────────────
  // Three separate modals: Create, Edit, Delete
  const [createOpen, setCreateOpen] = useState(false); // Create modal visible?
  const [editJob, setEditJob] = useState<Job | null>(null); // null = edit modal closed
  const [deleteTarget, setDeleteTarget] = useState<Job | null>(null); // null = confirm closed
  const [deleteLoading, setDeleteLoading] = useState(false); // Delete API in-flight
  const [successMsg, setSuccessMsg] = useState(''); // Auto-clearing success banner

  // ── fetchJobs ─────────────────────────────────────────────────────────
  /*
    useCallback memoises the function.
    [] as dependency array: the function is only created once (stable reference).
    This matters because fetchJobs is listed in useEffect's dependency array below:
    if fetchJobs wasn't stable, useEffect would re-run every render, causing an
    infinite fetch loop.
  */
  const fetchJobs = useCallback(async (signal?: AbortSignal) => {
    setLoading(true);
    try {
      const data = await JobsApi.getRecruiterJobs(signal); // GET /jobs/mine
      setJobs(data);
    } catch (err: unknown) {
      // Check for axios cancel error (not a real error)
      if ((err as { code?: string })?.code === 'ERR_CANCELED') return;
      setError(extractApiError(err, 'Failed to load your job postings.'));
    } finally {
      setLoading(false);
    }
  }, []); // No dependencies → stable reference

  // ── Mount effect: initial fetch ───────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    fetchJobs(controller.signal);
    return () => controller.abort(); // Cancel on unmount
  }, [fetchJobs]); // fetchJobs is stable due to useCallback above

  // ── flash: timed success message ──────────────────────────────────────
  // Shows a message for 3 seconds then clears it.
  // setTimeout returns a timer ID, but we don't need to clear it here because
  // the state update ('') after 3s is harmless if the component unmounted.
  const flash = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(''), 3000); // Auto-clear after 3 seconds
  };

  // ── Create handler ────────────────────────────────────────────────────
  // Called by JobForm's onSubmit when in create mode.
  // No try/catch here: errors are caught by JobForm's internal handler which
  // shows them inside the form itself.
  const handleCreate = async (data: JobFormData) => {
    await JobsApi.createJob(data);     // POST /jobs
    setCreateOpen(false);              // Close the create modal
    flash('Job posting created successfully! 🎉');
    await fetchJobs();                 // Re-fetch the updated list
  };

  // ── Edit handler ──────────────────────────────────────────────────────
  // Called by JobForm's onSubmit when in edit mode.
  const handleEdit = async (data: JobFormData) => {
    if (!editJob) return; // Safety guard
    await JobsApi.updateJob(editJob.id, data); // PATCH /jobs/:id
    setEditJob(null);                          // Close the edit modal
    flash('Job updated successfully!');
    await fetchJobs();                         // Re-fetch
  };

  // ── Delete handler ────────────────────────────────────────────────────
  // Called when the user confirms deletion in the confirm modal.
  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await JobsApi.deleteJob(deleteTarget.id); // DELETE /jobs/:id
      setDeleteTarget(null);                    // Close the confirm modal
      flash('Job deleted.');
      await fetchJobs();                        // Re-fetch
    } catch (err) {
      setError(extractApiError(err, 'Failed to delete job.'));
    } finally {
      setDeleteLoading(false);
    }
  };

  // ── Derived state ─────────────────────────────────────────────────────
  // Count active jobs without a separate state variable.
  // .filter returns a new array; .length gives the count.
  const activeJobs = jobs.filter((j) => j.isActive);

  return (
    <div className="page hero-gradient">
      <div className="container">

        {/* ── Header card ───────────────────────────────────────────── */}
        <div
          className="glass-strong"
          style={{
            borderRadius: 'var(--radius-xl)',
            padding: '2rem',
            marginBottom: '2rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '1.25rem',
            animation: 'slideUp 0.3s ease',
          }}
        >
          <div>
            <h1 style={{ margin: '0 0 0.25rem', fontSize: '1.6rem', fontWeight: 800 }}>
              My Job Postings
            </h1>
            {/* user?.name?.split(' ')[0] extracts the first name from the full name */}
            <p style={{ margin: 0, color: 'var(--color-text-muted)', fontSize: '0.9rem' }}>
              Welcome back, {user?.name?.split(' ')[0]}. Manage your listings, find the right
              candidate.
            </p>
          </div>

          {/* Stats + Create button */}
          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {/*
              Inline array.map() for two stat chips — avoids repeating the chip div.
              Each item in the array is { label, value, color }.
            */}
            {[
              { label: 'Total', value: jobs.length, color: 'var(--color-primary)' },
              { label: 'Active', value: activeJobs.length, color: 'var(--color-success)' },
            ].map((s) => (
              <div
                key={s.label}
                className="glass"
                style={{
                  padding: '0.75rem 1.25rem',
                  borderRadius: 'var(--radius-md)',
                  textAlign: 'center',
                }}
              >
                <div style={{ fontSize: '1.5rem', fontWeight: 800, color: s.color }}>{s.value}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)' }}>
                  {s.label}
                </div>
              </div>
            ))}
            {/* Opens the Create Job modal */}
            <Button
              id="create-job-btn"
              variant="primary"
              size="lg"
              onClick={() => setCreateOpen(true)}
            >
              + Post New Job
            </Button>
          </div>
        </div>

        {/* ── Alerts ───────────────────────────────────────────────── */}
        {successMsg && (
          <div className="alert alert-success" style={{ marginBottom: '1.25rem' }}>
            {successMsg}
          </div>
        )}
        {error && (
          <div className="alert alert-error" style={{ marginBottom: '1.25rem' }}>
            {error}
          </div>
        )}

        {/* ── Job list: loading / empty / grid ──────────────────────── */}
        {loading ? (
          // Spinner while fetching
          <div className="spinner-page">
            <div className="spinner" style={{ width: 36, height: 36 }} />
          </div>
        ) : jobs.length === 0 ? (
          // Empty state card
          <div
            className="glass"
            style={{ textAlign: 'center', padding: '4rem 2rem', borderRadius: 'var(--radius-xl)' }}
          >
            <div style={{ fontSize: '3.5rem', marginBottom: '1rem' }}>📭</div>
            <h3 style={{ margin: '0 0 0.5rem', fontSize: '1.2rem', fontWeight: 700 }}>
              No job postings yet
            </h3>
            <p style={{ margin: '0 0 1.5rem', color: 'var(--color-text-muted)' }}>
              Create your first job posting to start finding candidates.
            </p>
            <Button id="empty-create-btn" variant="primary" onClick={() => setCreateOpen(true)}>
              Post Your First Job
            </Button>
          </div>
        ) : (
          // CSS grid of job cards with Edit + Delete action buttons
          <div className="grid-jobs">
            {jobs.map((job) => (
              <JobCard
                key={job.id}
                job={job}
                // `actions` prop: a React Fragment with two buttons, rendered inside JobCard
                actions={
                  <>
                    {/* Edit: sets editJob → opens the Edit modal with this job's data */}
                    <Button
                      id={`edit-job-${job.id}`}
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditJob(job)}
                    >
                      Edit
                    </Button>
                    {/* Delete: sets deleteTarget → opens the confirmation modal */}
                    <Button
                      id={`delete-job-${job.id}`}
                      variant="danger"
                      size="sm"
                      onClick={() => setDeleteTarget(job)}
                    >
                      Delete
                    </Button>
                  </>
                }
              />
            ))}
          </div>
        )}
      </div>

      {/* ── Create Job Modal ──────────────────────────────────────── */}
      {/* Modal is a portal-based overlay (renders in document.body, above everything) */}
      <Modal isOpen={createOpen} onClose={() => setCreateOpen(false)} title="✨ Post New Job">
        {/* JobForm with no `initial` → create mode */}
        <JobForm
          onSubmit={handleCreate}
          onCancel={() => setCreateOpen(false)}
          submitLabel="Post Job"
        />
      </Modal>

      {/* ── Edit Job Modal ────────────────────────────────────────── */}
      {/* isOpen={!!editJob}: !! converts Job|null to boolean */}
      <Modal isOpen={!!editJob} onClose={() => setEditJob(null)} title="✏️ Edit Job Posting">
        {/* Only render JobForm when editJob is not null (TypeScript guard) */}
        {editJob && (
          <JobForm
            initial={editJob}        // Pre-populates the form with the job's current data
            onSubmit={handleEdit}
            onCancel={() => setEditJob(null)}
            submitLabel="Save Changes"
          />
        )}
      </Modal>

      {/* ── Delete Confirmation Modal ─────────────────────────────── */}
      <Modal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        title="Delete Job Posting"
        maxWidth="400px"  // Narrower width for a simple confirm dialog
      >
        <p style={{ color: 'var(--color-text-muted)', marginBottom: '1.5rem' }}>
          Are you sure you want to delete{' '}
          {/* deleteTarget?.title — optional chain in case deleteTarget is null */}
          <strong style={{ color: 'var(--color-text)' }}>"{deleteTarget?.title}"</strong>? This
          action cannot be undone.
        </p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
          <Button variant="ghost" onClick={() => setDeleteTarget(null)}>
            Cancel
          </Button>
          {/* Confirm delete — shows spinner while API call runs */}
          <Button
            id="confirm-delete-btn"
            variant="danger"
            loading={deleteLoading}
            onClick={handleDelete}
          >
            Delete Job
          </Button>
        </div>
      </Modal>
    </div>
  );
}
