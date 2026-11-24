// ─── hooks/usePagination.ts — Generic Pagination Logic ───────────────────────
//
// Manages current page, page size, and total pages math.
// Completely domain-agnostic — it doesn't know what it's paginating.
// Callers pass any array to getPageSlice() to get the current page's items.
//
// Example:
//   const { currentPage, totalPages, goToPage, getPageSlice } = usePagination({
//     totalItems: filteredJobs.length,
//   });
//
//   const currentPageJobs = getPageSlice(filteredJobs);
//   // If page=2, pageSize=10, totalItems=35:
//   //   getPageSlice(35 jobs) → jobs[10..19] (the second page)

import { useState, useCallback } from 'react';

// ── Constants ─────────────────────────────────────────────────────────────────

// PAGE_SIZES: the available options for the "Per page" selector.
// 'as const' makes this a readonly tuple [10, 25, 50] — prevents mutation.
// TypeScript infers the type as readonly [10, 25, 50] instead of number[].
export const PAGE_SIZES = [10, 25, 50] as const;

// PageSize is a union of the literal values: 10 | 25 | 50
// (typeof PAGE_SIZES)[number] extracts all element types from the tuple.
export type PageSize = (typeof PAGE_SIZES)[number];

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UsePaginationOptions {
  totalItems: number;
  initialPage?: number;      // defaults to 1
  initialPageSize?: number;  // defaults to PAGE_SIZES[0] = 10
}

export interface UsePaginationResult {
  currentPage: number;
  pageSize: number;
  totalPages: number;
  /** Navigate to page n (clamped to [1, totalPages]). */
  goToPage: (n: number) => void;
  /** Change page size and reset to page 1. */
  setPageSize: (n: number) => void;
  /** Reset to page 1 (call when filters change). */
  reset: () => void;
  /** Slice any array to the current page window. Generic — no domain dependency. */
  getPageSlice: <T>(items: T[]) => T[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Generic pagination hook.
 *
 * Manages current page, page size, and total-page derivation.
 * Has no knowledge of what is being paginated — callers pass any T[] to
 * `getPageSlice` to receive the correct window.
 */
export function usePagination({
  totalItems,
  initialPage = 1,
  initialPageSize = PAGE_SIZES[0], // 10
}: UsePaginationOptions): UsePaginationResult {
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [pageSize, setPageSizeRaw] = useState(initialPageSize);

  // totalPages: at least 1 (even when totalItems = 0, we show page 1 of 1).
  // Math.ceil(35 / 10) = 4 pages
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));

  // safePage: clamp currentPage to [1, totalPages].
  // If the user is on page 5 and filters reduce total pages to 3,
  // safePage automatically becomes 3 instead of 5.
  const safePage = Math.min(currentPage, totalPages);

  // goToPage: navigate to page n, clamped to valid range.
  // Math.max(1, ...) prevents going below page 1.
  // Math.min(..., totalPages) prevents going above the last page.
  //
  // useCallback: memoises the function. Only recreates when totalPages changes.
  // Without this, the function reference changes every render, which can cause
  // child components to re-render unnecessarily.
  const goToPage = useCallback(
    (n: number) => setCurrentPage(Math.max(1, Math.min(n, totalPages))),
    [totalPages]
  );

  // setPageSize: change page size AND reset to page 1.
  // Resetting is important — if you're on page 5 with 10/page and switch to
  // 25/page, page 5 might not exist anymore.
  const setPageSize = useCallback((n: number) => {
    setPageSizeRaw(n);
    setCurrentPage(1);
  }, []);

  // reset: jump back to page 1 (called when filters change).
  const reset = useCallback(() => setCurrentPage(1), []);

  // getPageSlice: a generic function that slices any array.
  // <T> is a TypeScript generic — the function works with any element type.
  //
  // Example:
  //   page=2, pageSize=10 → start=(2-1)*10=10
  //   items.slice(10, 20) → items[10] through items[19]
  const getPageSlice = useCallback(
    <T>(items: T[]): T[] => {
      const start = (safePage - 1) * pageSize;
      return items.slice(start, start + pageSize);
    },
    [safePage, pageSize]
  );

  return {
    currentPage: safePage,
    pageSize,
    totalPages,
    goToPage,
    setPageSize,
    reset,
    getPageSlice,
  };
}
