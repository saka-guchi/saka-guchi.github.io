import { chromium } from '@playwright/test';
import { mkdirSync } from 'fs';
import { resolve } from 'path';

async function main() {
  const outDir = resolve(process.cwd(), 'docs/p3-screenshots');
  mkdirSync(outDir, { recursive: true });

  const browser = await chromium.launch({ headless: true, channel: 'chrome' });

  // 1. PC幅 (1280x800)
  const pcContext = await browser.newContext({
    viewport: { width: 1280, height: 800 },
    deviceScaleFactor: 2,
  });
  const pcPage = await pcContext.newPage();
  await pcPage.goto('http://localhost:3000/#/mental-care', { waitUntil: 'networkidle' });
  // 「やくそくを確認したよ」モーダルを閉じる
  const promiseBtn = pcPage.locator('button:has-text("やくそくを確認したよ")');
  if (await promiseBtn.isVisible()) {
    await promiseBtn.click();
  }
  await pcPage.waitForTimeout(500);
  await pcPage.screenshot({ path: resolve(outDir, 'mental-care-pc-1280.png'), fullPage: true });

  // 2. スマホ幅 (375x812 iPhone)
  const mobileContext = await browser.newContext({
    viewport: { width: 375, height: 812 },
    deviceScaleFactor: 2,
  });
  const mobilePage = await mobileContext.newPage();
  await mobilePage.goto('http://localhost:3000/#/mental-care', { waitUntil: 'networkidle' });
  const mobPromiseBtn = mobilePage.locator('button:has-text("やくそくを確認したよ")');
  if (await mobPromiseBtn.isVisible()) {
    await mobPromiseBtn.click();
  }
  await mobilePage.waitForTimeout(500);
  await mobilePage.screenshot({ path: resolve(outDir, 'mental-care-mobile-375.png'), fullPage: true });

  // タブ切り替えのスクリーンショット（お守り図鑑）
  const copingTab = mobilePage.locator('[data-testid="tab-coping"]');
  if (await copingTab.isVisible()) {
    await copingTab.click();
    await mobilePage.waitForTimeout(300);
    await mobilePage.screenshot({ path: resolve(outDir, 'mental-care-mobile-coping-375.png'), fullPage: true });
  }

  await browser.close();
  console.log('Screenshots saved to docs/p3-screenshots/');
}

main().catch(console.error);
