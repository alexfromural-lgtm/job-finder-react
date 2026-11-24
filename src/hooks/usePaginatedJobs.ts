// ─── hooks/usePaginatedJobs.ts — Client-Side Job Pagination Orchestrator ──────
//
// This hook was the original pagination solution (client-side filtering of a
// full job list fetched once). It is now superseded by useJobSearch which does
// server-side pagination. This file remains used in the Recruiter Dashboard.
//
// Architecture pattern: "Composition over Implementation"
// This hook COMPOSES four generic hooks:
//   1. useDebounce       — debounces the search input (300ms delay)
//   2. usePagination     — page number math, getPageSlice
//   3. useInfiniteScroll — infinite scroll count management, loadMore
//   4. useUrlSync        — persists state in the URL (?search=react&page=2)
//
// This hook is the ONLY layer that knows about Jobs.
// The four primitives above are fully domain-agnostic.
//
// Example:
//   const { pageItems, setSearch, goToPage } = usePaginatedJobs({ allJobs });
//   // pageItems = the jobs visible on the current page

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Job } from '../types';
import { useDebounce } from './useDebounce';
import { usePagination, PAGE_SIZES } from './usePagination';
import { useInfiniteScroll } from './useInfiniteScroll';
import { useUrlSync } from './useUrlSync';

// Re-export so existing consumers (Pagination.tsx, useJobSearch.ts) keep working.
export { PAGE_SIZES };
export type { PageSize } from './usePagination';

// ── Filter abstraction (DIP) ───────────────────────────────────────────────────

/**
 * Predicate that decides whether a job matches the current filter inputs.
 * Callers can inject their own logic; the default covers text + category.
 *
 * DIP = Dependency Inversion Principle: instead of hardcoding filter logic,
 * we accept a function so callers can customize it.
 *
 * Example custom filter:
 *   const myFilter: JobFilterFn = (job, search, category) =>
 *     job.isActive && defaultFilter(job, search, category);
 */
export type JobFilterFn = (job: Job, search: string, category: string) => boolean;

// defaultFilterFn: text search across title/location/description + category match.
const defaultFilterFn: JobFilterFn = (job, search, category) => {
  if (search) {
    // toLowerCase() for case-insensitive search.
    const q = search.toLowerCase();
    // If the search term doesn't match ANY of these fields → exclude the job.
    if (
      !job.title.toLowerCase().includes(q) &&
      !job.location.toLowerCase().includes(q) &&
      !job.description.toLowerCase().includes(q)
    ) {
      return false;
    }
  }
  // If a category filter is active and this job's category doesn't match → exclude.
  if (category && job.category !== category) return false;
  // Otherwise include the job.
  return true;
};

// ── Public API ────────────────────────────────────────────────────────────────

export interface UsePaginatedJobsOptions {
  allJobs: Job[];            // the full (pre-fetched) list of jobs to filter and paginate
  defaultPageSize?: number;
  /** Override the default text+category filter with a custom predicate. */
  filterFn?: JobFilterFn;
}

