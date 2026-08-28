/**
 * Production-Grade Concurrency Controller for /api/fetch
 * 
 * Features:
 * - Bounded active extraction concurrency (FETCH_MAX_CONCURRENCY)
 * - Bounded FIFO waiting queue (FETCH_MAX_QUEUE)
 * - Waiting queue timeout (FETCH_QUEUE_TIMEOUT_MS)
 * - Clean slot release in finally block (guaranteed invariant)
 * - Client abort / disconnect cancellation
 * - Real-time diagnostic telemetry metrics
 */

export const FETCH_MAX_CONCURRENCY = 20;
export const FETCH_MAX_QUEUE = 50;
export const FETCH_QUEUE_TIMEOUT_MS = 10000; // 10 seconds

export interface FetchMetrics {
  fetchActive: number;
  fetchQueued: number;
  fetchCompleted: number;
  fetchRejected: number;
  fetchQueueTimeouts: number;
  fetchClientAborts: number;
  fetchProviderTimeouts: number;
  fetchFailures: number;
}

export const fetchMetrics: FetchMetrics = {
  fetchActive: 0,
  fetchQueued: 0,
  fetchCompleted: 0,
  fetchRejected: 0,
  fetchQueueTimeouts: 0,
  fetchClientAborts: 0,
  fetchProviderTimeouts: 0,
  fetchFailures: 0,
};

interface QueuedJob {
  id: string;
  timerId: NodeJS.Timeout;
  resolve: (value: { acquired: boolean; code?: string; error?: string }) => void;
  isAborted: boolean;
}

let activeFetchCount = 0;
const waitingQueue: QueuedJob[] = [];

export interface AcquireResult {
  acquired: boolean;
  code?: 'FETCH_CAPACITY' | 'FETCH_QUEUE_TIMEOUT' | 'CLIENT_ABORTED';
  error?: string;
  statusCode?: number;
}

/**
 * Attempt to acquire an active extraction slot or wait in the FIFO queue
 */
export async function acquireFetchSlot(
  requestId: string,
  clientSignal?: AbortSignal
): Promise<AcquireResult> {
  // If client is already aborted before starting
  if (clientSignal?.aborted) {
    fetchMetrics.fetchClientAborts++;
    return {
      acquired: false,
      code: 'CLIENT_ABORTED',
      error: 'Client disconnected before extraction started.',
      statusCode: 499,
    };
  }

  // Fast path: slot immediately available
  if (activeFetchCount < FETCH_MAX_CONCURRENCY) {
    activeFetchCount++;
    fetchMetrics.fetchActive = activeFetchCount;
    return { acquired: true };
  }

  // Check if queue is full
  if (waitingQueue.length >= FETCH_MAX_QUEUE) {
    fetchMetrics.fetchRejected++;
    return {
      acquired: false,
      code: 'FETCH_CAPACITY',
      error: 'الخادم مشغول حالياً بسبب كثرة طلبات التحميل المتزامنة. يرجى المحاولة بعد قليل (Server is currently busy. Please try again shortly).',
      statusCode: 429,
    };
  }

  // Enqueue in FIFO queue
  return new Promise<AcquireResult>((resolve) => {
    let job: QueuedJob;

    const timerId = setTimeout(() => {
      // Remove from queue
      const index = waitingQueue.indexOf(job);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
        fetchMetrics.fetchQueued = waitingQueue.length;
      }
      fetchMetrics.fetchQueueTimeouts++;
      resolve({
        acquired: false,
        code: 'FETCH_QUEUE_TIMEOUT',
        error: 'الخادم مشغول حالياً وتجاوزت فترة الانتظار الحد المسموح. يرجى إعادة المحاولة (Server is currently busy. Please try again shortly).',
        statusCode: 429,
      });
    }, FETCH_QUEUE_TIMEOUT_MS);

    job = {
      id: requestId,
      timerId,
      resolve: (res) => {
        if (res.acquired) {
          resolve({ acquired: true });
        } else {
          resolve({
            acquired: false,
            code: (res.code as any) || 'FETCH_CAPACITY',
            error: res.error || 'Request cancelled',
            statusCode: 429,
          });
        }
      },
      isAborted: false,
    };

    // Listen to client abort while in queue
    const onAbort = () => {
      job.isAborted = true;
      clearTimeout(timerId);
      const index = waitingQueue.indexOf(job);
      if (index !== -1) {
        waitingQueue.splice(index, 1);
        fetchMetrics.fetchQueued = waitingQueue.length;
      }
      fetchMetrics.fetchClientAborts++;
      resolve({
        acquired: false,
        code: 'CLIENT_ABORTED',
        error: 'Client disconnected while waiting in queue.',
        statusCode: 499,
      });
    };

    if (clientSignal) {
      clientSignal.addEventListener('abort', onAbort, { once: true });
    }

    waitingQueue.push(job);
    fetchMetrics.fetchQueued = waitingQueue.length;
  });
}

/**
 * Release an active extraction slot and immediately dispatch next queued request
 */
export function releaseFetchSlot(): void {
  activeFetchCount = Math.max(0, activeFetchCount - 1);
  fetchMetrics.fetchActive = activeFetchCount;

  // Process next available in FIFO queue
  while (waitingQueue.length > 0) {
    const nextJob = waitingQueue.shift()!;
    fetchMetrics.fetchQueued = waitingQueue.length;
    clearTimeout(nextJob.timerId);

    // If job was already aborted while waiting in queue, skip it
    if (nextJob.isAborted) {
      continue;
    }

    // Hand slot over to this job
    activeFetchCount++;
    fetchMetrics.fetchActive = activeFetchCount;
    nextJob.resolve({ acquired: true });
    return;
  }
}

/**
 * Read-only diagnostic snapshot
 */
export function getFetchConcurrencyStatus() {
  return {
    active: activeFetchCount,
    queued: waitingQueue.length,
    maxConcurrency: FETCH_MAX_CONCURRENCY,
    maxQueue: FETCH_MAX_QUEUE,
    queueTimeoutMs: FETCH_QUEUE_TIMEOUT_MS,
    metrics: { ...fetchMetrics },
  };
}
