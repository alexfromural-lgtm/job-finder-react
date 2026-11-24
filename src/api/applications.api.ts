// ─── api/applications.api.ts — Applications & Saved Jobs API ─────────────────
//
// This file covers the job seeker's core actions:
//   • Apply to a job (queued — asynchronous)
//   • Save / unsave a job (save is queued, unsave is synchronous)
//   • List applications and saved jobs (synchronous reads)
//   • Withdraw an application (synchronous DELETE)
//
// What does "queued" mean?
//   Some operations (apply, save) are processed asynchronously by the backend
//   via a BullMQ job queue. The API returns 202 Accepted immediately with a
//   queue job ID, and the actual work happens in a background worker.
//   We poll GET /queue/job/:id until the status becomes "completed" or "failed".
//
//   This pattern prevents slow database writes from blocking the HTTP response.

import axiosClient from './axiosClient';
import type { Application, SavedJob } from '../types';

// ─── Queued response shape (202 Accepted) ─────────────────────────────────────

// When the server responds with 202 Accepted (the action is queued),
// it always returns this shape.
// queueJobId is used to poll GET /queue/job/:id for the final result.
export interface QueuedResponse {
  queueJobId: string | number;
  status: 'queued';
}

// ─── Apply to Job ─────────────────────────────────────────────────────────────

/**
 * POST /api/jobseeker/apply/:jobId
 *
 * Submits a job application asynchronously via the queue.
 * Returns immediately with { queueJobId, status: 'queued' }.
 * Use pollUntilDone(queueJobId) from queue.api.ts to wait for completion.
 *
 * Example:
 *   const { queueJobId } = await applyToJob('job-123', 'I am passionate about...');
 *   const result = await pollUntilDone(queueJobId);
 *   // result.status === 'completed' → application was saved
 */
export const applyToJob = async (jobId: string, coverLetter?: string): Promise<QueuedResponse> => {
  const { data } = await axiosClient.post<QueuedResponse>(`/jobseeker/apply/${jobId}`, {
    coverLetter,  // optional — users can skip writing a cover letter
  });
  return data;
};

// ─── Saved Jobs (reads) ───────────────────────────────────────────────────────

// getSavedJobs — returns all jobs the current user has bookmarked.
// The job details (title, location, etc.) are embedded in each SavedJob.
//
// Example:
//   const saved = await getSavedJobs();
//   saved[0].job?.title  // 'Senior React Developer'
//   saved[0].savedAt     // '2024-01-15T10:30:00Z'
export const getSavedJobs = async (signal?: AbortSignal): Promise<SavedJob[]> => {
  const {
    data: { savedJobs },
  } = await axiosClient.get<{ savedJobs: SavedJob[] }>('/jobseeker/saved', { signal });
  return savedJobs;
};

// ─── Save / Unsave Job ────────────────────────────────────────────────────────

/**
 * POST /api/jobseeker/saved/:jobId — bookmark a job (queued).
 *
 * Like applying, saving is processed asynchronously. This prevents duplicate
 * saves and allows retry logic in the backend worker.
 *
 * Example:
 *   const { queueJobId } = await saveJob('job-456');
 *   await pollUntilDone(queueJobId);
 *   // job is now saved!
 */
export const saveJob = async (jobId: string): Promise<QueuedResponse> => {
  const { data } = await axiosClient.post<QueuedResponse>(`/jobseeker/saved/${jobId}`);
  return data;
};

// unsaveJob — DELETE is synchronous (instant). No queue needed for removal.
//
// Example:
//   await unsaveJob('job-456');
//   // job is immediately removed from saved list
export const unsaveJob = async (jobId: string): Promise<void> => {
  await axiosClient.delete(`/jobseeker/saved/${jobId}`);
};

// ─── My Applications ──────────────────────────────────────────────────────────

// getMyApplications — returns all applications submitted by the current user.
// Job details (title, company, location) are embedded for the list view.
//
// Example:
//   const apps = await getMyApplications();
//   apps[0].status          // 'submitted' | 'shortlisted' | 'rejected' | 'under_review'
//   apps[0].job?.title      // 'React Developer'
//   apps[0].job?.recruiter?.companyName  // 'Acme Corp'
export const getMyApplications = async (signal?: AbortSignal): Promise<Application[]> => {
  const {
    data: { applications },
  } = await axiosClient.get<{ applications: Application[] }>('/jobseeker/applications', { signal });
  return applications;
};

// withdrawApplication — DELETE (synchronous). Removes the application entirely.
// The UI removes the item from state via onWithdraw(id) callback.
//
// Example:
//   await withdrawApplication('app-789');
export const withdrawApplication = async (applicationId: string): Promise<void> => {
  await axiosClient.delete(`/jobseeker/applications/${applicationId}`);
};
