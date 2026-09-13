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
 * The fallback is not defensive padding. A worker that fails to construct or whose module
 * fails to load is a plausible outcome of a bundler change, a stricter Content Security
 * Policy, or an embedded webview, and none of those should turn into "this product cannot
 * open a case". When it happens the session degrades to this thread and finishes the import.
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

interface Task {
  buffer: ArrayBuffer;
  placement: StagePlacement;
  resolve: (result: StageImport) => void;
  reject: (error: Error) => void;
}

interface Lane {
  worker: Worker;
  /** The task this worker is currently running, or null when it is free. */
  current: Task | null;
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

function spawnLanes(
  count: number,
  onMessage: (event: MessageEvent<StlImportResponse>) => void,
  onFail: () => void,
): Lane[] {
  const lanes: Lane[] = [];
  for (let i = 0; i < count; i++) {
    try {
      // The relative specifier is required: a bundler rewrites this exact
      // `new Worker(new URL('...', import.meta.url))` shape at build time, and a path
      // alias inside `new URL` would be resolved as a URL instead and 404 at runtime.
      const worker = new Worker(new URL('../workers/stlImport.worker.ts', import.meta.url), {
        type: 'module',
      });
      worker.onmessage = onMessage;
      worker.onerror = (event) => {
        event.preventDefault();
        onFail();
      };
      lanes.push({ worker, current: null });
    } catch {
      // Construction failed, so there is no pool. Whatever spawned already gets torn down
      // by the caller, which then runs everything on this thread.
      break;
    }
  }
  return lanes;
}

export function createStlImportSession(): StlImportSession {
  const queue: Task[] = [];
  const pending = new Map<number, Lane>();
  let lanes: Lane[] = [];
  let nextId = 1;
  let disposed = false;
  let offThread = false;

  const settle = (task: Task, response: StlImportResponse) => {
    if (response.ok) task.resolve(response.result);
    else task.reject(new Error(response.error));
  };

  const onMessage = (event: MessageEvent<StlImportResponse>) => {
    const { id } = event.data;
    const lane = pending.get(id);
    if (!lane) return;
    pending.delete(id);
    const task = lane.current;
    lane.current = null;
    if (task) settle(task, event.data);
    pump();
  };

  /**
   * A worker died, which in practice means the module never loaded, so the others will die
   * the same way. The whole pool goes, and the task it was holding goes back on the queue
   * to be run on this thread. The input buffer is still intact because `run` sends a copy
   * rather than transferring it, which is what makes this retry possible at all.
   */
  const onFail = () => {
    if (!offThread) return;
    offThread = false;
    const orphaned = lanes.map(l => l.current).filter((t): t is Task => t !== null);
    for (const lane of lanes) lane.worker.terminate();
    lanes = [];
    pending.clear();
    queue.unshift(...orphaned);
    if (!disposed) pump();
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

  let localBusy = false;

  function pump(): void {
    if (disposed) return;

    if (offThread) {
      for (const lane of lanes) {
        if (lane.current || queue.length === 0) continue;
        const task = queue.shift()!;
        lane.current = task;
        const id = nextId++;
        pending.set(id, lane);
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

  lanes = spawnLanes(desiredLaneCount(), onMessage, onFail);
  offThread = lanes.length > 0;
  if (!offThread) {
    for (const lane of lanes) lane.worker.terminate();
    lanes = [];
  }

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
      for (const lane of lanes) lane.worker.terminate();
      lanes = [];
      pending.clear();
      const abandoned = [...inFlight, ...queue.splice(0, queue.length)];
      for (const task of abandoned) task.reject(new Error('Import cancelled'));
    },
  };
}
