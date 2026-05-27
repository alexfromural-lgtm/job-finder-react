import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import type { JobSearchState } from './jobSearchTypes';
import { storeFactory } from './jobSearchActions';

// ── Re-exports (public surface — keeps all existing imports unbroken) ───────────
export { DEFAULT_PAGE_SIZE } from './jobSearchConstants';
export type { JobSearchState } from './jobSearchTypes';

// ── Create store — devtools only in development ────────────────────────────────

export const useJobSearchStore = import.meta.env.DEV
  ? create<JobSearchState>()(devtools(storeFactory, { name: 'JobSearchStore' }))
  : create<JobSearchState>()(storeFactory);
