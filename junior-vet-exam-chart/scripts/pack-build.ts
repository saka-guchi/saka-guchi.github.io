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
  console.log('=== Building Full Content Pack (master100-pack-yasuda-2024-1.0.0.zip) ===');
  const zip = new JSZip();

  const examId = 'yasuda-2024';
  const packId = `pack-${examId}-1.0.0`;
  const schemaVersion = '1.0.0';
  const contentVersion = '1.0.0';

  const authoringBaseDir = path.join(privateDir, 'authoring');
  const pagesBaseDir = path.join(privateDir, 'pages');
  const figuresDir = path.join(privateDir, 'build', 'figures');

  const subjects = ['rika', 'sansu', 'shakai'] as const;

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

  // 各教科のデータを zip の data/<subject>/ に格納し、ルート data/ にも統合して格納
  const mergedData: Record<string, any[]> = {};
  for (const df of dataFiles) {
    mergedData[df] = [];
  }

  const subjectStats: { subject: string; questionCount: number; pageCount: number; timeLimitMinutes: number }[] = [];

  for (const sub of subjects) {
    const subAuthoringDir = path.join(authoringBaseDir, sub);
    const subPagesDir = path.join(pagesBaseDir, sub);

    let qCount = 0;
    for (const fileName of dataFiles) {
      const filePath = path.join(subAuthoringDir, fileName);
      if (fs.existsSync(filePath)) {
        const content = fs.readFileSync(filePath);
        const parsed = JSON.parse(content.toString('utf-8'));
        if (fileName === 'questions.json') {
          qCount = parsed.length;
        }
        if (Array.isArray(parsed)) {
          mergedData[fileName].push(...parsed);
        }
        const zipPath = `data/${sub}/${fileName}`;
        zip.file(zipPath, content);
        filesManifest.push({ path: zipPath, sha256: sha256Buffer(content) });
      }
    }

    // ページ画像 WebP
    let pageCount = 0;
    if (fs.existsSync(subPagesDir)) {
      const pageFiles = fs.readdirSync(subPagesDir).filter(f => f.endsWith('.png'));
      pageCount = pageFiles.filter(f => f.startsWith('mondai_')).length;
      for (const pf of pageFiles) {
        const srcPng = path.join(subPagesDir, pf);
        const webpName = pf.replace('.png', '.webp');
        const webpBuffer = await sharp(srcPng)
          .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
          .webp({ quality: 85 })
          .toBuffer();

        const zipPath = `images/pages/${sub}/${webpName}`;
        zip.file(zipPath, webpBuffer);
        filesManifest.push({ path: zipPath, sha256: sha256Buffer(webpBuffer) });
      }
    }

    subjectStats.push({
      subject: sub,
      questionCount: qCount,
      pageCount,
      timeLimitMinutes: sub === 'sansu' ? 50 : sub === 'rika' ? 30 : 30,
    });
  }

  // ルート data/ に統合JSONを格納
  for (const fileName of dataFiles) {
    const buf = Buffer.from(JSON.stringify(mergedData[fileName], null, 2), 'utf-8');
    const zipPath = `data/${fileName}`;
    zip.file(zipPath, buf);
    filesManifest.push({ path: zipPath, sha256: sha256Buffer(buf) });
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
    title: '2024年度 安田学園中学校 入学試験【理科・算数・社会】',
    schemaVersion,
    contentVersion,
    createdAt: new Date().toISOString(),
    subjects: subjectStats,
    files: filesManifest,
    needsReviewCount: 0,
  };

  const manifestBuffer = Buffer.from(JSON.stringify(manifest, null, 2), 'utf-8');
  zip.file('manifest.json', manifestBuffer);

  const packFileName = `master100-pack-${examId}-${contentVersion}.zip`;
  const packFilePath = path.join(distPackDir, packFileName);

  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE', compressionOptions: { level: 9 } });
  fs.writeFileSync(packFilePath, zipBuffer);

  console.log(`Successfully generated full content pack: ${packFilePath} (${(zipBuffer.length / 1024 / 1024).toFixed(2)} MB)`);
  console.log(`Subjects summary:`, subjectStats);
}

buildPack().catch(err => {
  console.error(err);
  process.exit(1);
});
