import { useShallow } from 'zustand/react/shallow';
import { useJobSearchStore } from './useJobSearchStore';

// ── Selectors ──────────────────────────────────────────────────────────────────
// Each selector uses useShallow so consumers only re-render when one of the
// picked values actually changes (not on every unrelated store write).

export function useJobSearchSelectors() {
  return useJobSearchStore(
    useShallow((s) => ({
      search: s.search,
      categoryFilter: s.categoryFilter,
      page: s.page,
      pageSize: s.pageSize,
      scrollMode: s.scrollMode,
      jobs: s.jobs,
      scrollJobs: s.scrollJobs,
      categories: s.categories,
      meta: s.meta,
      loading: s.loading,
      loadingMore: s.loadingMore,
      error: s.error,
      fetchJobs: s.fetchJobs,
      setSearch: s.setSearch,
      setCategoryFilter: s.setCategoryFilter,
      setPage: s.setPage,
      setPageSize: s.setPageSize,
      setScrollMode: s.setScrollMode,
      loadMore: s.loadMore,
    }))
  );
}
