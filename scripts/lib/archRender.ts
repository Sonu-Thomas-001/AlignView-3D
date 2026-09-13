/**
 * Renders an arch mesh to a PNG, crowns in enamel white and gingiva in pink, exactly as the
 * studio materials colour them.
 *
 * This exists because the crown/gum split is a visual result that was being judged by summary
 * statistics a wrong answer can satisfy: a crown area share and a mean margin depth both read
 * healthy while the boundary was in fact a jagged near-horizontal line cutting across the gum.
 * A picture is the only honest check, and a picture a script can produce is one that can be
 * produced again after a change.
 *
 * Deliberately a plain orthographic rasteriser with a z-buffer rather than a headless browser:
 * nothing to install, no server to start, and it draws the geometry the pipeline actually
 * produced rather than whatever a page managed to upload.
 */
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import * as THREE from 'three';

type RGB = [number, number, number];

/** Studio enamel and gingiva, from `DentalArchModel`. */
const ENAMEL: RGB = [255, 255, 255];
const GINGIVA: RGB = [217, 142, 150];
/** Studio dark background. */
const BACKGROUND: RGB = [15, 23, 42];

export interface ArchLayer {
  geometry: THREE.BufferGeometry;
  /**
   * How many triangles at the front of the draw order are crowns. Segmentation puts them
   * there; pass 0 to draw the whole mesh as gingiva, or the triangle count for all enamel.
   */
  crownTriangles: number;
  /** Placement, for drawing a seated pair. Identity when omitted. */
  matrix?: THREE.Matrix4;
  /** Overrides the crown/gum colours, for rendering a diagnostic field instead. */
  colorOf?: (triangle: number) => RGB;
}

export type ViewName =
  | 'front' | 'right' | 'left' | 'above' | 'below' | 'oblique' | 'obliqueBelow';

/** Direction the camera looks FROM, in the canonical arch frame (+Z anterior, +Y up). */
const VIEW_DIRECTIONS: Record<ViewName, [number, number, number]> = {
  front: [0, 0, 1],
  right: [1, 0, 0.001],
  left: [-1, 0, 0.001],
  // An upper arch has its crowns pointing down, so its occlusal view is `below`, not `above`.
  above: [0, 1, 0.001],
  below: [0, -1, 0.001],
  // Roughly the three-quarter view the studio opens on, and its mirror for an upper arch.
  oblique: [0.62, 0.22, 1],
  obliqueBelow: [0.62, -0.22, 1],
};

export interface RenderOptions {
  view: ViewName;
  width?: number;
  height?: number;
  /** Extra room around the model, as a fraction of its size. */
  padding?: number;
  /** Draws a millimetre ruler down the left edge, for reading heights off the picture. */
  scaleBar?: boolean;
  /**
   * Weakens the shading, for pictures whose colour carries a measurement rather than a
   * material: a field read through a light term is a field read wrong.
   */
  flat?: boolean;
}

interface Camera {
  right: THREE.Vector3;
  up: THREE.Vector3;
  forward: THREE.Vector3;
  center: THREE.Vector3;
  /** mm per pixel. */
  scale: number;
}

function buildCamera(
  layers: ArchLayer[],
  view: ViewName,
  width: number,
  height: number,
  padding: number,
): Camera {
  const eye = new THREE.Vector3(...VIEW_DIRECTIONS[view]).normalize();
  const forward = eye.clone().negate();
  // Looking straight down or up, "up" cannot be the vertical axis; anterior takes its place,
  // which puts the incisors at the top of the picture.
  const worldUp = view === 'above' || view === 'below'
    ? new THREE.Vector3(0, 0, 1)
    : new THREE.Vector3(0, 1, 0);
  const right = new THREE.Vector3().crossVectors(worldUp, forward).normalize();
  const up = new THREE.Vector3().crossVectors(forward, right).normalize();

  const bounds = new THREE.Box3();
  for (const layer of layers) {
    layer.geometry.computeBoundingBox();
    const box = layer.geometry.boundingBox!.clone();
    if (layer.matrix) box.applyMatrix4(layer.matrix);
    bounds.union(box);
  }
  const center = bounds.getCenter(new THREE.Vector3());

  // Fit the projected extent of the box corners, so nothing is clipped at any angle.
  const point = new THREE.Vector3();
  let halfWidth = 0;
  let halfHeight = 0;
  for (let corner = 0; corner < 8; corner++) {
    point.set(
      corner & 1 ? bounds.max.x : bounds.min.x,
      corner & 2 ? bounds.max.y : bounds.min.y,
      corner & 4 ? bounds.max.z : bounds.min.z,
    ).sub(center);
    halfWidth = Math.max(halfWidth, Math.abs(point.dot(right)));
    halfHeight = Math.max(halfHeight, Math.abs(point.dot(up)));
  }

  // One scale for both axes, so the picture is not stretched.
  const scale = Math.max(
    (halfWidth * 2 * (1 + padding)) / width,
    (halfHeight * 2 * (1 + padding)) / height,
  );
  return { right, up, forward, center, scale };
}

