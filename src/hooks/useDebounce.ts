// ─── hooks/useDebounce.ts — Debounce Hook ────────────────────────────────────
//
// Debouncing delays updating a value until the user has STOPPED changing it
// for a given period. The classic use case is a search input: instead of
// sending an API request on every keystroke, we wait until the user pauses.
//
// Without debounce (bad):
//   User types "r", "e", "a", "c", "t" → 5 API calls
//
// With debounce (good):
//   User types quickly → 1 API call 300ms after they stop typing
//
// This hook is GENERIC (<T>) — it works with any value type (string, number, etc.)

import { useState, useEffect } from 'react';

/**
 * Returns a debounced copy of `value` that only updates after
 * `delayMs` milliseconds of inactivity.
 *
 * Generic — works with any value type T.
 *
 * @param value   - the "live" value that changes rapidly
 * @param delayMs - how long to wait after the last change (default 300ms)
 *
 * Example:
 *   const [search, setSearch] = useState('');
 *   const debouncedSearch = useDebounce(search, 300);
 *
 *   // debouncedSearch lags behind search by up to 300ms.
 *   // Use debouncedSearch for the API call, search for the input value.
 *   useEffect(() => { fetchJobs(debouncedSearch); }, [debouncedSearch]);
 */
export function useDebounce<T>(value: T, delayMs = 300): T {
  // debounced state mirrors `value` but with a delay.
  const [debounced, setDebounced] = useState<T>(value);

  useEffect(() => {
    // Every time `value` changes, start a new timer.
    // setTimeout schedules setDebounced to run after delayMs ms.
    const timer = setTimeout(() => setDebounced(value), delayMs);

    // Cleanup: if `value` changes again before delayMs expires,
    // clearTimeout cancels the previous timer and we start fresh.
    // This is the core of debouncing — only the LAST timer survives.
    //
    // Timeline example with 300ms delay:
    //   t=0:   user types "r"  → timer A set for t=300
    //   t=100: user types "e"  → timer A cleared, timer B set for t=400
    //   t=200: user types "a"  → timer B cleared, timer C set for t=500
    //   t=500: timer C fires   → setDebounced("rea")  ← only ONE update
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
