// ─── hooks/useJobSearch.ts — Server-Side Job Search + Pagination ──────────────
//
// This is the primary hook for the Landing Page and Job Seeker Dashboard.
// Unlike usePaginatedJobs (client-side), this hook fetches only the current page
// from the server — much more scalable for large datasets.
//
// Features:
//   • Debounced search (300ms) — sends fewer API requests as user types
//   • Server-side filtering (search, category) + pagination (page, pageSize)
//   • Scroll mode — infinite scroll instead of page buttons
//   • URL persistence — search state survives page refresh
//   • AbortController — cancels in-flight requests when params change

import { useState, useEffect, useCallback, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Job } from '../types';
import * as JobsApi from '../api/jobs.api';
import type { JobsMeta } from '../api/jobs.api';
import { PAGE_SIZES } from './usePagination';
import { useDebounce } from './useDebounce';

const DEFAULT_PAGE_SIZE = 10;

// UseJobSearchResult: the full public API of this hook.
// Components destructure this to get what they need.
export interface UseJobSearchResult {
  // Filter state (what the user has typed/selected)
  search: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
  scrollMode: boolean;
  // Server data
  categories: string[];   // unique categories from the first load (for the filter dropdown)
  meta: JobsMeta;         // { total, page, pageSize, totalPages }
  displayJobs: Job[];     // jobs to show (page mode or scroll mode)
  hasMore: boolean;       // true if there are more pages/items to load
  // Loading / error state
  loading: boolean;
  loadingMore: boolean;
  error: string;
  // Setters (actions)
  setSearch: (s: string) => void;
  setCategoryFilter: (c: string) => void;
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
  setScrollMode: (v: boolean) => void;
  loadMore: () => void;    // scroll mode only
}

