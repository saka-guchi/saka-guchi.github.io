import fs from 'fs';
import path from 'path';
import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const baseFolder = process.argv[2] || 'docs/step1a_deterministic';
const targetFolder = process.argv[3] || 'docs/step1b_a';
const baseDir = path.resolve(projectRoot, baseFolder);
const targetDir = path.resolve(projectRoot, targetFolder);
const diffDir = path.resolve(projectRoot, 'docs', 'diff_heatmaps');

if (!fs.existsSync(diffDir)) {
  fs.mkdirSync(diffDir, { recursive: true });
}

function readPng(filePath) {
  return new Promise((resolve, reject) => {
    const img = fs.createReadStream(filePath).pipe(new PNG()).on('parsed', () => resolve(img)).on('error', reject);
  });
}

async function compareFiles(file) {
  const img1Path = path.join(baseDir, file);
  const img2Path = path.join(targetDir, file);
  const diffPath = path.join(diffDir, `diff_${file}`);

  if (!fs.existsSync(img1Path) || !fs.existsSync(img2Path)) return null;

  const img1 = await readPng(img1Path);
  const img2 = await readPng(img2Path);

  const { width, height } = img1;
  if (width !== img2.width || height !== img2.height) {
    return { file, error: `Size mismatch: ${width}x${height} vs ${img2.width}x${img2.height}` };
  }

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(img1.data, img2.data, diff.data, width, height, {
    threshold: 0.1,
    includeAA: false,
    diffColor: [255, 0, 80],
  });

  const totalPixels = width * height;
  const diffPercent = ((diffPixels / totalPixels) * 100).toFixed(2);

  await new Promise((resolve, reject) => {
    diff.pack().pipe(fs.createWriteStream(diffPath)).on('finish', resolve).on('error', reject);
  });

  return { file, diffPixels, diffPercent: parseFloat(diffPercent), diffPath };
}

async function main() {
  const files = fs.readdirSync(targetDir).filter(f => f.endsWith('.png'));
  console.log(`\n=== ピクセル差分検証（threshold 0.1, includeAA: false） ===`);
  console.log(`ベースライン: ${baseFolder} vs 対象: ${targetFolder}\n`);
  console.log('| ファイル名 | 差分率 (%) | 差分ピクセル数 | 判定 |');
  console.log('|---|---|---|---|');

  const results = [];
  for (const f of files) {
    const res = await compareFiles(f);
    if (res) results.push(res);
  }

  results.sort((a, b) => b.diffPercent - a.diffPercent);

  for (const r of results) {
    const verdict = r.diffPercent === 0 ? '完全一致 (0.00%)' : r.diffPercent < 1.0 ? '合格 (1%未満微小差分)' : '要確認 (1%超差分)';
    console.log(`| \`${r.file}\` | **${r.diffPercent}%** | ${r.diffPixels.toLocaleString()} px | ${verdict} |`);
  }
}

main().catch(console.error);
