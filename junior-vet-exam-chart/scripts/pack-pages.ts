import fs from 'node:fs';
import path from 'node:path';
import { createCanvas } from '@napi-rs/canvas';
// pdfjs-dist の legacy ビルドまたは通常ビルドをインポート
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf.mjs';

// コマンド引数パース
function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx < process.argv.length - 1 ? process.argv[idx + 1] : undefined;
}

const subject = getArg('--subject') || 'rika';
console.log(`Processing subject: ${subject}`);

const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const sourcePdfDir = path.join(privateDir, 'source-pdf');
const pagesOutputDir = path.join(privateDir, 'pages', subject);

if (!fs.existsSync(pagesOutputDir)) {
  fs.mkdirSync(pagesOutputDir, { recursive: true });
}

interface PageIndexItem {
  pageNumber: number;
  type: 'mondai' | 'kaito';
  fileName: string;
  width: number;
  height: number;
  dpi: number;
}

class NodeCanvasFactory {
  create(width: number, height: number) {
    const canvas = createCanvas(width, height);
    const context = canvas.getContext('2d');
    return {
      canvas,
      context,
    };
  }

  reset(canvasAndContext: { canvas: ReturnType<typeof createCanvas>; context: ReturnType<ReturnType<typeof createCanvas>['getContext']> }, width: number, height: number) {
    canvasAndContext.canvas.width = width;
    canvasAndContext.canvas.height = height;
  }

  destroy(canvasAndContext: { canvas: ReturnType<typeof createCanvas>; context: unknown }) {
    canvasAndContext.canvas.width = 0;
    canvasAndContext.canvas.height = 0;
  }
}

async function renderPdf(pdfPath: string, type: 'mondai' | 'kaito', startIndex: number): Promise<PageIndexItem[]> {
  const data = new Uint8Array(fs.readFileSync(pdfPath));
  const canvasFactory = new NodeCanvasFactory();
  const loadingTask = pdfjsLib.getDocument({
    data,
    canvasFactory: canvasFactory as any,
    standardFontDataUrl: path.join(rootDir, 'node_modules/pdfjs-dist/standard_fonts/'),
  });

  const pdfDocument = await loadingTask.promise;
  const numPages = pdfDocument.numPages;
  console.log(`Rendering ${pdfPath}: ${numPages} pages`);

  const results: PageIndexItem[] = [];
  const targetDpi = 200;
  const scale = targetDpi / 72;

  for (let i = 1; i <= numPages; i++) {
    const page = await pdfDocument.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = createCanvas(Math.round(viewport.width), Math.round(viewport.height));
    const context = canvas.getContext('2d');

    const renderContext = {
      canvasContext: context as any,
      viewport: viewport,
    };

    await page.render(renderContext).promise;

    const pageNum = startIndex + i - 1;
    const fileName = `${type}_p${String(i).padStart(3, '0')}.png`;
    const outputPath = path.join(pagesOutputDir, fileName);
    const buffer = canvas.toBuffer('image/png');
    fs.writeFileSync(outputPath, buffer);

    console.log(`Saved: ${fileName} (${viewport.width}x${viewport.height})`);

    results.push({
      pageNumber: pageNum,
      type,
      fileName,
      width: Math.round(viewport.width),
      height: Math.round(viewport.height),
      dpi: targetDpi,
    });
  }

  return results;
}

async function run() {
  try {
    const mondaiPath = path.join(sourcePdfDir, `${subject}-mondai.pdf`);
    const kaitoPath = path.join(sourcePdfDir, `${subject}-kaito.pdf`);

    if (!fs.existsSync(mondaiPath) || !fs.existsSync(kaitoPath)) {
      console.error(`Missing PDF files in ${sourcePdfDir}. Expecting ${subject}-mondai.pdf and ${subject}-kaito.pdf`);
      process.exit(1);
    }

    const mondaiPages = await renderPdf(mondaiPath, 'mondai', 1);
    const kaitoPages = await renderPdf(kaitoPath, 'kaito', 1);

    const pagesIndex = {
      subject,
      totalMondaiPages: mondaiPages.length,
      totalKaitoPages: kaitoPages.length,
      pages: [...mondaiPages, ...kaitoPages],
    };

    fs.writeFileSync(
      path.join(pagesOutputDir, 'pages-index.json'),
      JSON.stringify(pagesIndex, null, 2),
      'utf-8'
    );
    console.log(`Wrote pages-index.json successfully! Total pages: ${mondaiPages.length + kaitoPages.length}`);
  } catch (err) {
    console.error('Error rendering pages:', err);
    process.exit(1);
  }
}

run();

