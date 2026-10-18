import { deflateSync } from 'node:zlib';
import { writeFileSync } from 'node:fs';

function crc32(buf) {
  let c = ~0;
  for (const b of buf) {
    c ^= b;
    for (let k = 0; k < 8; k++) c = (c >>> 1) ^ (0xedb88320 & -(c & 1));
  }
  return ~c >>> 0;
}

function chunk(type, data) {
  const t = Buffer.from(type);
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length);
  const body = Buffer.concat([t, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body));
  return Buffer.concat([len, body, crc]);
}

function png(size, paint) {
  const stride = size * 4 + 1;
  const raw = Buffer.alloc(stride * size);
  for (let y = 0; y < size; y++) {
    raw[y * stride] = 0;
    for (let x = 0; x < size; x++) {
      const [r, g, b, a] = paint(x / size, y / size);
      const o = y * stride + 1 + x * 4;
      raw[o] = r;
      raw[o + 1] = g;
      raw[o + 2] = b;
      raw[o + 3] = a;
    }
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(size, 0);
  ihdr.writeUInt32BE(size, 4);
  ihdr[8] = 8;
  ihdr[9] = 6;
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', deflateSync(raw)),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

function dist(x, y, cx, cy) {
  return Math.hypot(x - cx, y - cy);
}

function paint(x, y) {
  // sky
  let r = 255,
    g = 214,
    b = 168,
    a = 255;
  const sky = y < 0.72;
  if (sky) {
    const t = y / 0.72;
    r = 142 + (255 - 142) * t;
    g = 198 + (230 - 198) * t;
    b = 255 + (196 - 255) * t;
  } else {
    const t = (y - 0.72) / 0.28;
    r = 90 + t * 40;
    g = 170 - t * 20;
    b = 110;
  }
  // moon
  if (dist(x, y, 0.78, 0.22) < 0.1) {
    r = 255;
    g = 246;
    b = 214;
  }
  // tower
  if (x > 0.38 && x < 0.62 && y > 0.28 && y < 0.78) {
    r = 109;
    g = 70;
    b = 176;
  }
  // roof
  const roof = y > 0.16 && y < 0.34 && Math.abs(x - 0.5) < (0.34 - y) * 0.9;
  if (roof) {
    r = 227;
    g = 106;
    b = 138;
  }
  // door
  if (x > 0.46 && x < 0.54 && y > 0.58 && y < 0.78) {
    r = 255;
    g = 214;
    b = 120;
  }
  // window
  if (dist(x, y, 0.5, 0.46) < 0.045) {
    r = 255;
    g = 244;
    b = 196;
  }
  // star on wand
  if (dist(x, y, 0.7, 0.4) < 0.035) {
    r = 240;
    g = 180;
    b = 41;
  }
  // rounded icon mask
  const dx = Math.max(Math.abs(x - 0.5) - 0.38, 0);
  const dy = Math.max(Math.abs(y - 0.5) - 0.38, 0);
  if (Math.hypot(dx, dy) > 0.12) a = 0;
  return [Math.max(0, Math.min(255, r)), Math.max(0, Math.min(255, g)), Math.max(0, Math.min(255, b)), a];
}

for (const size of [192, 512]) {
  writeFileSync(`public/icon-${size}.png`, png(size, paint));
}
console.log('icons written');
