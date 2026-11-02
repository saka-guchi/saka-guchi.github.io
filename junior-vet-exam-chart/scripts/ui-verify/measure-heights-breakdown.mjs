import { chromium } from 'playwright';

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 375, height: 667 } });
  const page = await context.newPage();

  // 1. ホーム画面 (375px)
  await page.goto('http://localhost:3000/#/');
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1000);

  // セクションごとの高さと位置を取得
  const homeMetrics = await page.evaluate(() => {
    const header = document.querySelector('header');
    const sections = Array.from(document.querySelectorAll('main > *'));
    const footer = document.querySelector('footer');

    return {
      scrollHeight: document.documentElement.scrollHeight,
      header: header ? { height: header.getBoundingClientRect().height, top: header.getBoundingClientRect().top } : null,
      sections: sections.map((s, idx) => ({
        index: idx,
        tag: s.tagName,
        className: s.className,
        testId: s.getAttribute('data-testid') || '',
        height: s.getBoundingClientRect().height,
        top: s.getBoundingClientRect().top,
      })),
      footer: footer ? { height: footer.getBoundingClientRect().height, top: footer.getBoundingClientRect().top } : null,
    };
  });

  // 2. Study 画面 (375px) - データ描画完了待ち
  await page.goto('http://localhost:3000/#/study');
  await page.waitForLoadState('networkidle');
  // 設問または解答エリアの描画待ち
  await page.waitForSelector('main', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const studyScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  // 3. 設定画面 (375px) - データ描画完了待ち
  await page.goto('http://localhost:3000/#/settings');
  await page.waitForLoadState('networkidle');
  await page.waitForSelector('main', { timeout: 5000 }).catch(() => {});
  await page.waitForTimeout(1200);
  const settingsScrollHeight = await page.evaluate(() => document.documentElement.scrollHeight);

  await browser.close();

  console.log('=== HOME_METRICS ===');
  console.log(JSON.stringify(homeMetrics, null, 2));

  console.log('=== STUDY_SCROLL_HEIGHT ===', studyScrollHeight);
  console.log('=== SETTINGS_SCROLL_HEIGHT ===', settingsScrollHeight);
}

main().catch(console.error);

