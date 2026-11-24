// ─── components/jobs/JobList.tsx — Job Grid with Infinite Scroll Support ──────
//
// Renders a grid of JobCards and handles three UI states:
//   1. loading = true → spinner
//   2. jobs is empty → empty state message
//   3. jobs has items → grid of cards + optional infinite scroll sentinel
//
// Infinite scroll implementation:
//   When onLoadMore is provided, an invisible 1px div (the "sentinel") is placed
//   after the last card. IntersectionObserver watches this sentinel — when it
//   scrolls into view (300px before the viewport edge), loadMore is called.
//
// Why use a ref for the callback instead of using onLoadMore directly?
//   The IntersectionObserver is set up once and keeps a reference to its callback.
//   If we passed onLoadMore directly, the observer would call an outdated version
//   of the function when it fires. The ref pattern ensures the observer always
//   calls the LATEST version without needing to re-register.

import { useEffect, useRef } from 'react';
import type { Job } from '../../types';
import JobCard from './JobCard';

interface JobListProps {
  jobs: Job[];
  loading?: boolean;
  emptyMessage?: string;              // message when jobs array is empty
  renderActions?: (job: Job) => React.ReactNode; // optional action buttons per card
  /** Provide to enable infinite-scroll sentinel */
  onLoadMore?: () => void;
  loadingMore?: boolean;              // true while next page is being fetched
}

export default function JobList({
  jobs,
  loading = false,
  emptyMessage = 'No jobs found.',
  renderActions,
  onLoadMore,
  loadingMore = false,
}: JobListProps) {
  // sentinelRef: a ref attached to the invisible 1px div at the bottom of the list.
  // When this div enters the viewport, we call onLoadMore.
  const sentinelRef = useRef<HTMLDivElement>(null);

  // callbackRef: a ref that always holds the latest onLoadMore function.
  // This is the "ref callback" pattern to avoid stale closures in the observer.
  const callbackRef = useRef(onLoadMore);
  useEffect(() => {
    // Every time onLoadMore changes, update the ref.
    // The observer reads callbackRef.current, so it always calls the latest version.
    callbackRef.current = onLoadMore;
  }, [onLoadMore]);

  // ── IntersectionObserver setup ─────────────────────────────────────────────
  useEffect(() => {
    const sentinel = sentinelRef.current;

    // If no onLoadMore prop, don't attach the observer (pagination mode).
    if (!onLoadMore || !sentinel) return;

    // IntersectionObserver fires when the sentinel enters/exits the viewport.
    // rootMargin: '300px' means "fire 300px BEFORE the sentinel reaches the viewport".
    // This triggers loading slightly early, so content is ready before the user reaches it.
    const observer = new IntersectionObserver(
      ([entry]) => {
        // entry.isIntersecting = true when the sentinel is visible (or close to visible)
        if (entry.isIntersecting) callbackRef.current?.(); // load next page
      },
      { rootMargin: '300px' }
    );

    observer.observe(sentinel); // start watching the sentinel element

    // Cleanup: stop observing when the effect re-runs or component unmounts.
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!onLoadMore]); // !! converts to boolean; re-attach only when prop is added/removed

  // ── Loading state ──────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="spinner-page">
        <div className="spinner" style={{ width: 36, height: 36 }} />
      </div>
    );
  }

  // ── Empty state ────────────────────────────────────────────────────────────
  if (jobs.length === 0) {
    return (
      <div className="empty-state">
        <div className="empty-state-icon">📋</div>
        <p style={{ margin: 0, fontSize: '1rem', fontWeight: 500 }}>{emptyMessage}</p>
      </div>
    );
  }

  // ── Job grid ───────────────────────────────────────────────────────────────
  return (
    <> {/* React Fragment — no extra DOM wrapper */}
      <div className="grid-jobs">
        {/* Array.map: transform each Job into a JobCard component.
            key={job.id} — React needs a unique key to efficiently update the list
            when items are added/removed/reordered. Use stable IDs, not array index. */}
        {jobs.map((job) => (
          <JobCard
            key={job.id}
            job={job}
            // renderActions is a render prop — a function that returns JSX.
            // If provided, we call it with the current job and pass the result
            // to JobCard's actions slot.
            actions={renderActions ? renderActions(job) : undefined}
          />
        ))}
      </div>

      {/* Sentinel — invisible 1px div. Triggers infinite scroll when it comes into view.
          Only rendered when onLoadMore is provided (scroll mode). */}
      {onLoadMore && <div ref={sentinelRef} style={{ height: 1 }} />}

      {/* Loading more spinner — shows while next page is loading */}
      {loadingMore && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '1.5rem' }}>
          <div className="spinner" style={{ width: 24, height: 24 }} />
        </div>
      )}
    </>
  );
}
