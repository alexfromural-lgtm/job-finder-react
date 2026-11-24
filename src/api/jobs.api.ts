// ─── api/jobs.api.ts — Job Listings API Functions ────────────────────────────
//
// All job-related HTTP calls live here.
// Covers: browsing, searching, pagination, CRUD for recruiters.

import axiosClient from './axiosClient';
import type { Job, JobFormData } from '../types';

// ── Search / Filter Types ─────────────────────────────────────────────────────

// JobSearchParams: query parameters we send to the server for searching.
// All fields are optional — the API works with any combination.
//
// Example URL built from these params:
//   GET /api/jobs/all?search=react&category=Engineering&page=2&pageSize=10
export interface JobSearchParams {
  search?: string;
  category?: string;
  location?: string;
  page?: number;
  pageSize?: number;
}

// JobsMeta: pagination metadata returned by the server alongside the jobs array.
// The UI uses this to render page numbers and "X of Y jobs" text.
//
// Example response:
//   { jobs: [...], meta: { total: 150, page: 2, pageSize: 10, totalPages: 15 } }
export interface JobsMeta {
  total: number;       // total matching jobs in the database
  page: number;        // current page (1-based)
  pageSize: number;    // items per page
  totalPages: number;  // Math.ceil(total / pageSize)
}

// ── Public API Calls ──────────────────────────────────────────────────────────

/**
 * Server-side search + pagination — hits GET /api/jobs/all with query params.
 * This is the primary way to fetch jobs on the landing page and dashboards.
 *
 * Example:
 *   const { jobs, meta } = await searchJobs({ search: 'react', page: 1, pageSize: 10 });
 *   // jobs = [{ id: '...', title: 'Senior React Dev', ... }, ...]
 *   // meta = { total: 42, page: 1, pageSize: 10, totalPages: 5 }
 */
export const searchJobs = async (
  params?: JobSearchParams,
  signal?: AbortSignal          // cancellation support (see getMe for explanation)
): Promise<{ jobs: Job[]; meta: JobsMeta }> => {
  const {
    // Destructure response.data to get both jobs and meta at once.
    data: { jobs, meta },
  } = await axiosClient.get<{ jobs: Job[]; meta: JobsMeta }>('/jobs/all', { params, signal });
  // { params } passes JobSearchParams as ?key=value URL query parameters.
  return { jobs, meta };
};

/** Kept for backward-compat (DashboardPage client-side filtering) */
export const getAllJobs = async (signal?: AbortSignal): Promise<Job[]> => {
  const {
    data: { jobs },
  } = await axiosClient.get<{ jobs: Job[] }>('/jobs/all', { signal });
  return jobs;
};

// getJobById — fetches a single job's full details.
// Used on the Job Detail page (/jobs/:id).
//
// Example:
//   const job = await getJobById('abc123');
//   // job = { id: 'abc123', title: 'React Dev', description: '...', ... }
export const getJobById = async (id: string, signal?: AbortSignal): Promise<Job> => {
  const {
    data: { job },
  } = await axiosClient.get<{ job: Job }>(`/jobs/${id}`, { signal });
  // Template literal: `/jobs/${id}` → e.g. "/jobs/abc123"
  return job;
};

// getRecruiterJobs — fetches only the jobs posted by the logged-in recruiter.
// Used on the Recruiter Dashboard.
export const getRecruiterJobs = async (signal?: AbortSignal): Promise<Job[]> => {
  const {
    data: { jobs },
  } = await axiosClient.get<{ jobs: Job[] }>('/jobs/recruiter', { signal });
  return jobs;
};

// ── Recruiter CRUD ────────────────────────────────────────────────────────────

// createJob — POST a new job listing.
// Returns the created job with the server-assigned ID.
//
// Example:
//   const job = await createJob({ title: 'React Dev', description: '...', ... });
export const createJob = async (data: JobFormData): Promise<Job> => {
  const {
    data: { job },
  } = await axiosClient.post<{ job: Job }>('/jobs', data);
  return job;
};

// updateJob — PUT (full or partial) update on an existing job.
// Partial<JobFormData> means every field is optional in the update call.
//
// Example:
//   await updateJob('abc123', { title: 'Senior React Dev' }); // only title changed
export const updateJob = async (id: string, data: Partial<JobFormData>): Promise<Job> => {
  const {
    data: { job },
  } = await axiosClient.put<{ job: Job }>(`/jobs/${id}`, data);
  return job;
};

// deleteJob — permanently removes a job listing.
// Returns void — there's no meaningful response body after a DELETE.
//
// Example:
//   await deleteJob('abc123');
export const deleteJob = async (id: string): Promise<void> => {
  await axiosClient.delete(`/jobs/${id}`);
};
