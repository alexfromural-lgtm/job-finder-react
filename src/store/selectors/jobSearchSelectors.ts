import type { RootState } from '../store';

export const selectSearch = (state: RootState) => state.jobSearch.search;
export const selectCategoryFilter = (state: RootState) => state.jobSearch.categoryFilter;
export const selectPage = (state: RootState) => state.jobSearch.page;
export const selectPageSize = (state: RootState) => state.jobSearch.pageSize;
export const selectScrollMode = (state: RootState) => state.jobSearch.scrollMode;
export const selectJobs = (state: RootState) => state.jobSearch.jobs;
export const selectScrollJobs = (state: RootState) => state.jobSearch.scrollJobs;
export const selectCategories = (state: RootState) => state.jobSearch.categories;
export const selectMeta = (state: RootState) => state.jobSearch.meta;
export const selectJobSearchLoading = (state: RootState) => state.jobSearch.loading;
export const selectJobSearchLoadingMore = (state: RootState) => state.jobSearch.loadingMore;
export const selectJobSearchError = (state: RootState) => state.jobSearch.error;

/** Derived: the list shown in the UI — scrollJobs in scroll mode, paginated jobs otherwise. */
export const selectDisplayJobs = (state: RootState) =>
  state.jobSearch.scrollMode ? state.jobSearch.scrollJobs : state.jobSearch.jobs;

/** Derived: whether there are more pages to load. */
export const selectHasMore = (state: RootState) =>
  state.jobSearch.meta.page < state.jobSearch.meta.totalPages;