/** Rasterises the layers into an RGB buffer, row-major from the top. */
function rasterise(
  layers: ArchLayer[],
  camera: Camera,
  width: number,
  height: number,
  flat: boolean,
): Uint8Array {
  const pixels = new Uint8Array(width * height * 3);
  for (let i = 0; i < width * height; i++) {
    pixels[i * 3] = BACKGROUND[0];
    pixels[i * 3 + 1] = BACKGROUND[1];
    pixels[i * 3 + 2] = BACKGROUND[2];
  }
  const depth = new Float32Array(width * height).fill(Infinity);

  // A headlight, offset up and to the right for shape. Fixed to the world it would leave a
  // view from underneath - the one that shows an upper arch's occlusal surfaces - entirely in
  // shadow, and the point of these pictures is to be read.
  const light = camera.forward.clone().negate()
    .addScaledVector(camera.up, 0.45)
    .addScaledVector(camera.right, 0.3)
    .normalize();
  const a = new THREE.Vector3();
  const b = new THREE.Vector3();
  const c = new THREE.Vector3();
  const ab = new THREE.Vector3();
  const ac = new THREE.Vector3();
  const normal = new THREE.Vector3();
  const screenX = new Float64Array(3);
  const screenY = new Float64Array(3);
  const screenD = new Float64Array(3);

  for (const layer of layers) {
    const position = layer.geometry.attributes.position as THREE.BufferAttribute;
    const index = layer.geometry.index;
    const triangles = Math.floor((index ? index.count : position.count) / 3);

    for (let triangle = 0; triangle < triangles; triangle++) {
      const i0 = index ? index.getX(triangle * 3) : triangle * 3;
      const i1 = index ? index.getX(triangle * 3 + 1) : triangle * 3 + 1;
      const i2 = index ? index.getX(triangle * 3 + 2) : triangle * 3 + 2;
      a.fromBufferAttribute(position, i0);
      b.fromBufferAttribute(position, i1);
      c.fromBufferAttribute(position, i2);
      if (layer.matrix) {
        a.applyMatrix4(layer.matrix);
        b.applyMatrix4(layer.matrix);
        c.applyMatrix4(layer.matrix);
      }

      normal.crossVectors(ab.subVectors(b, a), ac.subVectors(c, a));
      if (normal.lengthSq() === 0) continue;
      normal.normalize();
      // STL winding is not to be trusted, so the normal is turned to face the camera.
      if (normal.dot(camera.forward) > 0) normal.negate();
      const lit = Math.max(0, normal.dot(light));
      const shade = flat ? 0.85 + 0.15 * lit : 0.3 + 0.7 * lit;

      const base = layer.colorOf
        ? layer.colorOf(triangle)
        : (triangle < layer.crownTriangles ? ENAMEL : GINGIVA);

      const corners = [a, b, c];
      for (let k = 0; k < 3; k++) {
        const point = corners[k].sub(camera.center);
        screenX[k] = width / 2 + point.dot(camera.right) / camera.scale;
        screenY[k] = height / 2 - point.dot(camera.up) / camera.scale;
        screenD[k] = point.dot(camera.forward);
      }

      const minX = Math.max(0, Math.floor(Math.min(screenX[0], screenX[1], screenX[2])));
      const maxX = Math.min(width - 1, Math.ceil(Math.max(screenX[0], screenX[1], screenX[2])));
      const minY = Math.max(0, Math.floor(Math.min(screenY[0], screenY[1], screenY[2])));
      const maxY = Math.min(height - 1, Math.ceil(Math.max(screenY[0], screenY[1], screenY[2])));
      if (minX > maxX || minY > maxY) continue;

      const area = (screenX[1] - screenX[0]) * (screenY[2] - screenY[0])
        - (screenX[2] - screenX[0]) * (screenY[1] - screenY[0]);
      if (area === 0) continue;

      for (let y = minY; y <= maxY; y++) {
        for (let x = minX; x <= maxX; x++) {
          const px = x + 0.5;
          const py = y + 0.5;
          // Barycentric weights, divided by the signed area so winding does not matter.
          const w0 = ((screenX[1] - px) * (screenY[2] - py)
            - (screenX[2] - px) * (screenY[1] - py)) / area;
          const w1 = ((screenX[2] - px) * (screenY[0] - py)
            - (screenX[0] - px) * (screenY[2] - py)) / area;
          const w2 = 1 - w0 - w1;
          if (w0 < 0 || w1 < 0 || w2 < 0) continue;

          const d = w0 * screenD[0] + w1 * screenD[1] + w2 * screenD[2];
          const cell = y * width + x;
          if (d >= depth[cell]) continue;
          depth[cell] = d;
          pixels[cell * 3] = Math.min(255, base[0] * shade);
          pixels[cell * 3 + 1] = Math.min(255, base[1] * shade);
          pixels[cell * 3 + 2] = Math.min(255, base[2] * shade);
        }
      }
    }
  }
  return pixels;
}

