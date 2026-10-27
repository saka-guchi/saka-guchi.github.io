import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx < process.argv.length - 1 ? process.argv[idx + 1] : undefined;
}

const subject = getArg('--subject') || 'rika';
const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const authoringDir = path.join(privateDir, 'authoring', subject);
const pagesDir = path.join(privateDir, 'pages', subject);
const buildFiguresDir = path.join(privateDir, 'build', 'figures');

if (!fs.existsSync(authoringDir)) {
  fs.mkdirSync(authoringDir, { recursive: true });
}
if (!fs.existsSync(buildFiguresDir)) {
  fs.mkdirSync(buildFiguresDir, { recursive: true });
}

export interface FigureDef {
  id: string;
  subject: string;
  pageNumber: number;
  pageFileName: string;
  // 比率座標 [x, y, width, height] (0..1)
  cropRect: [number, number, number, number];
  caption: string;
}

// 理科の図表定義 (200dpi画像: 1653 x 2338)
export const rikaFigures: FigureDef[] = [
  {
    id: 'fig-rika-01-root',
    subject: 'rika',
    pageNumber: 2,
    pageFileName: 'mondai_p002.png',
    // 図1 根の様子
    cropRect: [0.15, 0.11, 0.32, 0.13],
    caption: '図1 植物Aと植物Bの根の様子',
  },
  {
    id: 'fig-rika-01-stem',
    subject: 'rika',
    pageNumber: 2,
    pageFileName: 'mondai_p002.png',
    // 図2 茎の様子
    cropRect: [0.48, 0.11, 0.42, 0.26],
    caption: '図2 植物Aと植物Bの茎の様子',
  },
  {
    id: 'fig-rika-03-archimedes',
    subject: 'rika',
    pageNumber: 5,
    pageFileName: 'mondai_p005.png',
    // 図1と図2
    cropRect: [0.20, 0.28, 0.60, 0.13],
    caption: '図1と図2 浮力の実験',
  },
  {
    id: 'fig-rika-03-thermometer',
    subject: 'rika',
    pageNumber: 6,
    pageFileName: 'mondai_p006.png',
    // 図3と図4 ガリレオ温度計
    cropRect: [0.30, 0.10, 0.40, 0.24],
    caption: '図3・図4 ガリレオ温度計と模式図',
  },
];

async function cropFigures() {
  const figuresJsonPath = path.join(authoringDir, 'figures.json');
  fs.writeFileSync(figuresJsonPath, JSON.stringify(rikaFigures, null, 2), 'utf-8');
  console.log(`Saved figure definitions to ${figuresJsonPath}`);

  for (const fig of rikaFigures) {
    const pagePath = path.join(pagesDir, fig.pageFileName);
    if (!fs.existsSync(pagePath)) {
      console.warn(`Source page not found: ${pagePath}`);
      continue;
    }

    const metadata = await sharp(pagePath).metadata();
    const width = metadata.width || 1653;
    const height = metadata.height || 2338;

    const left = Math.round(fig.cropRect[0] * width);
    const top = Math.round(fig.cropRect[1] * height);
    const extractWidth = Math.round(fig.cropRect[2] * width);
    const extractHeight = Math.round(fig.cropRect[3] * height);

    const outWebpPath = path.join(buildFiguresDir, `${fig.id}.webp`);

    await sharp(pagePath)
      .extract({ left, top, width: extractWidth, height: extractHeight })
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 90 })
      .toFile(outWebpPath);

    console.log(`Cropped and converted: ${outWebpPath} (${extractWidth}x${extractHeight})`);
  }
}

cropFigures().catch(err => {
  console.error(err);
  process.exit(1);
});

