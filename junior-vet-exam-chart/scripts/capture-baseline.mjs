import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const outDir = path.resolve(projectRoot, 'docs', 'baseline');

if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

async function main() {
  console.log('Starting Vite preview server...');
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: projectRoot,
    shell: true,
  });

  // Wait for server to start
  await new Promise(r => setTimeout(r, 3000));

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  const themes = ['default', 'sakura', 'mint', 'lavender', 'night'];
  const viewports = [
    { name: 'pc', width: 1280, height: 800 },
    { name: 'mobile', width: 375, height: 812 },
  ];

  try {
    for (const vp of viewports) {
      for (const theme of themes) {
        console.log(`Capturing for ${vp.name} - ${theme}...`);
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
            try {
              localStorage.setItem('junior_vet_theme', t);
            } catch {}
          }, theme);
          await page.waitForTimeout(100);
        };

        // 1. Home
        await page.goto('http://localhost:4173/#/');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_home.png`), fullPage: false });

        // 2. Modal Stamp
        try {
          const stampBtn = page.locator('[data-testid="open-stamp-book-btn"]');
          if (await stampBtn.isVisible()) {
            await stampBtn.click();
            await page.waitForTimeout(300);
            await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_modal_stamp.png`) });
            await page.locator('text=✕').first().click();
            await page.waitForTimeout(200);
          }
        } catch (e) {
          console.warn('Failed modal_stamp:', e.message);
        }

        // 3. Modal History
        try {
          const histBtn = page.locator('[data-testid="open-exam-history-btn"]');
          if (await histBtn.isVisible()) {
            await histBtn.click();
            await page.waitForTimeout(300);
            await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_modal_history.png`) });
            await page.locator('text=✕').first().click();
            await page.waitForTimeout(200);
          }
        } catch (e) {
          console.warn('Failed modal_history:', e.message);
        }

        // 4. Modal Flashcard (Triage Card)
        try {
          const flashBtn = page.locator('[data-testid="launch-triage-card-btn"]');
          if (await flashBtn.isVisible()) {
            await flashBtn.click();
            await page.waitForTimeout(300);
            await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_modal_flashcard.png`) });
            await page.locator('text=✕').first().click();
            await page.waitForTimeout(200);
          }
        } catch (e) {
          console.warn('Failed modal_flashcard:', e.message);
        }

        // 5. Study Page (Start a session from home)
        try {
          const startBtn = page.locator('[data-testid="start-study-btn"]');
          if (await startBtn.isVisible()) {
            await startBtn.click();
            await page.waitForTimeout(500);
            await setTheme();
            await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_study.png`) });
          }
        } catch (e) {
          console.warn('Failed study page:', e.message);
        }

        // 6. Result Page
        await page.goto('http://localhost:4173/#/result');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_result.png`) });

        // 7. Final Challenge Page
        await page.goto('http://localhost:4173/#/final-challenge');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_final_challenge.png`) });

        // 8. Settings Page
        await page.goto('http://localhost:4173/#/settings');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_settings.png`) });

        // 9. Mental Care Page
        await page.goto('http://localhost:4173/#/mental-care');
        await page.waitForLoadState('networkidle');
        await setTheme();
        await page.screenshot({ path: path.join(outDir, `${vp.name}_${theme}_mental_care.png`) });

        await context.close();
      }
    }
    console.log('All baseline screenshots captured successfully!');
  } finally {
    await browser.close();
    server.kill();
  }
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
