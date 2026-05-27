import type { Job } from '../../types';
import type { JobsMeta } from '../../api/jobs.api';

// ── Constants ─────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 10;

// ── State shape ───────────────────────────────────────────────────────────────

export interface JobSearchState {
  // Filter / pagination inputs
  search: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
  scrollMode: boolean;
  // Data
  jobs: Job[];
  scrollJobs: Job[];
  categories: string[];
  meta: JobsMeta;
  // Loading / error
  loading: boolean;
  loadingMore: boolean;
  error: string;
}

// ── Thunk argument types ──────────────────────────────────────────────────────

export interface FetchJobsArg {
  search?: string;
  categoryFilter?: string;
  page: number;
  pageSize: number;
  scrollMode: boolean;
  signal?: AbortSignal;
}

export interface LoadMoreArg {
  search?: string;
  categoryFilter?: string;
  nextPage: number;
  pageSize: number;
}
