import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.resolve(projectRoot, 'docs', 'step1a');
const compareDir = path.resolve(projectRoot, 'docs', 'step1a_comparison');

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });
if (!fs.existsSync(compareDir)) fs.mkdirSync(compareDir, { recursive: true });

async function main() {
  console.log('Starting Vite preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: projectRoot,
    shell: true,
  });

  await new Promise(r => setTimeout(r, 3000));
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const themes = ['default', 'sakura', 'mint', 'lavender', 'night'];
  const viewports = [
    { name: 'pc', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  try {
    // 1. Capture step1a screenshots for all themes and viewports
    for (const vp of viewports) {
      for (const theme of themes) {
        console.log(`Capturing step1a for ${vp.name} - ${theme}...`);
        const context = await browser.newContext({
          viewport: { width: vp.width, height: vp.height },
          deviceScaleFactor: 1,
        });
        const page = await context.newPage();

        const setTheme = async () => {
          await page.evaluate(t => {
            if (t === 'default') {
              document.documentElement.removeAttribute('data-theme');
            } else {
              document.documentElement.setAttribute('data-theme', t);
            }
          }, theme);
          await page.waitForTimeout(100);
        };

        // Home
        await page.goto('http://localhost:4173/#/');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_home.png`) });

        // Study
        try {
          const startBtn = page.locator('[data-testid="start-study-btn"]');
          if (await startBtn.isVisible()) {
            await startBtn.click();
            await page.waitForTimeout(500);
            await setTheme();
            await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_study.png`) });
          }
        } catch (e) {}

        // Settings
        await page.goto('http://localhost:4173/#/settings');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_settings.png`) });

        await context.close();
      }
    }

    // 2. Comparison between 14px and 16px body font size on mobile (375px)
    console.log('Capturing 14px vs 16px body font comparisons...');
    const contextComp = await browser.newContext({
      viewport: { width: 375, height: 812 },
      deviceScaleFactor: 1,
    });
    const pageComp = await contextComp.newPage();

    // 14px Home
    await pageComp.goto('http://localhost:4173/#/');
    await pageComp.waitForLoadState('networkidle');
    await pageComp.evaluate(() => {
      document.documentElement.style.setProperty('--font-size-body', '14px');
    });
    await pageComp.waitForTimeout(200);
    await pageComp.screenshot({ path: path.join(compareDir, 'mobile_body_14px_home.png') });

    // 16px Home
    await pageComp.evaluate(() => {
      document.documentElement.style.setProperty('--font-size-body', '16px');
    });
    await pageComp.waitForTimeout(200);
    await pageComp.screenshot({ path: path.join(compareDir, 'mobile_body_16px_home.png') });

    // 14px Settings
    await pageComp.goto('http://localhost:4173/#/settings');
    await pageComp.waitForLoadState('networkidle');
    await pageComp.evaluate(() => {
      document.documentElement.style.setProperty('--font-size-body', '14px');
    });
    await pageComp.waitForTimeout(200);
    await pageComp.screenshot({ path: path.join(compareDir, 'mobile_body_14px_settings.png') });

    // 16px Settings
    await pageComp.evaluate(() => {
      document.documentElement.style.setProperty('--font-size-body', '16px');
    });
    await pageComp.waitForTimeout(200);
    await pageComp.screenshot({ path: path.join(compareDir, 'mobile_body_16px_settings.png') });

    await contextComp.close();
    console.log('Step 1-A screenshots and comparisons captured successfully!');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});

