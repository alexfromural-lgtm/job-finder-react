import { useEffect, useRef, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { PAGE_SIZES } from './usePagination';
import { useDebounce } from './useDebounce';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  setSearch as setSearchAction,
  setCategoryFilter as setCategoryFilterAction,
  setPage as setPageAction,
  setPageSize as setPageSizeAction,
  setScrollMode as setScrollModeAction,
  resetPagination,
  hydrateFromUrl,
  fetchJobs,
  loadMoreJobs,
} from '../store/slices/jobSearchSlice';
import {
  selectSearch,
  selectCategoryFilter,
  selectPage,
  selectPageSize,
  selectScrollMode,
  selectCategories,
  selectMeta,
  selectDisplayJobs,
  selectHasMore,
  selectJobSearchLoading,
  selectJobSearchLoadingMore,
  selectJobSearchError,
} from '../store/selectors/jobSearchSelectors';

const DEFAULT_PAGE_SIZE = 10;

export interface UseJobSearchResult {
  // Filter state
  search: string;
  categoryFilter: string;
  page: number;
  pageSize: number;
  scrollMode: boolean;
  // Data
  categories: string[];
  meta: ReturnType<typeof selectMeta>;
  displayJobs: ReturnType<typeof selectDisplayJobs>;
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
  const dispatch = useAppDispatch();
  const [searchParams, setSearchParams] = useSearchParams();

  // ── Read from Redux store ──────────────────────────────────────────────────
  const search = useAppSelector(selectSearch);
  const categoryFilter = useAppSelector(selectCategoryFilter);
  const page = useAppSelector(selectPage);
  const pageSize = useAppSelector(selectPageSize);
  const scrollMode = useAppSelector(selectScrollMode);
  const categories = useAppSelector(selectCategories);
  const meta = useAppSelector(selectMeta);
  const displayJobs = useAppSelector(selectDisplayJobs);
  const hasMore = useAppSelector(selectHasMore);
  const loading = useAppSelector(selectJobSearchLoading);
  const loadingMore = useAppSelector(selectJobSearchLoadingMore);
  const error = useAppSelector(selectJobSearchError);

  const debouncedSearch = useDebounce(search, 300);

  // ── Hydrate Redux from URL on first mount only ─────────────────────────────
  const hydrated = useRef(false);
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;

    const urlSearch = searchParams.get('search') ?? '';
    const urlCategory = searchParams.get('category') ?? '';
    const urlPage = Math.max(1, parseInt(searchParams.get('page') ?? '1', 10) || 1);
    const urlPageSizeRaw = parseInt(searchParams.get('pageSize') ?? String(DEFAULT_PAGE_SIZE), 10);
    const urlPageSize = (PAGE_SIZES as readonly number[]).includes(urlPageSizeRaw)
      ? urlPageSizeRaw
      : DEFAULT_PAGE_SIZE;

    dispatch(
      hydrateFromUrl({
        search: urlSearch,
        categoryFilter: urlCategory,
        page: urlPage,
        pageSize: urlPageSize,
      })
    );
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Reset to page 1 whenever filters / page-size change ───────────────────
  const isFirstRender = useRef(true);
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    dispatch(resetPagination());
  }, [debouncedSearch, categoryFilter, pageSize, dispatch]);

  // ── Main data fetch ────────────────────────────────────────────────────────
  useEffect(() => {
    const controller = new AbortController();
    dispatch(
      fetchJobs({
        search: debouncedSearch,
        categoryFilter,
        page,
        pageSize,
        scrollMode,
        signal: controller.signal,
      })
    );
    return () => controller.abort();
  }, [debouncedSearch, categoryFilter, page, pageSize, dispatch]); // scrollMode intentionally excluded

  // ── URL persistence ────────────────────────────────────────────────────────
  useEffect(() => {
    const params: Record<string, string> = {};
    if (debouncedSearch) params.search = debouncedSearch;
    if (categoryFilter) params.category = categoryFilter;
    if (page > 1) params.page = String(page);
    if (pageSize !== DEFAULT_PAGE_SIZE) params.pageSize = String(pageSize);
    setSearchParams(params, { replace: true });
  }, [debouncedSearch, categoryFilter, page, pageSize, setSearchParams]);

  // ── Actions ────────────────────────────────────────────────────────────────
  const setSearch = useCallback((s: string) => dispatch(setSearchAction(s)), [dispatch]);

  const setCategoryFilter = useCallback(
    (c: string) => dispatch(setCategoryFilterAction(c)),
    [dispatch]
  );

  const setPage = useCallback((n: number) => dispatch(setPageAction(n)), [dispatch]);

  const setPageSize = useCallback((n: number) => dispatch(setPageSizeAction(n)), [dispatch]);

  const setScrollMode = useCallback((v: boolean) => dispatch(setScrollModeAction(v)), [dispatch]);

  const loadMore = useCallback(() => {
    if (loadingMore || meta.page >= meta.totalPages) return;
    dispatch(
      loadMoreJobs({
        search: debouncedSearch,
        categoryFilter,
        nextPage: meta.page + 1,
        pageSize,
      })
    );
  }, [loadingMore, meta, debouncedSearch, categoryFilter, pageSize, dispatch]);

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
