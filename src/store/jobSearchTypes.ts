import type { Job } from '../types';
import type { JobsMeta } from '../api/jobs.api';

// ── State shape ────────────────────────────────────────────────────────────────

export interface JobSearchState {
  // Filter / pagination
  search: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
  scrollMode: boolean;
  // Server data
  jobs: Job[];
  scrollJobs: Job[];
  categories: string[];
  meta: JobsMeta;
  // Async status
  loading: boolean;
  loadingMore: boolean;
  error: string;
  // Actions
  setSearch: (s: string) => void;
  setCategoryFilter: (c: string) => void;
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
  setScrollMode: (v: boolean) => void;
  loadMore: () => Promise<void>;
  fetchJobs: (signal?: AbortSignal, overrides?: { search?: string }) => Promise<void>;
  resetFilters: () => void;
}
