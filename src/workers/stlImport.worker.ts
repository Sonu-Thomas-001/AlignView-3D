import {
  importArchStage,
  transferablesOf,
  type StageImport,
  type StagePlacement,
} from '@/utils/stlImportPipeline';

/**
 * Parses and places arch stages off the main thread.
 *
 * Deliberately thin: every decision lives in `stlImportPipeline`, so this file is only the
 * message plumbing. One instance handles many stages in sequence, and several instances run
 * as a pool, which is what makes importing a thirty-stage case use more than one core.
 */

export interface StlImportRequest {
  id: number;
  /** Copied, not transferred, so the sender can retry the stage if this worker dies. */
  buffer: ArrayBuffer;
  placement: StagePlacement;
}

export type StlImportResponse =
  | { kind: 'ready' }
  | { kind: 'result'; id: number; result: StageImport }
  | { kind: 'error'; id: number; error: string };

/**
 * Typed by hand rather than through the webworker lib, which would need its own tsconfig
 * for one file. The DOM lib types the global `self` as a Window, whose `postMessage` has a
 * different signature.
 */
const ctx = self as unknown as {
  onmessage: ((event: MessageEvent<StlImportRequest>) => void) | null;
  postMessage: (message: StlImportResponse, transfer?: Transferable[]) => void;
};

ctx.onmessage = (event) => {
  const { id, buffer, placement } = event.data;
  try {
    const result = importArchStage(buffer, placement);
    ctx.postMessage({ kind: 'result', id, result }, transferablesOf(result));
  } catch (error) {
    // A worker that throws for one bad file must not take the rest of the case down with
    // it, so the failure is reported as a message and the worker stays alive.
    ctx.postMessage({
      kind: 'error',
      id,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};

/**
 * Announces that the handler above is installed. Must be the last statement in the module.
 *
 * This is not a nicety, it is the difference between the pool working and the import hanging
 * forever. A bundler does not necessarily run this module during the worker's initial script
 * evaluation: Turbopack's worker runtime instantiates the entry module after awaiting its
 * chunk loads, so the module body runs a microtask or more later. The browser enables the
 * worker's message queue as soon as the initial script finishes, and a message dispatched
 * while `onmessage` is still null is dropped silently, with no error anywhere. So the main
 * thread waits to be told this worker is listening rather than assuming it from construction.
 */
ctx.postMessage({ kind: 'ready' });
