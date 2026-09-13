import {
  importArchStage,
  type StageImport,
  type StagePlacement,
} from './stlImportPipeline';
import type { StlImportRequest, StlImportResponse } from '@/workers/stlImport.worker';

/**
 * Runs arch-stage imports across a small pool of workers, falling back to this thread.
 *
 * Two things this buys. The tab stays responsive, so the progress bar and the cancel button
 * work while a case loads instead of being painted once and then frozen. And a case imports
 * on several cores at once, which matters because thirty-plus stages is the normal size and
 * each one is close to a second of arithmetic.
 *
 * The fallback is not defensive padding. A worker that fails to construct, whose module
 * never loads, or that simply stops answering is a plausible outcome of a bundler change, a
 * stricter Content Security Policy, or an embedded webview, and none of those should turn
 * into "this product cannot open a case". Every path here ends with the import finishing on
 * this thread rather than hanging, because a progress bar frozen at 1/34 with no error is
 * the worst of the available failures: the provider waits, then reloads, and has no idea why.
 */

/**
 * Stages in flight at once.
 *
 * Capped well below the core count on purpose: each in-flight stage holds a parsed arch in
 * memory on top of the ones already imported, and a case is already hundreds of megabytes
 * of geometry. Three is enough to keep the pool busy through the per-stage main-thread work
 * without adding a memory cliff on an eight-gigabyte laptop.
 */
const MAX_CONCURRENCY = 3;

/**
 * How long to wait for a worker to report that it is listening.
 *
 * Generous because in development the worker pulls three.js and three-stdlib as separate
 * uncached chunks over the dev server. If nothing has reported in by then the pool is not
 * coming up and this thread takes over.
 */
const READY_TIMEOUT_MS = 15_000;

/**
 * How long a single stage may sit in a worker before the pool is presumed dead.
 *
 * A stage is around a second on a real case, so this is not a performance bound; it is the
 * backstop that turns any silent stall into a slow import instead of a hung one.
 */
const TASK_TIMEOUT_MS = 60_000;

const LOG = '[stl-import]';

interface Task {
  buffer: ArrayBuffer;
  placement: StagePlacement;
  resolve: (result: StageImport) => void;
  reject: (error: Error) => void;
}

interface Lane {
  worker: Worker;
  /**
   * Set when the worker has posted its ready message, meaning its `onmessage` is installed.
   * No task is posted before this. A bundler may run the worker's module body only after
   * awaiting its chunk loads, and a message that arrives before the handler exists is
   * dropped by the browser with no error on either side.
   */
  ready: boolean;
  /** The task this worker is currently running, or null when it is free. */
  current: Task | null;
  /** Watchdog for `current`, or for the ready handshake before any task is assigned. */
  timer: ReturnType<typeof setTimeout> | null;
}

export interface StlImportSession {
  /** True while work is genuinely off the main thread. Flips to false if the pool dies. */
  readonly offThread: boolean;
  /** How many stages this session will run at once. */
  readonly concurrency: number;
  /** Parses and places one stage. Safe to call more times than `concurrency`; it queues. */
  run(buffer: ArrayBuffer, placement: StagePlacement): Promise<StageImport>;
  /** Terminates the pool and rejects anything still queued. */
  dispose(): void;
}

function desiredLaneCount(): number {
  const cores = typeof navigator !== 'undefined' ? navigator.hardwareConcurrency || 4 : 4;
  // Leave a core for the main thread, which still has to rebuild geometries and paint.
  return Math.max(1, Math.min(MAX_CONCURRENCY, cores - 1));
}

/**
 * The relative specifier is required: a bundler rewrites this exact
 * `new Worker(new URL('...', import.meta.url))` shape at build time, and a path alias inside
 * `new URL` would be resolved as a URL instead and 404 at runtime.
 */
function createWorker(): Worker {
  return new Worker(new URL('../workers/stlImport.worker.ts', import.meta.url), {
    type: 'module',
  });
}

