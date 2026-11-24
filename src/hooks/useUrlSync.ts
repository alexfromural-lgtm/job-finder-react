// ─── hooks/useUrlSync.ts — URL Search Parameter Synchronizer ─────────────────
//
// Keeps filter/pagination state in the URL so users can:
//   • Bookmark a filtered view (e.g. /jobs?search=react&category=Engineering)
//   • Share a URL with someone and they see the same results
//   • Use the browser's back button to return to a previous search
//
// This hook is GENERIC — it knows nothing about jobs or filters specifically.
// You pass any flat { key: value } map and it syncs to the URL.
//
// Usage:
//   useUrlSync({
//     search: 'react',          // adds ?search=react
//     category: 'Engineering',  // adds &category=Engineering
//     page: undefined,          // omitted from URL (page 1 is default)
//   });
//
// URL after: /jobs?search=react&category=Engineering

import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';

// UrlParamMap: a dictionary of string keys to optional string values.
// Keys with undefined or '' values are OMITTED from the URL.
//
// Example:
//   { search: 'react', category: undefined, page: '2' }
//   → URL: ?search=react&page=2  (category is omitted)
export type UrlParamMap = Record<string, string | undefined>;

/**
 * Generic URL-sync hook.
 *
 * Writes `params` into the URL search string (replace mode) whenever they
 * change. Keys mapped to `undefined` or `''` are omitted from the URL.
 *
 * Has no knowledge of what is being synced — any flat string map works.
 */
export function useUrlSync(params: UrlParamMap): void {
  // useSearchParams: React Router hook that gives us the URL query string.
  // We only need setSearchParams (the [1] element of the tuple) — the _ ignores [0].
  //
  // The _ convention means "I destructured this but don't use it".
  const [, setSearchParams] = useSearchParams();

  // JSON.stringify(params) converts the object to a stable string.
  // We use this as the effect dependency instead of `params` because:
  //   - `params` is a new object reference on every render (even if values didn't change)
  //   - JSON.stringify gives us value equality, not reference equality
  //   - This prevents an infinite loop of URL updates triggering re-renders
  //
  // Example:
  //   params = { search: 'react' }  → serialised = '{"search":"react"}'
  //   Same values next render      → serialised = '{"search":"react"}' (same string, no effect re-run)
  const serialised = JSON.stringify(params);

  useEffect(() => {
    // Build a clean { key: value } object for setSearchParams.
    // Filter out undefined and empty strings.
    const next: Record<string, string> = {};
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== '') next[key] = value;
    }

    // { replace: true } replaces the current history entry instead of pushing a new one.
    // This means pressing the browser Back button doesn't step through every filter change.
    // It's like "overwriting" the URL without adding to the history stack.
    setSearchParams(next, { replace: true });

    // `serialised` is the stable dep; `params` is intentionally excluded to
    // avoid re-running on every render due to the object being recreated.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serialised]);
}
