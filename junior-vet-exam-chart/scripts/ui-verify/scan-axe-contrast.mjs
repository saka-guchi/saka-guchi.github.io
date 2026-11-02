import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const THEMES = ['default', 'night', 'sakura', 'mint', 'lavender'];

async function scanPageExact(page, theme, state) {
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();

  const parseNode = (n) => {
    const cc = n.any.find(a => a.id === 'color-contrast')?.data || {};
    return {
      theme,
      state,
      target: n.target.join(' > '),
      html: n.html.replace(/\s+/g, ' ').slice(0, 80),
      contrastRatio: cc.contrastRatio ? `${cc.contrastRatio}:1` : '判定不能',
      fgColor: cc.fgColor || '不明',
      bgColor: cc.bgColor || 'グラデーション等で特定不能',
      expected: '4.5:1'
    };
  };

  const violations = results.violations.flatMap(v => v.nodes.map(parseNode));
  const incomplete = results.incomplete.flatMap(v => v.nodes.map(parseNode));

  return { violations, incomplete };
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const allViolations = [];
  const allIncomplete = [];

  for (const theme of THEMES) {
    await page.goto('http://localhost:3000/#/');
    await page.evaluate((t) => {
      localStorage.setItem('junior_vet_theme', t);
      document.documentElement.setAttribute('data-theme', t);
    }, theme);
    await page.reload();
    await page.waitForTimeout(500);

    const normal = await scanPageExact(page, theme, '通常');
    allViolations.push(...normal.violations);
    allIncomplete.push(...normal.incomplete);
  }

  await browser.close();

  console.log('\n=== axe-core コントラストスキャン結果 ===');
  console.log(`違反件数: ${allViolations.length}件, 判定不能: ${allIncomplete.length}件`);
}

main().catch(console.error);
