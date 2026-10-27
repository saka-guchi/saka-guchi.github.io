import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import JSZip from 'jszip';
import sharp from 'sharp';

const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const distPackDir = path.join(privateDir, 'dist-pack');

if (!fs.existsSync(distPackDir)) {
  fs.mkdirSync(distPackDir, { recursive: true });
}

function sha256Buffer(buf: Buffer): string {
  return crypto.createHash('sha256').update(buf).digest('hex');
}

async function buildPack() {
  console.log('=== Building Content Pack (master100-pack-yasuda-2024-v1.0.0.zip) ===');
  const zip = new JSZip();

  const examId = 'yasuda-2024';
  const packId = `pack-${examId}-1.0.0`;
  const schemaVersion = '1.0.0';
  const contentVersion = '1.0.0';

  const authoringDir = path.join(privateDir, 'authoring', 'rika');
  const pagesDir = path.join(privateDir, 'pages', 'rika');
  const figuresDir = path.join(privateDir, 'build', 'figures');

  // data/ フォルダ
  const dataFiles = [
    'questions.json',
    'skills.json',
    'practice.json',
    'transfer.json',
    'integrated.json',
    'stage2.json',
    'figures.json',
  ];

  const filesManifest: { path: string; sha256: string }[] = [];

  for (const fileName of dataFiles) {
    const filePath = path.join(authoringDir, fileName);
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath);
      const zipPath = `data/${fileName}`;
      zip.file(zipPath, content);
      filesManifest.push({ path: zipPath, sha256: sha256Buffer(content) });
    }
  }

  // ページ画像を WebP に変換して images/pages/rika/ に格納
  const pageFiles = fs.readdirSync(pagesDir).filter(f => f.endsWith('.png'));
  for (const pf of pageFiles) {
    const srcPng = path.join(pagesDir, pf);
    const webpName = pf.replace('.png', '.webp');
    const webpBuffer = await sharp(srcPng)
      .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
      .webp({ quality: 85 })
      .toBuffer();

    const zipPath = `images/pages/rika/${webpName}`;
    zip.file(zipPath, webpBuffer);
    filesManifest.push({ path: zipPath, sha256: sha256Buffer(webpBuffer) });
  }

  // 切り抜き図表
  if (fs.existsSync(figuresDir)) {
    const figFiles = fs.readdirSync(figuresDir).filter(f => f.endsWith('.webp'));
    for (const ff of figFiles) {
      const srcWebp = path.join(figuresDir, ff);
      const content = fs.readFileSync(srcWebp);
      const zipPath = `images/figures/${ff}`;
      zip.file(zipPath, content);
      filesManifest.push({ path: zipPath, sha256: sha256Buffer(content) });
    }
  }

  // manifest.json
  const manifest = {
    packId,
    examId,
    schemaVersion,
    contentVersion,
    createdAt: new Date().toISOString(),
    subjects: [
      {
        subject: 'rika',
        timeLimitMinutes: 30,
        pageCount: 7,
        questionCount: 22,
      },
    ],
    files: filesManifest,
    needsReviewCount: 0,
  };

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
  zip.file('manifest.json', manifestBuffer);

  const packFileName = `master100-pack-${examId}-${contentVersion}.zip`;
  const packFilePath = path.join(distPackDir, packFileName);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(packFilePath, zipBuffer);

  console.log(`Successfully generated content pack: ${packFilePath} (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
}

buildPack().catch(err => {
  console.error(err);
  process.exit(1);
});