export function createStlImportSession(): StlImportSession {
  const queue: Task[] = [];
  const pending = new Map<number, Lane>();
  let lanes: Lane[] = [];
  let nextId = 1;
  let disposed = false;
  let offThread = false;
  let localBusy = false;

  const clearTimer = (lane: Lane) => {
    if (lane.timer === null) return;
    clearTimeout(lane.timer);
    lane.timer = null;
  };

  /**
   * The pool is not answering, so this thread takes over.
   *
   * Whatever the workers were holding goes back on the queue. The input buffers are still
   * intact because tasks are posted as copies rather than transferred, which is what makes
   * this retry possible at all.
   */
  const degrade = (reason: string) => {
    if (!offThread) return;
    offThread = false;
    console.error(`${LOG} ${reason} - continuing on the main thread`);
    const orphaned = lanes.map(l => l.current).filter((t): t is Task => t !== null);
    for (const lane of lanes) {
      clearTimer(lane);
      lane.worker.terminate();
    }
    lanes = [];
    pending.clear();
    queue.unshift(...orphaned);
    if (!disposed) pump();
  };

  const onResponse = (lane: Lane, response: StlImportResponse) => {
    if (disposed) return;

    if (response.kind === 'ready') {
      lane.ready = true;
      clearTimer(lane);
      pump();
      return;
    }

    // A reply for a task this lane is no longer credited with is a straggler: its watchdog
    // already fired and the stage was re-run elsewhere. Dropping it keeps the result that
    // the caller has already been given.
    if (pending.get(response.id) !== lane) return;
    pending.delete(response.id);
    clearTimer(lane);
    const task = lane.current;
    lane.current = null;
    if (task) {
      if (response.kind === 'result') task.resolve(response.result);
      else task.reject(new Error(response.error));
    }
    pump();
  };

  const spawn = (count: number) => {
    for (let i = 0; i < count; i++) {
      try {
        const lane: Lane = { worker: createWorker(), ready: false, current: null, timer: null };
        lane.worker.onmessage = (event: MessageEvent<StlImportResponse>) =>
          onResponse(lane, event.data);
        lane.worker.onerror = (event) => {
          // Reported, not swallowed. A worker that throws while loading its module is the
          // likeliest way this pool breaks, and calling preventDefault here would hide the
          // one line that explains why the import went slow.
          console.error(`${LOG} worker error: ${event.message || 'unknown'}`, event);
          degrade('worker failed');
        };
        // Until the handshake arrives this timer covers module load, not a task.
        lane.timer = setTimeout(() => {
          if (lanes.some(l => l.ready)) {
            // Others came up, so this one is simply dead weight rather than evidence that
            // workers are unavailable. Leave it unready and it is never dispatched to.
            clearTimer(lane);
            return;
          }
          degrade(`no worker reported ready within ${READY_TIMEOUT_MS}ms`);
        }, READY_TIMEOUT_MS);
        lanes.push(lane);
      } catch (error) {
        console.error(`${LOG} worker construction failed`, error);
        break;
      }
    }
  };

  const runHere = async (task: Task) => {
    // Yield first so the caller's progress update paints before this thread is tied up.
    await new Promise(resolve => setTimeout(resolve, 0));
    try {
      task.resolve(importArchStage(task.buffer, task.placement));
    } catch (error) {
      task.reject(error instanceof Error ? error : new Error(String(error)));
    }
  };

  function pump(): void {
    if (disposed) return;

    if (offThread) {
      for (const lane of lanes) {
        if (!lane.ready || lane.current || queue.length === 0) continue;
        const task = queue.shift()!;
        lane.current = task;
        const id = nextId++;
        pending.set(id, lane);
        lane.timer = setTimeout(() => {
          degrade(`a stage went unanswered for ${TASK_TIMEOUT_MS}ms`);
        }, TASK_TIMEOUT_MS);
        const request: StlImportRequest = {
          id,
          buffer: task.buffer,
          placement: task.placement,
        };
        // Copied rather than transferred. One memcpy of a few megabytes per stage is
        // nothing next to parsing it, and keeping the buffer valid here is what lets a
        // task be retried on this thread if the pool dies mid-import.
        lane.worker.postMessage(request);
      }
      return;
    }

    if (localBusy || queue.length === 0) return;
    localBusy = true;
    const task = queue.shift()!;
    void runHere(task).finally(() => {
      localBusy = false;
      pump();
    });
  }

  spawn(desiredLaneCount());
  offThread = lanes.length > 0;
  console.info(
    offThread
      ? `${LOG} importing with ${lanes.length} worker(s)`
      : `${LOG} importing on the main thread`,
  );

  return {
    get offThread() {
      return offThread;
    },
    get concurrency() {
      return offThread ? lanes.length : 1;
    },
    run(buffer, placement) {
      if (disposed) return Promise.reject(new Error('Import session already disposed'));
      return new Promise<StageImport>((resolve, reject) => {
        queue.push({ buffer, placement, resolve, reject });
        pump();
      });
    },
    dispose() {
      disposed = true;
      // Terminating a worker mid-task leaves that task's promise with nothing left to
      // settle it, so it is rejected here alongside the queued ones. Left pending it would
      // strand the caller's loop and hold on to the buffer it was parsing.
      const inFlight = lanes.map(lane => lane.current).filter((t): t is Task => t !== null);
      for (const lane of lanes) {
        clearTimer(lane);
        lane.worker.terminate();
      }
      lanes = [];
      pending.clear();
      const abandoned = [...inFlight, ...queue.splice(0, queue.length)];
      for (const task of abandoned) task.reject(new Error('Import cancelled'));
    },
  };
}
