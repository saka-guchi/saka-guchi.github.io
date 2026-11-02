import { chromium } from '@playwright/test';
import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

async function main() {
  const server = spawn('npx', ['vite', 'preview', '--port', '4173'], {
    cwd: projectRoot,
    shell: true,
  });
  await new Promise(r => setTimeout(r, 2500));
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const page = await browser.newPage();

  await page.goto('http://localhost:4173/#/');
  await page.waitForLoadState('networkidle');

  const computed = await page.evaluate(() => {
    const getStyle = sel => {
      const el = document.querySelector(sel);
      if (!el) return null;
      const s = window.getComputedStyle(el);
      return {
        selector: sel,
        tagName: el.tagName,
        text: el.innerText.trim(),
        fontFamily: s.fontFamily,
        fontSize: s.fontSize,
        fontWeight: s.fontWeight,
        fontVariantNumeric: s.fontVariantNumeric,
        fontFeatureSettings: s.fontFeatureSettings,
        letterSpacing: s.letterSpacing,
        lineHeight: s.lineHeight,
      };
    };

    return {
      countdownBadge: getStyle('[data-testid="exam-countdown-badge"]'),
      countdownNumber: getStyle('[data-testid="exam-countdown-badge"] strong'),
      completionPercent: getStyle('[data-testid="completion-percent"]'),
      streakBadge: getStyle('[data-testid="streak-badge"]'),
      body: getStyle('body'),
    };
  });

  console.log('=== Computed Style Measurement for Numeric Elements ===');
  console.log(JSON.stringify(computed, null, 2));

  await browser.close();
  server.kill();
}

main().catch(console.error);

