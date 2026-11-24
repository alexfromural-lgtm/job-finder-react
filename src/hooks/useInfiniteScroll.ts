// ─── hooks/useInfiniteScroll.ts — Infinite Scroll Logic ──────────────────────
//
// Instead of splitting items into pages, infinite scroll shows items
// continuously as the user scrolls down — like Twitter or Instagram.
//
// This hook manages a "visible window": how many items from the full list
// are currently shown. When the user reaches the bottom, we increase the
// visible count by one page size.
//
// Key design: this hook manages counts, not DOM. The actual scroll detection
// (IntersectionObserver) lives in JobList.tsx. Separation of concerns.
//
// Example:
//   const { visibleCount, hasMore, loadMore, getVisibleSlice } = useInfiniteScroll({
//     totalItems: 150,  // total items in the full list
//     pageSize: 10,     // how many to add each time
//   });
//
//   const visibleJobs = getVisibleSlice(allJobs);
//   // Initially: visibleJobs = allJobs.slice(0, 10)
//   // After loadMore(): visibleJobs = allJobs.slice(0, 20)

import { useState, useCallback } from 'react';

// ── Types ─────────────────────────────────────────────────────────────────────

export interface UseInfiniteScrollOptions {
  totalItems: number;       // total number of items in the full dataset
  pageSize: number;         // items to add per "load more"
  initialVisible?: number;  // override for initial visible count (defaults to pageSize)
}

export interface UseInfiniteScrollResult {
  visibleCount: number;
  hasMore: boolean;
  loadingMore: boolean;
  /** Append the next page of items to the visible window. */
  loadMore: () => void;
  /** Reset visible window (e.g. when filters change). Defaults to `pageSize`. */
  reset: (count?: number) => void;
  /** Slice any array to the current visible window. Generic — no domain dependency. */
  getVisibleSlice: <T>(items: T[]) => T[];
}

// ── Hook ──────────────────────────────────────────────────────────────────────

/**
 * Generic infinite-scroll hook.
 *
 * Manages how many items from an already-available list are currently visible.
 * Has no knowledge of what is being scrolled — callers pass any T[] to
 * `getVisibleSlice` to receive the visible window.
 */
export function useInfiniteScroll({
  totalItems,
  pageSize,
  initialVisible,
}: UseInfiniteScrollOptions): UseInfiniteScrollResult {
  // visibleCount: how many items are currently shown to the user.
  // Starts at initialVisible if provided, otherwise pageSize (one page).
  const [visibleCount, setVisibleCount] = useState(initialVisible ?? pageSize);

  // loadingMore: true briefly while we're "loading" the next batch.
  // We fake a small delay using requestAnimationFrame to avoid UI flicker.
  const [loadingMore, setLoadingMore] = useState(false);

  // hasMore: true if there are still hidden items left to show.
  const hasMore = visibleCount < totalItems;

  // loadMore: show the next page of items.
  const loadMore = useCallback(() => {
    // Guard: don't load if already loading or if everything is visible.
    if (loadingMore || !hasMore) return;
    setLoadingMore(true);

    // requestAnimationFrame defers the state update to the next browser paint.
    // This gives React time to show the loading spinner before the new items render.
    // It's like a "microtask" at the painting level — essentially immediate.
    requestAnimationFrame(() => {
      // Math.min prevents visibleCount from exceeding totalItems.
      // e.g. visibleCount=45, pageSize=10, totalItems=48 → new visible=48 (not 55)
      setVisibleCount((prev) => Math.min(prev + pageSize, totalItems));
      setLoadingMore(false);
    });
  }, [loadingMore, hasMore, pageSize, totalItems]);

  // reset: go back to showing only the first page.
  // Called when filters change — no point keeping page 5 visible after a new search.
  // Optional count parameter allows setting an arbitrary initial window size.
  const reset = useCallback((count?: number) => setVisibleCount(count ?? pageSize), [pageSize]);

  // getVisibleSlice: a generic slicer — works with any array.
  // items.slice(0, visibleCount) → first N items
  //
  // Example: visibleCount=20, items has 150 elements → returns items[0..19]
  const getVisibleSlice = useCallback(
    <T>(items: T[]): T[] => items.slice(0, visibleCount),
    [visibleCount]
  );

  return { visibleCount, hasMore, loadingMore, loadMore, reset, getVisibleSlice };
}
