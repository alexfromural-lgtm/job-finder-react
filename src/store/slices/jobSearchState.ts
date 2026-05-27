import type { JobSearchState } from './jobSearchTypes';
import { DEFAULT_PAGE_SIZE } from './jobSearchTypes';

// ── Initial state ─────────────────────────────────────────────────────────────

export const initialState: JobSearchState = {
  search: '',
  categoryFilter: '',
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  scrollMode: false,
  jobs: [],
  scrollJobs: [],
  categories: [],
  meta: { total: 0, page: 1, pageSize: DEFAULT_PAGE_SIZE, totalPages: 1 },
  loading: true,
  loadingMore: false,
  error: '',
};
