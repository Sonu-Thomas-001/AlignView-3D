/**
 * Verifies how the import session dispatches work, including when the pool misbehaves.
 *
 * This covers the seam that `worker-roundtrip-check.ts` cannot: not whether a stage survives
 * the thread crossing, but whether a stage is ever handed over at the wrong moment or lost.
 * It exists because a real hang shipped here. A bundler does not necessarily run a worker's
 * module body during the worker's initial script evaluation, so the message handler can be
 * installed a tick or more after construction, and a message posted into that window is
 * dropped by the browser with no error on either side. The import then sat at 1 of 34 stages
 * forever. `FakeWorker` below reproduces exactly that timing.
 *
 * The failure paths are asserted the same way, because the fallback is the only reason a
 * broken pool degrades into a slow import rather than a stuck one.
 *
 * Not covered: the two watchdog timers, which fire after 15s and 60s and reach the same
 * `degrade` path exercised here, and the browser's own `new Worker(new URL(...))` wiring,
 * which the bundler emits and only a browser can run.
 *
 * Expect console noise; the session reports pool failures through console.error by design.
 *
 * Run with: npx tsx scripts/import-session-check.ts
 */
import fs from 'fs';
import path from 'path';
import { createStlImportSession } from '../src/utils/stlImportClient';
import { importArchStage, type StagePlacement } from '../src/utils/stlImportPipeline';

const STL_DIR = path.join(__dirname, '..', 'STL');

/** Milliseconds the fake worker spends "loading its chunks" before it starts listening. */
const BOOT_DELAY_MS = 120;

let failures = 0;

function check(ok: boolean, label: string): void {
  console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
  if (!ok) failures++;
}

function bufferFor(name: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(STL_DIR, name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

type FakeMode = 'deferred-ready' | 'construction-fails' | 'crashes-mid-stage';

interface PoolStats {
  /** Stages the browser would have thrown away because no handler was listening yet. */
  dropped: number;
  /** Stages the pool actually completed. */
  served: number;
}

/**
 * Stands in for the browser's Worker, timed like a bundled one.
 *
 * The important detail is `listening`: it turns on a macrotask after construction, and until
 * it does, `postMessage` silently discards. That is the browser's real behaviour when a
 * worker's `onmessage` has not been assigned yet, and it is what the ready handshake exists
 * to avoid.
 */
function installFakeWorker(mode: FakeMode, stats: PoolStats): void {
  class FakeWorker {
    onmessage: ((event: { data: unknown }) => void) | null = null;
    onerror: ((event: unknown) => void) | null = null;
    private listening = false;

    constructor(_url: unknown, _options?: unknown) {
      if (mode === 'construction-fails') throw new Error('Worker unavailable');
      setTimeout(() => {
        this.listening = true;
        this.emit({ kind: 'ready' });
      }, BOOT_DELAY_MS);
    }

    postMessage(request: { id: number; buffer: ArrayBuffer; placement: StagePlacement }): void {
      if (!this.listening) {
        stats.dropped++;
        return;
      }
      if (mode === 'crashes-mid-stage') {
        setTimeout(() => this.onerror?.({ message: 'simulated worker crash' }), 0);
        return;
      }
      setTimeout(() => {
        const result = importArchStage(request.buffer, request.placement);
        stats.served++;
        this.emit({ kind: 'result', id: request.id, result });
      }, 0);
    }

    terminate(): void {}

    private emit(data: unknown): void {
      this.onmessage?.({ data });
    }
  }
  (globalThis as { Worker?: unknown }).Worker = FakeWorker;
}

async function main(): Promise<void> {
  const names = fs.readdirSync(STL_DIR).filter(n => n.toLowerCase().endsWith('.stl')).sort();
  if (names.length === 0) throw new Error(`No STL files in ${STL_DIR}`);
  const sample = names[0];
  const arch: 'upper' | 'lower' = /lower/i.test(sample) ? 'lower' : 'upper';
  const placement: StagePlacement = { arch, frame: null, refCenter: null, mismatchMm: 5 };
  const buffer = bufferFor(sample);

  console.log(`Sample: ${sample} (${arch})\n`);

  const baseline = importArchStage(buffer, placement);

  const submit = async (mode: FakeMode, count: number) => {
    const stats: PoolStats = { dropped: 0, served: 0 };
    installFakeWorker(mode, stats);
    const session = createStlImportSession();
    try {
      const results = await Promise.all(
        Array.from({ length: count }, () => session.run(buffer, placement)),
      );
      return { stats, results };
    } finally {
      session.dispose();
    }
  };

  // The regression itself. Tasks are submitted while the pool is still booting, which is
  // what the upload modal does: it posts the two reference stages the moment it starts.
  const deferred = await submit('deferred-ready', 2);
  check(deferred.stats.dropped === 0, 'no stage posted before the worker was listening');
  check(deferred.stats.served === 2, `both stages ran in the pool (served ${deferred.stats.served})`);
  check(
    deferred.results.every(r => r.trianglesCount === baseline.trianglesCount),
    'pooled results match an in-process import',
  );

  // No pool at all. Every stage still has to be imported.
  const noPool = await submit('construction-fails', 2);
  check(noPool.stats.served === 0, 'nothing reached a worker when construction failed');
  check(
    noPool.results.length === 2 &&
      noPool.results.every(r => r.trianglesCount === baseline.trianglesCount),
    'both stages completed on the main thread instead',
  );

  // A pool that dies holding a stage. The orphan has to be re-run, not lost, which is only
  // possible because stages are posted as copies rather than transferred.
  const crashed = await submit('crashes-mid-stage', 2);
  check(
    crashed.results.length === 2 &&
      crashed.results.every(r => r.trianglesCount === baseline.trianglesCount),
    'a stage orphaned by a crashed worker was re-run and completed',
  );

  // Cancelling while the pool is still booting must settle every caller, not leave the
  // upload modal awaiting a promise that can no longer be resolved.
  installFakeWorker('deferred-ready', { dropped: 0, served: 0 });
  const cancelled = createStlImportSession();
  const abandoned = Promise.allSettled([
    cancelled.run(buffer, placement),
    cancelled.run(buffer, placement),
  ]);
  cancelled.dispose();
  const settled = await abandoned;
  check(
    settled.every(s => s.status === 'rejected' && /cancelled/i.test(String(s.reason))),
    'cancelling rejects every stage still outstanding',
  );

  console.log(
    failures === 0
      ? '\nAll import session checks passed'
      : `\n${failures} import session check(s) failed`,
  );
  process.exit(failures === 0 ? 0 : 1);
}

void main().catch(error => {
  console.error(error);
  process.exit(1);
});
