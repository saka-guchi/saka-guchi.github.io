import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const publicDir = path.join(rootDir, 'public');

const publicFiguresDir = path.join(publicDir, 'figures');
const publicPagesDir = path.join(publicDir, 'pages');

if (!fs.existsSync(publicFiguresDir)) {
  fs.mkdirSync(publicFiguresDir, { recursive: true });
}
if (!fs.existsSync(publicPagesDir)) {
  fs.mkdirSync(publicPagesDir, { recursive: true });
}

async function syncAssets() {
  console.log('=== Syncing Assets to public/ ===');

  // 1. figures
  const buildFiguresDir = path.join(privateDir, 'build', 'figures');
  if (fs.existsSync(buildFiguresDir)) {
    const figFiles = fs.readdirSync(buildFiguresDir).filter(f => f.endsWith('.webp'));
    for (const f of figFiles) {
      fs.copyFileSync(path.join(buildFiguresDir, f), path.join(publicFiguresDir, f));
      console.log(`Copied figure: ${f}`);
    }
  }

  // 2. pages (rika, sansu, shakai)
  const subjects = ['rika', 'sansu', 'shakai'];
  for (const sub of subjects) {
    const srcPagesDir = path.join(privateDir, 'pages', sub);
    const destPagesDir = path.join(publicPagesDir, sub);
    if (!fs.existsSync(destPagesDir)) {
      fs.mkdirSync(destPagesDir, { recursive: true });
    }

    if (fs.existsSync(srcPagesDir)) {
      const pngFiles = fs.readdirSync(srcPagesDir).filter(f => f.endsWith('.png'));
      for (const png of pngFiles) {
        const webpName = png.replace('.png', '.webp');
        const destWebp = path.join(destPagesDir, webpName);
        if (!fs.existsSync(destWebp)) {
          const srcPng = path.join(srcPagesDir, png);
          await sharp(srcPng)
            .resize({ width: 1600, height: 1600, fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(destWebp);
          console.log(`Generated page webp: ${sub}/${webpName}`);
        } else {
          console.log(`Page webp exists: ${sub}/${webpName}`);
        }
      }
    }
  }

  console.log('=== Asset sync complete! ===');
}

syncAssets().catch(err => {
  console.error(err);
  process.exit(1);
});
