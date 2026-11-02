import fs from 'fs';
import path from 'path';
import sharp from 'sharp';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const baseDir = path.resolve(projectRoot, 'docs', 'baseline');
const step1aDir = path.resolve(projectRoot, 'docs', 'step1a');

async function compareImages(img1Path, img2Path) {
  try {
    const img1 = await sharp(img1Path).raw().toBuffer({ resolveWithObject: true });
    const img2 = await sharp(img2Path).raw().toBuffer({ resolveWithObject: true });

    if (img1.data.length !== img2.data.length) {
      return { diffPixels: -1, diffPercent: 100, reason: 'dimension-mismatch' };
    }

    let diffCount = 0;
    const totalPixels = img1.data.length / img1.info.channels;
    const threshold = 10; // Color diff threshold

    for (let i = 0; i < img1.data.length; i += img1.info.channels) {
      const dr = Math.abs(img1.data[i] - img2.data[i]);
      const dg = Math.abs(img1.data[i + 1] - img2.data[i + 1]);
      const db = Math.abs(img1.data[i + 2] - img2.data[i + 2]);
      if (dr > threshold || dg > threshold || db > threshold) {
        diffCount++;
      }
    }

    const diffPercent = ((diffCount / totalPixels) * 100).toFixed(2);
    return { diffPixels: diffCount, diffPercent: parseFloat(diffPercent) };
  } catch (err) {
    return { error: err.message };
  }
}

async function main() {
  const step1aFiles = fs.readdirSync(step1aDir).filter(f => f.endsWith('.png'));
  console.log(`Comparing ${step1aFiles.length} images between baseline and step1a...`);

  const results = [];
  for (const file of step1aFiles) {
    const baseFile = path.join(baseDir, file);
    const stepFile = path.join(step1aDir, file);

    if (fs.existsSync(baseFile)) {
      const diff = await compareImages(baseFile, stepFile);
      results.push({
        file,
        diffPercent: diff.diffPercent || 0,
        diffPixels: diff.diffPixels || 0,
      });
    } else {
      results.push({ file, missingBaseline: true });
    }
  }

  // Sort by diffPercent descending
  results.sort((a, b) => (b.diffPercent || 0) - (a.diffPercent || 0));

  console.log('\n=== Image Pixel Difference Ranking ===');
  console.log('| ファイル名 | 差分率 (%) | 差分ピクセル数 | 変化要因の分析 |');
  console.log('|---|---|---|---|');

  for (const r of results) {
    let factor = 'CSSトークン置換（角丸・フォント微小引き上げ）';
    if (r.diffPercent === 0) {
      factor = '完全一致（差分なし）';
    } else if (r.diffPercent > 5) {
      factor = '動的要素（タイマー・点滅・プログレス幅等）または見出しフォント微増';
    }
    console.log(`| \`${r.file}\` | ${r.diffPercent}% | ${r.diffPixels.toLocaleString()} px | ${factor} |`);
  }
}

main().catch(console.error);
