import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Job } from '../types';
import type { JobsMeta } from '../api/jobs.api';
import { PAGE_SIZES } from './usePagination';
import { useDebounce } from './useDebounce';
import { useJobSearchStore, DEFAULT_PAGE_SIZE } from '../store/useJobSearchStore';
import { useJobSearchSelectors } from '../store/useJobSearchSelectors';

export interface UseJobSearchResult {
  // Filter state
  search: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
  scrollMode: boolean;
  // Data
  categories: string[];
  meta: JobsMeta;
  displayJobs: Job[];
  hasMore: boolean;
  // Loading
  loading: boolean;
  loadingMore: boolean;
  error: string;
  // Actions
  setSearch: (s: string) => void;
  setCategoryFilter: (c: string) => void;
  setPage: (n: number) => void;
  setPageSize: (n: number) => void;
  setScrollMode: (v: boolean) => void;
  loadMore: () => void;
}

export function useJobSearch(): UseJobSearchResult {
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Select slices from store ─────────────────────────────────────────────────
  const {
    search,
    categoryFilter,
    page,
    pageSize,
    scrollMode,
    jobs,
    scrollJobs,
    categories,
    meta,
    loading,
    loadingMore,
    error,
    fetchJobs,
    setSearch,
    setCategoryFilter,
    setPage,
    setPageSize,
    setScrollMode,
    loadMore,
  } = useJobSearchSelectors();

  // ── Debounce lives here — it's a React concern, not store state ──────────────
  const debouncedSearch = useDebounce(search, 300);

  // ── One-time URL → store init on mount ───────────────────────────────────────
  // Guard ensures this runs only on the first (real) mount even in StrictMode.
  const initialized = useRef(false);
  useEffect(() => {
    if (initialized.current) return;
    initialized.current = true;

    const urlSearch = searchParams.get('search') ?? '';
    const urlCategory = searchParams.get('category') ?? '';
    const urlPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const ps = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
    const urlPageSize = (PAGE_SIZES as readonly number[]).includes(ps) ? ps : DEFAULT_PAGE_SIZE;

    if (urlSearch || urlCategory || urlPage > 1 || urlPageSize !== DEFAULT_PAGE_SIZE) {
      useJobSearchStore.setState({
        search: urlSearch,
        categoryFilter: urlCategory,
        page: urlPage,
        pageSize: urlPageSize,
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Fetch whenever debounced filters or pagination change ────────────────────
  useEffect(() => {
    const controller = new AbortController();
    // Pass debouncedSearch as an override so the store uses the settled value
    fetchJobs(controller.signal, { search: debouncedSearch });
    return () => controller.abort();
  }, [debouncedSearch, categoryFilter, page, pageSize, fetchJobs]);

  // ── Sync state → URL ─────────────────────────────────────────────────────────
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryFilter) params.category = categoryFilter;
    if (page > 1) params.page = String(page);
    if (pageSize !== DEFAULT_PAGE_SIZE) params.pageSize = String(pageSize);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, categoryFilter, page, pageSize, setSearchParams]);

  // ── Derived ───────────────────────────────────────────────────────────────────
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
