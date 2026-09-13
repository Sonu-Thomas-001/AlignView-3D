/**
 * What the scan meshes are actually like underneath, before anything is built on top of them.
 *
 * Every surface-based segmentation needs three things this answers: that welding duplicate
 * vertices recovers real topology, that the topology is manifold enough to walk, and that the
 * triangle winding is consistent - because a concavity measurement is a sign, and without a
 * reliable outward normal the sign is a coin toss.
 */
import fs from 'fs';
import path from 'path';
import * as THREE from 'three';
import { STLLoader } from 'three-stdlib';

const STL_DIR = path.join(process.cwd(), 'STL');

function probe(file: string) {
  const bytes = fs.readFileSync(path.join(STL_DIR, file));
  const geometry = new STLLoader().parse(
    bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer);
  const position = geometry.attributes.position as THREE.BufferAttribute;
  const corners = position.count;
  const triangleCount = corners / 3;

  // Quantised to a micron and packed into one integer key: 17 bits per axis fits inside a
  // double exactly, so this is an exact map with no string keys and no hash collisions.
  const SPAN = 131072;
  const ids = new Map<number, number>();
  const welded = new Uint32Array(corners);
  for (let c = 0; c < corners; c++) {
    const qx = Math.round(position.getX(c) * 1000) + 65536;
    const qy = Math.round(position.getY(c) * 1000) + 65536;
    const qz = Math.round(position.getZ(c) * 1000) + 65536;
    const key = (qx * SPAN + qy) * SPAN + qz;
    let id = ids.get(key);
    if (id === undefined) {
      id = ids.size;
      ids.set(key, id);
    }
    welded[c] = id;
  }
  const vertexCount = ids.size;

  // Directed edges. A consistently wound manifold has every (a->b) matched by exactly one
  // (b->a) on the neighbouring triangle.
  const directed = new Map<number, number>();
  let degenerate = 0;
  for (let t = 0; t < triangleCount; t++) {
    const a = welded[t * 3], b = welded[t * 3 + 1], c = welded[t * 3 + 2];
    if (a === b || b === c || a === c) { degenerate++; continue; }
    for (const [u, v] of [[a, b], [b, c], [c, a]] as const) {
      const key = u * vertexCount + v;
      directed.set(key, (directed.get(key) ?? 0) + 1);
    }
  }
  let paired = 0, unpaired = 0, duplicated = 0;
  for (const [key, count] of directed) {
    if (count > 1) duplicated++;
    const u = Math.floor(key / vertexCount);
    const v = key - u * vertexCount;
    if (directed.has(v * vertexCount + u)) paired++;
    else unpaired++;
  }

  // Signed volume from the winding as given. On a consistently wound closed mesh this is the
  // real volume; on randomly wound triangles the terms cancel and it collapses toward zero.
  const a = new THREE.Vector3(), b = new THREE.Vector3(), c = new THREE.Vector3();
  let signedVolume = 0;
  let areaSum = 0;
  for (let t = 0; t < triangleCount; t++) {
    a.fromBufferAttribute(position, t * 3);
    b.fromBufferAttribute(position, t * 3 + 1);
    c.fromBufferAttribute(position, t * 3 + 2);
    signedVolume += a.dot(new THREE.Vector3().crossVectors(b, c)) / 6;
    areaSum += new THREE.Vector3()
      .crossVectors(b.clone().sub(a), c.clone().sub(a)).length() / 2;
  }
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new THREE.Vector3());
  const boxVolume = size.x * size.y * size.z;

  console.log(`\n=== ${file} ===`);
  console.log(`  ${triangleCount} triangles, ${corners} corners -> ${vertexCount} welded ` +
    `(${(corners / vertexCount).toFixed(2)} copies per vertex), ${degenerate} degenerate`);
  console.log(`  directed edges ${directed.size}: ${paired} paired, ${unpaired} unpaired, ` +
    `${duplicated} traversed twice the same way`);
  console.log(`  mean edge length ${(Math.sqrt(areaSum / triangleCount * 4 / Math.sqrt(3))).toFixed(3)}mm, ` +
    `total area ${areaSum.toFixed(0)}mm2`);
  console.log(`  signed volume ${signedVolume.toFixed(0)}mm3 vs bounding box ` +
    `${boxVolume.toFixed(0)}mm3 (ratio ${(signedVolume / boxVolume).toFixed(3)})`);
  console.log(`  => winding is ${paired / directed.size > 0.99 ? 'CONSISTENT' : 'INCONSISTENT'}, ` +
    `outward normal is ${signedVolume > 0 ? 'the winding as given' : 'the winding reversed'}`);
}

const argIndex = process.argv.indexOf('--stl');
const files = argIndex > -1
  ? [process.argv[argIndex + 1]]
  : fs.readdirSync(STL_DIR).filter(name => /- 01 - Model\.stl$/i.test(name)).sort();
for (const file of files) probe(file);