/** Ticks every millimetre, longer every five, so heights can be read off the picture. */
function drawScaleBar(pixels: Uint8Array, width: number, height: number, mmPerPixel: number) {
  const set = (x: number, y: number, value: number) => {
    if (x < 0 || y < 0 || x >= width || y >= height) return;
    const cell = (y * width + x) * 3;
    pixels[cell] = value;
    pixels[cell + 1] = value;
    pixels[cell + 2] = value;
  };
  for (let y = 0; y < height; y++) set(6, y, 90);
  const centre = Math.floor(height / 2);
  for (let mm = -60; mm <= 60; mm++) {
    const y = Math.round(centre - mm / mmPerPixel);
    const length = mm % 5 === 0 ? 10 : 5;
    for (let x = 6; x <= 6 + length; x++) set(x, y, mm % 5 === 0 ? 230 : 140);
  }
}

function chunk(type: string, data: Buffer): Buffer {
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const body = Buffer.concat([Buffer.from(type, 'ascii'), data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body) >>> 0, 0);
  return Buffer.concat([length, body, crc]);
}

let crcTable: Int32Array | null = null;
function crc32(buffer: Buffer): number {
  if (!crcTable) {
    crcTable = new Int32Array(256);
    for (let n = 0; n < 256; n++) {
      let c = n;
      for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
      crcTable[n] = c;
    }
  }
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return crc ^ 0xffffffff;
}

function encodePng(pixels: Uint8Array, width: number, height: number): Buffer {
  const stride = width * 3;
  const raw = Buffer.alloc((stride + 1) * height);
  const source = Buffer.from(pixels.buffer, pixels.byteOffset, pixels.byteLength);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter: none
    source.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0);
  header.writeUInt32BE(height, 4);
  header[8] = 8; // bit depth
  header[9] = 2; // colour type: RGB
  return Buffer.concat([
    Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', header),
    chunk('IDAT', zlib.deflateSync(raw, { level: 6 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

/** Renders and writes a PNG, returning the path and the picture's scale in mm per pixel. */
export function renderToFile(
  file: string,
  layers: ArchLayer[],
  options: RenderOptions,
): { file: string; mmPerPixel: number } {
  const width = options.width ?? 1000;
  const height = options.height ?? 700;
  const camera = buildCamera(layers, options.view, width, height, options.padding ?? 0.08);
  const pixels = rasterise(layers, camera, width, height, options.flat ?? false);
  if (options.scaleBar) drawScaleBar(pixels, width, height, camera.scale);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, encodePng(pixels, width, height));
  return { file, mmPerPixel: camera.scale };
}