export interface PaginatedJobsState {
  // Filter inputs
  search: string;
  categoryFilter: string;
  // Pagination
  currentPage: number;
  pageSize: number;
  totalPages: number;
  // Scroll mode
  scrollMode: boolean;
  // Data
  filteredJobs: Job[];   // all jobs after filtering
  pageItems: Job[];      // just the jobs visible on the current page (or scroll window)
  hasMore: boolean;
  loadingMore: boolean;
  // Actions
  setSearch: (s: string) => void;
  setCategoryFilter: (c: string) => void;
  goToPage: (n: number) => void;
  setPageSize: (n: number) => void;
  setScrollMode: (v: boolean) => void;
  loadMore: () => void;
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Job-specific orchestrator.
 *
 * Composes four generic hooks:
 *   useDebounce       – debounced search input
 *   usePagination     – page math and slicing
 *   useInfiniteScroll – scroll-mode visible-count and load-more
 *   useUrlSync        – persists filter/pagination state in the URL
 *
 * This hook is the only layer that knows about `Job`.
 * The four primitives above are fully domain-agnostic.
 */
export function usePaginatedJobs({
  allJobs,
  defaultPageSize = 10,
  filterFn = defaultFilterFn,
}: UsePaginatedJobsOptions): PaginatedJobsState {
  const [searchParams] = useSearchParams();

  // ── Filter inputs ──────────────────────────────────────────────────────────
  // Initialize from URL params so the page restores state on refresh.
  // () => ... is a "lazy initializer" for useState — runs ONCE on mount.
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');
  const [categoryFilter, setCategoryFilter] = useState(() => searchParams.get('category') ?? '');

  // Debounce the search string — only filter after 300ms of inactivity.
  const debouncedSearch = useDebounce(search, 300);

  // ── Apply filter (memoised) ────────────────────────────────────────────────
  // useMemo re-runs the filter only when allJobs, debouncedSearch, categoryFilter,
  // or filterFn changes. Without this, filtering would run on EVERY render.
  //
  // Array.filter returns a new array of elements where the predicate returns true.
  const filteredJobs = useMemo(
    () => allJobs.filter((j) => filterFn(j, debouncedSearch, categoryFilter)),
    [allJobs, debouncedSearch, categoryFilter, filterFn]
  );

  // ── Generic pagination ─────────────────────────────────────────────────────
  // Pass filteredJobs.length so pagination knows the total to split up.
  const pagination = usePagination({
    totalItems: filteredJobs.length,
    initialPage: Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1),
    initialPageSize: (() => {
      const ps = parseInt(searchParams.get('pageSize') ?? String(defaultPageSize), 10);
      return (PAGE_SIZES as readonly number[]).includes(ps) ? ps : defaultPageSize;
    })(),
  });

  // ── Generic infinite scroll ────────────────────────────────────────────────
  const scroll = useInfiniteScroll({
    totalItems: filteredJobs.length,
    pageSize: pagination.pageSize,
  });

  // ── Scroll-mode toggle ─────────────────────────────────────────────────────
  // scrollMode=true → show items as an infinite list (no page buttons)
  // scrollMode=false → show items in pages (traditional pagination)
  const [scrollMode, setScrollModeRaw] = useState(false);

  // ── Reset page + scroll window when filters change ─────────────────────────
  // When the user changes the search or category, go back to page 1.
  // This prevents showing "page 5" of results for a brand new search query.
  useEffect(() => {
    pagination.reset();
    scroll.reset();
    // pagination.reset and scroll.reset are stable callbacks — safe to omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch, categoryFilter]);

  // ── Derived items and hasMore ──────────────────────────────────────────────
  // Choose which slice of filteredJobs to show based on the current mode.
  const pageItems = scrollMode
    ? scroll.getVisibleSlice(filteredJobs)   // show first N items (infinite)
    : pagination.getPageSlice(filteredJobs); // show current page slice

  const hasMore = scrollMode ? scroll.hasMore : pagination.currentPage < pagination.totalPages;

  // ── URL sync (generic — no Job knowledge) ─────────────────────────────────
  // Persist filter/page state in the URL so users can share/bookmark searches.
  useUrlSync({
    search: debouncedSearch || undefined,       // omit if empty
    category: categoryFilter || undefined,
    page: !scrollMode && pagination.currentPage > 1 ? String(pagination.currentPage) : undefined,
    pageSize: pagination.pageSize !== defaultPageSize ? String(pagination.pageSize) : undefined,
  });

  // ── Actions ────────────────────────────────────────────────────────────────
  const goToPage = useCallback(
    (n: number) => {
      pagination.goToPage(n);
      setScrollModeRaw(false); // switching pages exits scroll mode
    },
    [pagination]
  );

  const setPageSize = useCallback(
    (n: number) => {
      pagination.setPageSize(n); // also resets to page 1
      scroll.reset(n);           // reset scroll window to new page size
    },
    [pagination, scroll]
  );

  const setScrollMode = useCallback(
    (v: boolean) => {
      setScrollModeRaw(v);
      if (!v) pagination.reset(); // leaving scroll mode → reset to page 1
    },
    [pagination]
  );

  return {
    search,
    categoryFilter,
    currentPage: pagination.currentPage,
    pageSize: pagination.pageSize,
    totalPages: pagination.totalPages,
    scrollMode,
    filteredJobs,
    pageItems,
    hasMore,
    loadingMore: scroll.loadingMore,
    setSearch,
    setCategoryFilter,
    goToPage,
    setPageSize,
    setScrollMode,
    loadMore: scroll.loadMore,
  };
}
