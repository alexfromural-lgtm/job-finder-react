// ─── api/queue.api.ts — Queue Status Polling ─────────────────────────────────
//
// When an operation is queued (apply to job, save job), the backend returns
// a queueJobId immediately. We then poll GET /queue/job/:id to find out
// when the background worker finishes.
//
// Two exports:
//   getQueueJobStatus — a single status check (one HTTP call)
//   pollUntilDone     — repeatedly calls the above until terminal state

import axiosClient from './axiosClient';

// ─── Types ────────────────────────────────────────────────────────────────────

// QueueStatus: all possible states of a background job.
// Terminal states are 'completed' and 'failed' — polling stops at these.
// Non-terminal: 'waiting', 'active', 'delayed', 'paused' → keep polling.
export type QueueStatus = 'waiting' | 'active' | 'completed' | 'failed' | 'delayed' | 'paused';

// QueueJobResult: what the GET /queue/job/:id endpoint returns.
export interface QueueJobResult {
  id: string | number;
  type: string;             // e.g. 'apply-job', 'save-job'
  status: QueueStatus;
  attemptsMade?: number;
  createdAt?: string;
  /** Present when status === "completed" */
  result?: unknown;
  /** Present when status === "failed" */
  failedReason?: string;
}

// ─── Single Status Check ──────────────────────────────────────────────────────

// getQueueJobStatus — one GET call to check a job's current status.
// Used internally by pollUntilDone.
//
// Example:
//   const { status } = await getQueueJobStatus('q-123');
//   if (status === 'completed') { /* done! */ }
export const getQueueJobStatus = async (
  jobId: string | number,
  signal?: AbortSignal
): Promise<QueueJobResult> => {
  const { data } = await axiosClient.get<QueueJobResult>(`/queue/job/${jobId}`, { signal });
  return data;
};

// ─── Polling Helper ───────────────────────────────────────────────────────────

/**
 * Polls GET /api/queue/job/:jobId every `intervalMs` milliseconds until the
 * job reaches a terminal state (completed | failed), or until `timeoutMs` elapses.
 *
 * Returns a Promise so callers can await it like any other async operation:
 *   await pollUntilDone(queueJobId, 600, 15_000, controller.signal);
 *
 * Design: uses a raw Promise + recursive setTimeout instead of setInterval.
 * This guarantees that the NEXT tick only starts AFTER the previous HTTP call
 * finishes (setInterval would stack up ticks if the server is slow).
 *
 * AbortSignal integration: cancels polling when the component unmounts,
 * preventing memory leaks and spurious state updates.
 *
 * @param jobId       queue job ID returned by the 202 Accepted response
 * @param intervalMs  ms between polls (default 600ms)
 * @param timeoutMs   max total wait time (default 30s)
 * @param signal      optional AbortSignal to cancel early
 */
export const pollUntilDone = (
  jobId: string | number,
  intervalMs = 600,
  timeoutMs = 30_000,
  signal?: AbortSignal
): Promise<QueueJobResult> => {
  // new Promise gives us resolve/reject to call when polling finishes.
  return new Promise((resolve, reject) => {
    // Calculate the absolute deadline timestamp.
    // Date.now() returns ms since epoch; adding timeoutMs gives the cutoff.
    // Example: Date.now() = 1_000_000 ms, timeoutMs = 30_000 → deadline = 1_030_000 ms
    const deadline = Date.now() + timeoutMs;

    // timerId holds the reference to the pending setTimeout so we can cancel it.
    let timerId: ReturnType<typeof setTimeout> | undefined;

    // Reject immediately if the signal is already aborted before we even start.
    // This handles the case where the component unmounted before polling began.
    if (signal?.aborted) {
      reject(new DOMException('Polling aborted', 'AbortError'));
      return;
    }

    // Register an abort listener — fires when the caller calls controller.abort().
    // clearTimeout stops the next scheduled tick, then we reject the Promise.
    signal?.addEventListener('abort', () => {
      clearTimeout(timerId);
      reject(new DOMException('Polling aborted', 'AbortError'));
    });

    // tick — one polling iteration.
    // It calls getQueueJobStatus, checks the result, and either:
    //   • resolves/rejects the Promise (terminal state)
    //   • schedules the NEXT tick with setTimeout (non-terminal state)
    const tick = async () => {
      // Guard: if abort fired between scheduling and execution, stop immediately.
      if (signal?.aborted) return;

      // Timeout guard: if we've exceeded the deadline, give up.
      if (Date.now() >= deadline) {
        reject(
          new Error('Timed out waiting for the server to process your request. Please try again.')
        );
        return;
      }

      try {
        const jobStatus = await getQueueJobStatus(jobId, signal);

        if (jobStatus.status === 'completed') {
          // 🎉 Background job finished successfully → resolve with the result.
          resolve(jobStatus);
        } else if (jobStatus.status === 'failed') {
          // ❌ Background job failed → reject with the reason.
          reject(new Error(jobStatus.failedReason ?? 'The server could not process your request.'));
        } else {
          // ⏳ Still in progress (waiting | active | delayed | paused)
          // Schedule the next poll after intervalMs milliseconds.
          timerId = setTimeout(tick, intervalMs);
        }
      } catch (err) {
        // Network error during the status check → propagate.
        reject(err);
      }
    };

    // Start the first poll immediately (don't wait for the first interval).
    tick();
  });
};
