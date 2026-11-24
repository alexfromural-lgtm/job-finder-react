// ─── hooks/useQueueStatus.ts — Queue Polling Hook ────────────────────────────
//
// A React hook that wraps the pollUntilDone pattern from queue.api.ts.
// Use this when you need to monitor a queued operation and show its status
// in the UI (spinner, success, error).
//
// Note: Most of the app uses pollUntilDone() directly (promise-based).
// This hook is an alternative for components that need reactive status updates.
//
// Usage:
//   const { status, result, error, isLoading } = useQueueStatus(queueJobId);
//   if (isLoading) return <Spinner />;
//   if (error) return <Error message={error} />;
//   if (status === 'completed') return <Success />;

import { useState, useEffect, useCallback, useRef } from 'react';
import axiosClient from '../api/axiosClient';
import type { QueueJobResponse, QueueJobStatus } from '../types';

// Poll every 1.5 seconds
const POLL_INTERVAL_MS = 1500;
const STATUS_COMPLETED: QueueJobStatus = 'completed';
const STATUS_FAILED: QueueJobStatus = 'failed';
// Terminal states: polling stops when one of these is reached.
const TERMINAL_STATES: QueueJobStatus[] = [STATUS_COMPLETED, STATUS_FAILED];

/**
 * Polls the queue status endpoint until the job reaches a terminal state
 * (completed or failed) or the component unmounts.
 *
 * @param queueJobId - null means "not started yet" (no polling)
 */
export function useQueueStatus(queueJobId: string | null) {
  const [status, setStatus] = useState<QueueJobStatus | null>(null);
  const [result, setResult] = useState<unknown>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // useRef for the interval ID — we don't want changing the timer ID to trigger
  // a re-render, so we use a ref instead of state.
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // clearPolling: stops the interval. Defined with useCallback so it's stable.
  const clearPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  // Main polling effect — runs whenever queueJobId changes.
  useEffect(() => {
    // If no job ID, do nothing (operation hasn't started yet).
    if (!queueJobId) return;

    // Reset state for a new poll.
    setIsLoading(true);
    setStatus(null);
    setResult(null);
    setError(null);

    // poll — one status check iteration.
    const poll = async () => {
      try {
        // GET /queue/job/:queueJobId → { status, result?, failedReason? }
        const { data } = await axiosClient.get<QueueJobResponse>(`/queue/job/${queueJobId}`);
        setStatus(data.status);

        if (data.status === STATUS_COMPLETED) {
          // Job finished successfully.
          setResult(data.result ?? null);
          clearPolling();
          setIsLoading(false);
        } else if (data.status === STATUS_FAILED) {
          // Job failed — show the reason.
          setError(data.failedReason ?? 'Operation failed. Please try again.');
          clearPolling();
          setIsLoading(false);
        }
        // If still waiting/active/delayed, the interval continues.
      } catch {
        setError('Could not check operation status.');
        clearPolling();
        setIsLoading(false);
      }
    };

    // Fire immediately (don't wait for the first interval tick).
    poll();

    // Then poll every POLL_INTERVAL_MS milliseconds.
    // setInterval returns an ID we store in the ref for cleanup.
    intervalRef.current = setInterval(() => {
      // Guard: don't poll if we've already reached a terminal state.
      // (The status state may lag behind — the ref is more reliable.)
      if (!TERMINAL_STATES.includes(status as QueueJobStatus)) {
        poll();
      }
    }, POLL_INTERVAL_MS);

    // Cleanup: stop polling when component unmounts or queueJobId changes.
    return () => clearPolling();
  }, [queueJobId, clearPolling]); // eslint-disable-line react-hooks/exhaustive-deps

  return { status, result, error, isLoading };
}
