/**
 * Verifies the contract between the import worker and the main thread.
 *
 * Runs `importArchStage` inside a real worker thread against a real STL, transfers the
 * result across the thread boundary, rebuilds the geometry on the other side, and compares
 * it against the same import done in-process.
 *
 * The point is the crossing, not the arithmetic: which arrays end up on the transfer list,
 * whether the vertex attributes and the two material groups survive, and whether the
 * crown/gum split arrives and is cached where the render path looks for it. Getting any of
 * those wrong corrupts a mesh silently rather than throwing, which is the worst failure
 * mode this app has. It does not cover the browser's `new Worker(new URL(...))` wiring; the
 * bundler emits that, and only a browser can exercise it.
 *
 * Run with: npx tsx scripts/worker-roundtrip-check.ts
 */
import fs from 'fs';
import path from 'path';
import { Worker, isMainThread, parentPort, workerData } from 'worker_threads';
import {
  importArchStage,
  transferablesOf,
  geometryFromImport,
  type StageImport,
} from '../src/utils/stlImportPipeline';

const STL_DIR = path.join(__dirname, '..', 'STL');

function bufferFor(name: string): ArrayBuffer {
  const buf = fs.readFileSync(path.join(STL_DIR, name));
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

if (!isMainThread) {
  const { name, arch } = workerData as { name: string; arch: 'upper' | 'lower' };
  const result = importArchStage(bufferFor(name), {
    arch,
    frame: null,
    refCenter: null,
    mismatchMm: 5,
  });
  parentPort!.postMessage(result, transferablesOf(result));
} else {
  const name = fs
    .readdirSync(STL_DIR)
    .filter(f => f.toLowerCase().endsWith('.stl'))
    .find(f => /upper/i.test(f))!;
  const arch = 'upper' as const;

  const expected = importArchStage(bufferFor(name), {
    arch,
    frame: null,
    refCenter: null,
    mismatchMm: 5,
  });
  const expectedGeometry = geometryFromImport(expected);

  const worker = new Worker(__filename, {
    workerData: { name, arch },
  });

  worker.on('message', (received: StageImport) => {
    const failures: string[] = [];
    const check = (label: string, ok: boolean) => {
      if (!ok) failures.push(label);
      console.log(`${ok ? 'OK  ' : 'FAIL'} ${label}`);
    };

    const geometry = geometryFromImport(received);

    check(
      `attribute names (${received.attributes.map(a => a.name).join(', ')})`,
      JSON.stringify(received.attributes.map(a => [a.name, a.itemSize])) ===
        JSON.stringify(expected.attributes.map(a => [a.name, a.itemSize])),
    );
    check(
      `vertex count ${geometry.attributes.position.count}`,
      geometry.attributes.position.count === expectedGeometry.attributes.position.count,
    );

    const a = geometry.attributes.position.array as Float32Array;
    const b = expectedGeometry.attributes.position.array as Float32Array;
    let maxDelta = 0;
    for (let i = 0; i < a.length; i++) maxDelta = Math.max(maxDelta, Math.abs(a[i] - b[i]));
    check(`positions identical (max delta ${maxDelta})`, maxDelta === 0);

    check(
      `material groups ${JSON.stringify(geometry.groups)}`,
      JSON.stringify(geometry.groups) === JSON.stringify(expectedGeometry.groups),
    );
    check(
      `crown/gum split present (${received.split?.toothTriangles} crown, ${received.split?.gumTriangles} gum)`,
      !!received.split &&
        received.split.toothTriangles === expected.split!.toothTriangles &&
        received.split.gumTriangles === expected.split!.gumTriangles,
    );
    check(
      'split written to userData so segmentation is not redone',
      geometry.userData.toothGumSplit?.toothTriangles === expected.split!.toothTriangles,
    );
    check(
      `frame matches (16 numbers)`,
      received.frame.length === 16 && received.frame.every((v, i) => v === expected.frame[i]),
    );
    check(
      `bounding box rebuilt`,
      !!geometry.boundingBox && !!geometry.boundingSphere &&
        Math.abs(geometry.boundingBox.max.y - expectedGeometry.boundingBox!.max.y) === 0,
    );
    check(
      `triangle count ${received.trianglesCount}`,
      received.trianglesCount === expected.trianglesCount,
    );

    console.log(
      failures.length === 0
        ? `\nAll round-trip checks passed for ${name}`
        : `\n${failures.length} FAILED: ${failures.join(' | ')}`,
    );
    void worker.terminate();
    process.exit(failures.length === 0 ? 0 : 1);
  });

  worker.on('error', err => {
    console.error('worker error:', err);
    process.exit(1);
  });
}
