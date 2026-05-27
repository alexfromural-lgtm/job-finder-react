import { createAsyncThunk } from '@reduxjs/toolkit';
import type { Job } from '../../types';
import type { JobsMeta } from '../../api/jobs.api';
import * as JobsApi from '../../api/jobs.api';
import type { FetchJobsArg, LoadMoreArg } from './jobSearchTypes';

// ── fetchJobs ─────────────────────────────────────────────────────────────────

export const fetchJobs = createAsyncThunk<
  { jobs: Job[]; meta: JobsMeta; seedCategories: boolean },
  FetchJobsArg,
  { rejectValue: string }
>('jobSearch/fetchJobs', async (arg, { rejectWithValue }) => {
  try {
    const { jobs, meta } = await JobsApi.searchJobs(
      {
        search: arg.search || undefined,
        category: arg.categoryFilter || undefined,
        page: arg.page,
        pageSize: arg.pageSize,
      },
      arg.signal
    );
    // Seed categories only on the first unfiltered page load
    const seedCategories = !arg.search && !arg.categoryFilter && arg.page === 1;
    return { jobs, meta, seedCategories };
  } catch (err: unknown) {
    const e = err as { name?: string; code?: string };
    if (e?.name === 'CanceledError' || e?.name === 'AbortError' || e?.code === 'ERR_CANCELED') {
      return rejectWithValue('canceled');
    }
    return rejectWithValue('Could not load jobs. Make sure the backend is running.');
  }
});

// ── loadMoreJobs ──────────────────────────────────────────────────────────────

export const loadMoreJobs = createAsyncThunk<
  { jobs: Job[]; meta: JobsMeta },
  LoadMoreArg,
  { rejectValue: string }
>('jobSearch/loadMoreJobs', async (arg, { rejectWithValue }) => {
  try {
    const { jobs, meta } = await JobsApi.searchJobs({
      search: arg.search || undefined,
      category: arg.categoryFilter || undefined,
      page: arg.nextPage,
      pageSize: arg.pageSize,
    });
    return { jobs, meta };
  } catch (err: unknown) {
    const e = err as { code?: string };
    if (e?.code === 'ERR_CANCELED') return rejectWithValue('canceled');
    return rejectWithValue('Could not load more jobs. Please try again.');
  }
});
