import type { JobsMeta } from '../api/jobs.api';
import { PAGE_SIZES } from '../hooks/usePagination';
import { DEFAULT_PAGE_SIZE } from './jobSearchConstants';

// ── Helpers ────────────────────────────────────────────────────────────────────

export const defaultMeta: JobsMeta = {
  total: 0,
  page: 1,
  pageSize: DEFAULT_PAGE_SIZE,
  totalPages: 1,
};

export const validPageSize = (n: number): number =>
  (PAGE_SIZES as readonly number[]).includes(n) ? n : DEFAULT_PAGE_SIZE;
