import { useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { Job } from '../types';
import type { JobsMeta } from '../api/jobs.api';
import { PAGE_SIZES } from './usePagination';
import { useDebounce } from './useDebounce';
import { useJobSearchStore, DEFAULT_PAGE_SIZE } from '../store/useJobSearchStore';

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
  const search = useJobSearchStore((s) => s.search);
  const categoryFilter = useJobSearchStore((s) => s.categoryFilter);
  const page = useJobSearchStore((s) => s.page);
  const pageSize = useJobSearchStore((s) => s.pageSize);
  const scrollMode = useJobSearchStore((s) => s.scrollMode);
  const jobs = useJobSearchStore((s) => s.jobs);
  const scrollJobs = useJobSearchStore((s) => s.scrollJobs);
  const categories = useJobSearchStore((s) => s.categories);
  const meta = useJobSearchStore((s) => s.meta);
  const loading = useJobSearchStore((s) => s.loading);
  const loadingMore = useJobSearchStore((s) => s.loadingMore);
  const error = useJobSearchStore((s) => s.error);
  const fetchJobs = useJobSearchStore((s) => s.fetchJobs);
  const setSearch = useJobSearchStore((s) => s.setSearch);
  const setCategoryFilter = useJobSearchStore((s) => s.setCategoryFilter);
  const setPage = useJobSearchStore((s) => s.setPage);
  const setPageSize = useJobSearchStore((s) => s.setPageSize);
  const setScrollMode = useJobSearchStore((s) => s.setScrollMode);
  const loadMore = useJobSearchStore((s) => s.loadMore);

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
