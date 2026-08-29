const fs = require('fs');
const path = require('path');
const zlib = require('zlib');

// Function to generate raw PNG file with 100% alpha transparency
function createPNG(width, height, drawFn) {
  // RGBA buffer: (width * 4 + 1 for filter byte) * height
  const rowSize = 1 + width * 4;
  const rawData = Buffer.alloc(rowSize * height);

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0; // Filter type: None
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 4;
      const [r, g, b, a] = drawFn(x, y, width, height);
      rawData[pixelOffset] = r;
      rawData[pixelOffset + 1] = g;
      rawData[pixelOffset + 2] = b;
      rawData[pixelOffset + 3] = a;
    }
  }

  const compressedData = zlib.deflateSync(rawData);

  // PNG Signature
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  // IHDR chunk
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8; // Bit depth: 8
  ihdr[9] = 6; // Color type: RGBA
  ihdr[10] = 0; // Compression
  ihdr[11] = 0; // Filter
  ihdr[12] = 0; // Interlace

  const ihdrChunk = makeChunk('IHDR', ihdr);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const typeBuf = Buffer.from(type, 'ascii');
  const length = data.length;
  const lenBuf = Buffer.alloc(4);
  lenBuf.writeUInt32BE(length, 0);

  const crcBuf = Buffer.alloc(4);
  const toCrc = Buffer.concat([typeBuf, data]);
  const crc = crc32(toCrc);
  crcBuf.writeUInt32BE(crc >>> 0, 0);

  return Buffer.concat([lenBuf, typeBuf, data, crcBuf]);
}

// Simple CRC32 table
const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    if (c & 1) c = 0xedb88320 ^ (c >>> 1);
    else c = c >>> 1;
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) {
    crc = crcTable[(crc ^ buf[i]) & 0xff] ^ (crc >>> 8);
  }
  return crc ^ 0xffffffff;
}

// 1. Generate Favicon & App Icon (512x512 with transparent background)
const iconPNG = createPNG(512, 512, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  
  // Outer squircle container (radius ~120px)
  const squircleSize = 220;
  const cornerR = 80;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  let inSquircle = false;
  if (dx < squircleSize && dy < squircleSize) {
    if (dx < squircleSize - cornerR || dy < squircleSize - cornerR) {
      inSquircle = true;
    } else {
      const qx = dx - (squircleSize - cornerR);
      const qy = dy - (squircleSize - cornerR);
      if (qx * qx + qy * qy <= cornerR * cornerR) {
        inSquircle = true;
      }
    }
  }

  if (!inSquircle) {
    return [0, 0, 0, 0]; // 100% Transparent
  }

  // Check if inside minimal tooth shape
  // Tooth centered around cx, cy
  const tx = (x - cx) / 160;
  const ty = (y - cy) / 160;

  // Modern clean tooth profile
  const isTooth = (
    ty >= -0.7 && ty <= 0.8 &&
    Math.abs(tx) <= 0.55 &&
    !(ty < -0.4 && Math.abs(tx) < 0.12 && ty > -0.65) // Top notch
  );

  // Aligner Arc (horizontal sweep in cyan)
  const isArc = (
    ty >= 0.05 && ty <= 0.22 &&
    Math.abs(tx) <= 0.85 &&
    (tx * tx * 0.4 + ty >= 0.08)
  );

  if (isArc) {
    return [56, 189, 248, 255]; // Electric Cyan #38BDF8
  }

  if (isTooth) {
    return [255, 255, 255, 255]; // Crisp White Tooth
  }

  // Squircle Background: Royal Blue #2563EB
  return [37, 99, 235, 255];
});

// 2. Generate Transparent Logo Mark (512x512 transparent)
const logoMarkPNG = createPNG(512, 512, (x, y, w, h) => {
  const cx = w / 2;
  const cy = h / 2;
  
  const squircleSize = 220;
  const cornerR = 80;
  const dx = Math.abs(x - cx);
  const dy = Math.abs(y - cy);

  let inSquircle = false;
  if (dx < squircleSize && dy < squircleSize) {
    if (dx < squircleSize - cornerR || dy < squircleSize - cornerR) {
      inSquircle = true;
    } else {
      const qx = dx - (squircleSize - cornerR);
      const qy = dy - (squircleSize - cornerR);
      if (qx * qx + qy * qy <= cornerR * cornerR) {
        inSquircle = true;
      }
    }
  }

  if (!inSquircle) {
    return [0, 0, 0, 0]; // 100% Transparent
  }

  const tx = (x - cx) / 160;
  const ty = (y - cy) / 160;

  const isTooth = (
    ty >= -0.7 && ty <= 0.8 &&
    Math.abs(tx) <= 0.55 &&
    !(ty < -0.4 && Math.abs(tx) < 0.12 && ty > -0.65)
  );

  const isArc = (
    ty >= 0.05 && ty <= 0.22 &&
    Math.abs(tx) <= 0.85 &&
    (tx * tx * 0.4 + ty >= 0.08)
  );

  if (isArc) {
    return [56, 189, 248, 255];
  }

  if (isTooth) {
    return [255, 255, 255, 255];
  }

  return [37, 99, 235, 255];
});

// Save to public directory
const publicDir = path.join(__dirname, '..', 'public');
fs.writeFileSync(path.join(publicDir, 'logo.png'), logoMarkPNG);
fs.writeFileSync(path.join(publicDir, 'icon.png'), iconPNG);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.png'), iconPNG);
fs.writeFileSync(path.join(publicDir, 'favicon.ico'), iconPNG);

console.log('Successfully generated transparent PNG logos and favicons!');
