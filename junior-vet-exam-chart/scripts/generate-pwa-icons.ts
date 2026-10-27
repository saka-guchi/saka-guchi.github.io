import fs from 'fs';
import path from 'path';
import zlib from 'zlib';

function crc32(buf: Buffer): number {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc ^= buf[i];
    for (let j = 0; j < 8; j++) {
      crc = (crc >>> 1) ^ (crc & 1 ? 0xedb88320 : 0);
    }
  }
  return (crc ^ -1) >>> 0;
}

function makeChunk(type: string, data: Buffer): Buffer {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const body = Buffer.concat([typeBuf, data]);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(body), 0);
  return Buffer.concat([len, body, crc]);
}

function encodePNG(width: number, height: number, rgba: Uint8Array): Buffer {
  const signature = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc((1 + width * 4) * height);
  for (let y = 0; y < height; y++) {
    const rawOffset = y * (1 + width * 4);
    raw[rawOffset] = 0; // Filter: None
    const srcOffset = y * width * 4;
    for (let x = 0; x < width * 4; x++) {
      raw[rawOffset + 1 + x] = rgba[srcOffset + x];
    }
  }

  const idatData = zlib.deflateSync(raw, { level: 9 });
  const idatChunk = makeChunk('IDAT', idatData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

interface Ellipse {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  rad: number;
}

function renderIcon(size: number, isMaskable: boolean): Buffer {
  const rgba = new Uint8Array(size * size * 4);
  const cornerRadius = isMaskable ? 0 : size * 0.22;

  // 肉球の比率（32x32基準をsizeにスケール）
  // 中央揃えのため y を少しオフセット（-0.5px相当）
  const s = size / 32;
  const yOffset = -0.5 * s;

  const ellipses: Ellipse[] = [
    // メイン掌球
    { cx: 16 * s, cy: 19.5 * s + yOffset, rx: 6 * s, ry: 5 * s, rad: 0 },
    // 4つの指
    {
      cx: 10 * s,
      cy: 12.8 * s + yOffset,
      rx: 2.5 * s,
      ry: 3.5 * s,
      rad: (-15 * Math.PI) / 180,
    },
    {
      cx: 14 * s,
      cy: 10.8 * s + yOffset,
      rx: 2.5 * s,
      ry: 3.5 * s,
      rad: 0,
    },
    {
      cx: 18 * s,
      cy: 10.8 * s + yOffset,
      rx: 2.5 * s,
      ry: 3.5 * s,
      rad: 0,
    },
    {
      cx: 22 * s,
      cy: 12.8 * s + yOffset,
      rx: 2.5 * s,
      ry: 3.5 * s,
      rad: (15 * Math.PI) / 180,
    },
  ];

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const idx = (y * size + x) * 4;

      // 角丸マスク（通常アイコンの場合）
      let inBounds = true;
      if (!isMaskable && cornerRadius > 0) {
        const dx = Math.max(0, Math.max(cornerRadius - x, x - (size - 1 - cornerRadius)));
        const dy = Math.max(0, Math.max(cornerRadius - y, y - (size - 1 - cornerRadius)));
        if (dx * dx + dy * dy > cornerRadius * cornerRadius) {
          inBounds = false;
        }
      }

      if (!inBounds) {
        rgba[idx] = 0;
        rgba[idx + 1] = 0;
        rgba[idx + 2] = 0;
        rgba[idx + 3] = 0;
        continue;
      }

      // 背景グラデーション: #2563EB (37, 99, 235) から #1D4ED8 (29, 78, 216)
      const t = y / size;
      const bgR = Math.round(37 * (1 - t) + 29 * t);
      const bgG = Math.round(99 * (1 - t) + 78 * t);
      const bgB = Math.round(235 * (1 - t) + 216 * t);

      // 肉球判定（スーパーサンプリング 2x2 でアンチエイリアス）
      let insideCount = 0;
      const subSteps = [0.25, 0.75];
      for (const sy of subSteps) {
        for (const sx of subSteps) {
          const px = x + sx;
          const py = y + sy;
          let hit = false;
          for (const el of ellipses) {
            const cos = Math.cos(el.rad);
            const sin = Math.sin(el.rad);
            const dx = px - el.cx;
            const dy = py - el.cy;
            const rx = dx * cos - dy * sin;
            const ry = dx * sin + dy * cos;
            if ((rx * rx) / (el.rx * el.rx) + (ry * ry) / (el.ry * el.ry) <= 1.0) {
              hit = true;
              break;
            }
          }
          if (hit) insideCount++;
        }
      }

      const whiteRatio = insideCount / 4;

      // 白と背景色をブレンド
      const r = Math.round(bgR * (1 - whiteRatio) + 255 * whiteRatio);
      const g = Math.round(bgG * (1 - whiteRatio) + 255 * whiteRatio);
      const b = Math.round(bgB * (1 - whiteRatio) + 255 * whiteRatio);

      rgba[idx] = r;
      rgba[idx + 1] = g;
      rgba[idx + 2] = b;
      rgba[idx + 3] = 255;
    }
  }

  return encodePNG(size, size, rgba);
}

// アイコン生成
const outDir = path.resolve('junior-vet-exam-chart/public');

const icons = [
  { name: 'pwa-192x192.png', size: 192, maskable: false },
  { name: 'pwa-512x512.png', size: 512, maskable: false },
  { name: 'maskable-icon-512x512.png', size: 512, maskable: true },
  { name: 'apple-touch-icon.png', size: 180, maskable: false },
];

for (const icon of icons) {
  const filePath = path.join(outDir, icon.name);
  const buf = renderIcon(icon.size, icon.maskable);
  fs.writeFileSync(filePath, buf);
  console.log(`Generated: ${filePath} (${buf.length} bytes)`);
}

