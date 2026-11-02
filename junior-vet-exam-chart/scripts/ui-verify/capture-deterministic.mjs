import { chromium } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const targetFolder = process.argv[2] || 'docs/step_current';
const outDir = path.resolve(projectRoot, targetFolder);

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const themes = ['default', 'sakura', 'mint', 'lavender', 'night'];
  const viewports = [
    { name: 'pc', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  try {
    for (const vp of viewports) {
      for (const theme of themes) {
        console.log(`Capturing deterministic for ${vp.name} - ${theme}...`);
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
          reducedMotion: 'reduce',
        });

        const page = await context.newPage();

        // 1. 固定時計 (Playwright clock API)
        await page.clock.setFixedTime(new Date('2026-11-02T12:00:00+09:00'));

        // 2. 乱数・アニメーション固定
        await page.addInitScript(() => {
          let seed = 12345;
          Math.random = () => {
            const x = Math.sin(seed++) * 10000;
            return x - Math.floor(x);
          };

          const style = document.createElement('style');
          style.innerHTML = `
            *, *::before, *::after {
              animation: none !important;
              transition: none !important;
              caret-color: transparent !important;
            }
          `;
          document.head.appendChild(style);
        });

        await page.goto('http://localhost:3000/#/');
        await page.evaluate((t) => {
          localStorage.setItem('junior_vet_theme', t);
          document.documentElement.setAttribute('data-theme', t);
        }, theme);
        await page.reload();
        await page.waitForTimeout(600);

        // ホーム画面キャプチャ
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_home.png`), fullPage: false });

        await context.close();
      }
    }
    console.log(`Saved screenshots to ${outDir}`);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
