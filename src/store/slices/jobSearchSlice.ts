import { createSlice } from '@reduxjs/toolkit';
import { initialState } from './jobSearchState';
import { fetchJobs, loadMoreJobs } from './jobSearchThunks';

// ── Slice ─────────────────────────────────────────────────────────────────────

const jobSearchSlice = createSlice({
  name: 'jobSearch',
  initialState,
  reducers: {
    setSearch(state, action: { payload: string }) {
      state.search = action.payload;
    },
    setCategoryFilter(state, action: { payload: string }) {
      state.categoryFilter = action.payload;
    },
    setPage(state, action: { payload: number }) {
      state.page = action.payload;
    },
    setPageSize(state, action: { payload: number }) {
      state.pageSize = action.payload;
      state.page = 1;
    },
    setScrollMode(state, action: { payload: boolean }) {
      state.scrollMode = action.payload;
      if (action.payload) {
        // Seed scroll list from the current paginated jobs
        state.scrollJobs = [...state.jobs];
      } else {
        state.scrollJobs = [];
        state.page = 1;
      }
    },
    /** Reset page + scroll jobs when filters change (called by useJobSearch hook). */
    resetPagination(state) {
      state.page = 1;
      state.scrollJobs = [];
    },
    /** Hydrate filter/page from URL on mount. */
    hydrateFromUrl(
      state,
      action: {
        payload: {
          search?: string;
          categoryFilter?: string;
          page?: number;
          pageSize?: number;
        };
      }
    ) {
      if (action.payload.search !== undefined) state.search = action.payload.search;
      if (action.payload.categoryFilter !== undefined)
        state.categoryFilter = action.payload.categoryFilter;
      if (action.payload.page !== undefined) state.page = action.payload.page;
      if (action.payload.pageSize !== undefined) state.pageSize = action.payload.pageSize;
    },
  },
  extraReducers: (builder) => {
    // ── fetchJobs ─────────────────────────────────────────────────────────────
    builder
      .addCase(fetchJobs.pending, (state) => {
        state.loading = true;
        state.error = '';
      })
      .addCase(fetchJobs.fulfilled, (state, action) => {
        const { jobs, meta, seedCategories } = action.payload;
        state.jobs = jobs;
        state.meta = meta;
        state.loading = false;

        if (state.scrollMode) {
          state.scrollJobs = meta.page === 1 ? [...jobs] : [...state.scrollJobs, ...jobs];
        }

        if (seedCategories) {
          state.categories = Array.from(
            new Set(jobs.map((j) => j.category).filter(Boolean))
          ) as string[];
        }
      })
      .addCase(fetchJobs.rejected, (state, action) => {
        if (action.payload === 'canceled') {
          // Aborted request — do not update UI state
          return;
        }
        state.loading = false;
        state.error = action.payload ?? 'Could not load jobs.';
      });

    // ── loadMoreJobs ──────────────────────────────────────────────────────────
    builder
      .addCase(loadMoreJobs.pending, (state) => {
        state.loadingMore = true;
        state.error = '';
      })
      .addCase(loadMoreJobs.fulfilled, (state, action) => {
        const { jobs, meta } = action.payload;
        state.scrollJobs = [...state.scrollJobs, ...jobs];
        state.meta = meta;
        state.page = meta.page;
        state.loadingMore = false;
      })
      .addCase(loadMoreJobs.rejected, (state, action) => {
        if (action.payload === 'canceled') return;
        state.loadingMore = false;
        state.error = action.payload ?? 'Could not load more jobs.';
      });
  },
});

export const {
  setSearch,
  setCategoryFilter,
  setPage,
  setPageSize,
  setScrollMode,
  resetPagination,
  hydrateFromUrl,
} = jobSearchSlice.actions;

export default jobSearchSlice.reducer;

// ── Re-exports for external consumers ─────────────────────────────────────────

export { fetchJobs, loadMoreJobs } from './jobSearchThunks';
export type { JobSearchState, FetchJobsArg, LoadMoreArg } from './jobSearchTypes';
