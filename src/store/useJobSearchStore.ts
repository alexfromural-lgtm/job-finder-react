import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { Job } from '../types';
import * as JobsApi from '../api/jobs.api';
import type { JobsMeta } from '../api/jobs.api';
import { PAGE_SIZES } from '../hooks/usePagination';

// ── Constants ──────────────────────────────────────────────────────────────────

export const DEFAULT_PAGE_SIZE = 10;

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

// ── Helpers ────────────────────────────────────────────────────────────────────

const defaultMeta: JobsMeta = { total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 };

const validPageSize = (n: number) =>
  (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;

// ── Store factory ──────────────────────────────────────────────────────────────

const storeFactory = (
  set: (
    partial: Partial<JobSearchState> | ((s: JobSearchState) => Partial<JobSearchState>)
  ) => void,
  get: () => JobSearchState
): JobSearchState => ({
  // ── Initial state ────────────────────────────────────────────────────────────
  search: '',
  categoryFilter: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  scrollMode: false,
  jobs: [],
  scrollJobs: [],
  categories: [],
  meta: defaultMeta,
  loading: true,
  loadingMore: false,
  error: '',

  // ── Filter actions ───────────────────────────────────────────────────────────
  setSearch: (s) => set({ search: s, page: 1, scrollJobs: [] }),

  setCategoryFilter: (c) => set({ categoryFilter: c, page: 1, scrollJobs: [] }),

  setPage: (n) => set({ page: n }),

  setPageSize: (n) => {
    const safe = validPageSize(n);
    set({ pageSize: safe, page: 1, scrollJobs: [] });
  },

  setScrollMode: (v) => {
    const { jobs } = get();
    if (v) {
      set({ scrollMode: true, scrollJobs: [...jobs] });
    } else {
      set({ scrollMode: false, scrollJobs: [], page: 1 });
    }
  },

  // ── Main fetch ───────────────────────────────────────────────────────────────
  fetchJobs: async (signal?: AbortSignal, overrides?: { search?: string }) => {
    const { categoryFilter, page, pageSize, scrollMode } = get();
    // Allow the hook to pass a debounced search value without storing it twice
    const search = overrides?.search ?? get().search;
    set({ loading: true, error: '' });

    try {
      const { jobs: newJobs, meta: newMeta } = await JobsApi.searchJobs(
        {
          search: search || undefined,
          category: categoryFilter || undefined,
          page,
          pageSize,
        },
        signal
      );

      if (signal?.aborted) return;

      set((s) => {
        const scrollJobs = scrollMode
          ? page === 1
            ? newJobs
            : [...s.scrollJobs, ...newJobs]
          : s.scrollJobs;

        // Seed categories only on the initial unfiltered load
        const categories =
          !search && !categoryFilter && page === 1
            ? (Array.from(new Set(newJobs.map((j) => j.category).filter(Boolean))) as string[])
            : s.categories;

        return { jobs: newJobs, meta: newMeta, scrollJobs, categories, loading: false, error: '' };
      });
    } catch (err: unknown) {
      const e = err as { name?: string; code?: string };
      if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') {
        return;
      }
      if (!signal?.aborted) {
        set({ loading: false, error: 'Could not load jobs. Make sure the backend is running.' });
      }
    }
  },

  // ── Infinite scroll load-more ────────────────────────────────────────────────
  loadMore: async () => {
    const { loadingMore, meta, search, categoryFilter, pageSize } = get();
    if (loadingMore || meta.page >= meta.totalPages) return;

    const nextPage = meta.page + 1;
    set({ loadingMore: true });

    try {
      const { jobs: newJobs, meta: newMeta } = await JobsApi.searchJobs({
        search: search || undefined,
        category: categoryFilter || undefined,
        page: nextPage,
        pageSize,
      });

      set((s) => ({
        scrollJobs: [...s.scrollJobs, ...newJobs],
        meta: newMeta,
        page: nextPage,
        loadingMore: false,
      }));
    } catch (err: unknown) {
      const e = err as { code?: string };
      if (e?.code === 'ERR_CANCELED') return;
      set({ loadingMore: false, error: 'Could not load more jobs. Please try again.' });
    }
  },

  // ── Reset all filters to initial state ───────────────────────────────────────
  resetFilters: () =>
    set({
      search: '',
      categoryFilter: '',
      page: 1,
      pageSize: DEFAULT_PAGE_SIZE,
      scrollMode: false,
      scrollJobs: [],
      error: '',
    }),
});

// ── Create store — devtools only in development ────────────────────────────────

export const useJobSearchStore = import.meta.env.DEV
  ? create<JobSearchState>()(devtools(storeFactory, { name: 'JobSearchStore' }))
  : create<JobSearchState>()(storeFactory);
