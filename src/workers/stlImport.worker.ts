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
  /** Transferred, not copied. Detached on the sender once posted. */
  buffer: ArrayBuffer;
  placement: StagePlacement;
}

export type StlImportResponse =
  | { id: number; ok: true; result: StageImport }
  | { id: number; ok: false; error: string };

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
    ctx.postMessage({ id, ok: true, result }, transferablesOf(result));
  } catch (error) {
    // A worker that throws for one bad file must not take the rest of the case down with
    // it, so the failure is reported as a message and the worker stays alive.
    ctx.postMessage({
      id,
      ok: false,
      error: error instanceof Error ? error.message : String(error),
    });
  }
};
