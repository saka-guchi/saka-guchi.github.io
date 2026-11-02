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

  const context = await browser.newContext({
    viewport: { width: 375, height: 812 },
  });
  const page = await context.newPage();

  console.log('Checking overflow on 375px mobile viewport...');
  await page.goto('http://localhost:4173/#/');
  await page.waitForLoadState('networkidle');

  const overflows = await page.evaluate(() => {
    const results = [];
    const elements = document.querySelectorAll('*');
    const viewportWidth = window.innerWidth;

    elements.forEach(el => {
      const rect = el.getBoundingClientRect();
      // Check if element extends beyond viewport width
      if (rect.right > viewportWidth + 1) {
        const id = el.getAttribute('data-testid') || el.className || el.tagName;
        results.push({
          type: 'horizontal-viewport-overflow',
          target: id.toString().substring(0, 50),
          rectRight: Math.round(rect.right),
          viewportWidth,
        });
      }
      // Check if text is clipped or wrapping in pills
      if (el.classList && Array.from(el.classList).some(c => c.includes('Badge') || c.includes('Pill') || c.includes('Btn'))) {
        if (el.scrollWidth > el.clientWidth + 1) {
          results.push({
            type: 'pill-text-clipped',
            target: el.className,
            scrollWidth: el.scrollWidth,
            clientWidth: el.clientWidth,
          });
        }
      }
    });

    return results;
  });

  console.log('=== Overflow Check Results ===');
  if (overflows.length === 0) {
    console.log('No horizontal overflow detected on 375px viewport!');
  } else {
    // Unique targets
    const seen = new Set();
    const unique = overflows.filter(o => {
      const k = `${o.type}_${o.target}`;
      if (seen.has(k)) return false;
      seen.add(k);
      return true;
    });
    console.log(`Detected ${unique.length} overflow / clipping items:`);
    unique.forEach(u => console.log(JSON.stringify(u)));
  }

  await browser.close();
  server.kill();
}

main().catch(console.error);