export function useJobSearch(): UseJobSearchResult {
  // useSearchParams reads/writes the URL query string (?search=react&page=2).
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Filter / pagination state ──────────────────────────────────────────────
  // Each state is initialized from the URL so the page restores after refresh.
  // () => ... is a lazy initializer — runs only on the first render.

  const [search, setSearchRaw] = useState(() => searchParams.get('search') ?? '');
  // Debounced search: waits 300ms after typing stops before updating.
  // The API call uses debouncedSearch, not search, to avoid too many requests.
  const debouncedSearch = useDebounce(search, 300);

  const [categoryFilter, setCategoryFilterRaw] = useState(() => searchParams.get('category') ?? '');

  const [page, setPage] = useState(() =>
    // parseInt(..., 10) converts the URL string to a base-10 number.
    // The || 1 fallback handles NaN (if the URL has ?page=abc).
    Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1)
  );

  const [pageSize, setPageSizeRaw] = useState(() => {
    const ps = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
    // Only accept valid page sizes from the predefined list.
    // (PAGE_SIZES as readonly number[]).includes(ps) is needed because
    // PAGE_SIZES is 'as const' (readonly tuple) and includes() needs a narrower type.
    return (PAGE_SIZES as readonly number[]).includes(ps) ? ps : DEFAULT_PAGE_SIZE;
  });

  const [scrollMode, setScrollModeRaw] = useState(false);

  // ── API data ───────────────────────────────────────────────────────────────
  const [jobs, setJobs] = useState<Job[]>([]);
  const [scrollJobs, setScrollJobs] = useState<Job[]>([]); // accumulated for infinite scroll
  const [categories, setCategories] = useState<string[]>([]);
  const [meta, setMeta] = useState<JobsMeta>({
    total: 0,
    page: 1,
    pageSize: DEFAULT_PAGE_SIZE,
    totalPages: 1,
  });
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  // ── Reset to page 1 when filters change ───────────────────────────────────
  // useRef: stores a mutable value that doesn't trigger re-renders.
  // isFirstRender skips the page reset on the very first mount.
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return; // skip on mount — URL might already have a page > 1
    }
    setPage(1);
    setScrollJobs([]); // reset accumulated scroll jobs on new filter
  }, [debouncedSearch, categoryFilter, pageSize]);

  // ── Main data fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    // AbortController: used to cancel the previous request if params change
    // before the response arrives. Prevents race conditions.
    const controller = new AbortController();
    setLoading(true);

    JobsApi.searchJobs(
      {
        search: debouncedSearch || undefined, // send undefined instead of '' (cleaner URL)
        category: categoryFilter || undefined,
        page,
        pageSize,
      },
      controller.signal
    )
      .then(({ jobs: newJobs, meta: newMeta }) => {
        setJobs(newJobs);
        setMeta(newMeta);

        // In scroll mode: accumulate jobs across pages.
        // Page 1 (after a filter reset) → start fresh ([...newJobs]).
        // Other pages → append to existing list ([...prev, ...newJobs]).
        if (scrollMode) setScrollJobs((prev) => (page === 1 ? newJobs : [...prev, ...newJobs]));

        // Seed the category dropdown from the first unfiltered load.
        // Array.from(new Set(...)) removes duplicates.
        // .filter(Boolean) removes null/undefined categories.
        if (!debouncedSearch && !categoryFilter && page === 1) {
          setCategories(
            Array.from(new Set(newJobs.map((j) => j.category).filter(Boolean))) as string[]
          );
        }
      })
      .catch((err) => {
        // Ignore abort errors — they're expected when the user changes filters.
        if (
          err?.name === 'CanceledError' ||
          err?.name === 'AbortError' ||
          err?.code === 'ERR_CANCELED'
        )
          return;
        setError('Could not load jobs. Make sure the backend is running.');
      })
      .finally(() => {
        // Only update loading state if this request wasn't aborted.
        // Prevents resetting loading to false for a cancelled request.
        if (!controller.signal.aborted) setLoading(false);
      });

    // Cleanup: cancel the request when params change or component unmounts.
    return () => controller.abort();
  }, [debouncedSearch, categoryFilter, page, pageSize]); // scrollMode intentionally excluded

  // ── URL persistence ────────────────────────────────────────────────────────
  // Write current filter state into the URL query string.
  // { replace: true } avoids polluting browser history with every keystroke.
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryFilter) params.category = categoryFilter;
    if (page > 1) params.page = String(page);
    if (pageSize !== DEFAULT_PAGE_SIZE) params.pageSize = String(pageSize);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, categoryFilter, page, pageSize, setSearchParams]);

  // ── Actions ────────────────────────────────────────────────────────────────
  // Wrap setters in useCallback to ensure stable references.
  const setSearch = useCallback((s: string) => setSearchRaw(s), []);
  const setCategoryFilter = useCallback((c: string) => setCategoryFilterRaw(c), []);
  const setPageSize = useCallback((n: number) => setPageSizeRaw(n), []);

  // setScrollMode: switching into scroll mode seeds scrollJobs from the current page.
  // Switching out resets everything to page 1.
  const setScrollMode = useCallback(
    (v: boolean) => {
      setScrollModeRaw(v);
      if (v)
        setScrollJobs([...jobs]); // seed scroll list from current page
      else {
        setScrollJobs([]);
        setPage(1);
      }
    },
    [jobs]
  );

  // loadMore: fetches the next page and appends it to scrollJobs.
  // Only valid in scroll mode (when meta.page < meta.totalPages).
  const loadMore = useCallback(() => {
    if (loadingMore || meta.page >= meta.totalPages) return;
    const nextPage = meta.page + 1;
    setLoadingMore(true);
    JobsApi.searchJobs({
      search: debouncedSearch || undefined,
      category: categoryFilter || undefined,
      page: nextPage,
      pageSize,
    })
      .then(({ jobs: newJobs, meta: newMeta }) => {
        // Spread operator [...prev, ...newJobs] creates a NEW array with both.
        setScrollJobs((prev) => [...prev, ...newJobs]);
        setMeta(newMeta);
        setPage(nextPage);
      })
      .catch((err) => {
        if (err?.code === 'ERR_CANCELED') return;
        setError('Could not load more jobs. Please try again.');
      })
      .finally(() => setLoadingMore(false));
  }, [loadingMore, meta, debouncedSearch, categoryFilter, pageSize]);

  // ── Derived values ─────────────────────────────────────────────────────────
  // Choose which job list to show based on the current mode.
  const displayJobs = scrollMode ? scrollJobs : jobs;
  const hasMore = meta.page < meta.totalPages;

  return {
    search,
    categoryFilter,
    page,
    pageSize,
    scrollMode,
    categories,
    meta,
    displayJobs,
    hasMore,
    loading,
    loadingMore,
    error,
    setSearch,
    setCategoryFilter,
    setPage,
    setPageSize,
    setScrollMode,
    loadMore,
  };
}
