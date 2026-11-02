import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

function luminance(r, g, b) {
  const a = [r, g, b].map(v => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  });
  return a[0] * 0.2126 + a[1] * 0.7152 + a[2] * 0.0722;
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16),
      parseInt(clean[1] + clean[1], 16),
      parseInt(clean[2] + clean[2], 16)
    ];
  }
  const num = parseInt(clean, 16);
  return [(num >> 16) & 255, (num >> 8) & 255, num & 255];
}

function calcContrast(hex1, hex2) {
  const lum1 = luminance(...hexToRgb(hex1));
  const lum2 = luminance(...hexToRgb(hex2));
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  return (brightest + 0.05) / (darkest + 0.05);
}

const THEMES = [
  { id: 'skyblue', label: '青空 (skyblue)' },
  { id: 'sakura', label: 'サクラ (sakura)' },
  { id: 'mint', label: 'ミント (mint)' },
  { id: 'lavender', label: '夜明け (lavender)' },
  { id: 'night', label: '夜空 (night)' },
];

async function scanState(page, theme, stateName) {
  const results = await new AxeBuilder({ page })
    .withRules(['color-contrast'])
    .analyze();

  const parseNode = (n) => {
    const cc = n.any.find(a => a.id === 'color-contrast')?.data || {};
    return {
      theme: theme.label,
      state: stateName,
      target: n.target.join(' > '),
      html: n.html.replace(/\s+/g, ' ').slice(0, 90),
      contrastRatio: cc.contrastRatio ? `${Number(cc.contrastRatio).toFixed(2)}:1` : '判定不能',
      fgColor: cc.fgColor || '不明',
      bgColor: cc.bgColor || 'グラデーション等で特定不能',
    };
  };

  return {
    violations: results.violations.flatMap(v => v.nodes.map(parseNode)),
    incomplete: results.incomplete.flatMap(v => v.nodes.map(parseNode)),
  };
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await context.newPage();

  const summaryTable = [];
  const detailedViolations = [];
  const detailedIncomplete = [];

  for (const theme of THEMES) {
    const themeRow = {
      theme: theme.label,
      normalViolations: 0,
      normalIncomplete: 0,
      accordionViolations: 0,
      accordionIncomplete: 0,
      modalViolations: 0,
      modalIncomplete: 0,
    };

    // 1. 通常状態
    await page.goto('http://localhost:3000/#/');
    await page.evaluate((t) => {
      localStorage.setItem('junior_vet_theme', t);
      document.documentElement.setAttribute('data-theme', t);
    }, theme.id);
    await page.reload();
    await page.waitForTimeout(600);

    const normal = await scanState(page, theme, '通常');
    themeRow.normalViolations = normal.violations.length;
    themeRow.normalIncomplete = normal.incomplete.length;
    detailedViolations.push(...normal.violations);
    detailedIncomplete.push(...normal.incomplete);

    // 2. アコーディオン開状態
    try {
      const accordionBtns = await page.$$('button[aria-expanded="false"]');
      for (const btn of accordionBtns) {
        await btn.click();
      }
      await page.waitForTimeout(400);
      const acc = await scanState(page, theme, 'アコーディオン開');
      themeRow.accordionViolations = acc.violations.length;
      themeRow.accordionIncomplete = acc.incomplete.length;
      detailedViolations.push(...acc.violations);
      detailedIncomplete.push(...acc.incomplete);
    } catch (e) {
      console.warn('Accordion error:', e.message);
    }

    // 3. モーダル開状態
    try {
      await page.reload();
      await page.waitForTimeout(500);
      const cardBtn = await page.$('button[data-testid*="flashcard"], .triageCardBtn, button:has-text("暗記カード"), button:has-text("トリアージ")');
      if (cardBtn) {
        await cardBtn.click();
        await page.waitForTimeout(400);
        const mod = await scanState(page, theme, 'モーダル開');
        themeRow.modalViolations = mod.violations.length;
        themeRow.modalIncomplete = mod.incomplete.length;
        detailedViolations.push(...mod.violations);
        detailedIncomplete.push(...mod.incomplete);
      } else {
        const altBtn = await page.$('button:has-text("カルテ"), button:has-text("指導医")');
        if (altBtn) {
          await altBtn.click();
          await page.waitForTimeout(400);
          const mod = await scanState(page, theme, 'モーダル開');
          themeRow.modalViolations = mod.violations.length;
          themeRow.modalIncomplete = mod.incomplete.length;
          detailedViolations.push(...mod.violations);
          detailedIncomplete.push(...mod.incomplete);
        }
      }
    } catch (e) {
      console.warn('Modal error:', e.message);
    }

    summaryTable.push(themeRow);
  }

  await browser.close();

  console.log('=== AXE_SUMMARY_START ===');
  console.log(JSON.stringify(summaryTable, null, 2));
  console.log('=== AXE_SUMMARY_END ===');

  console.log('=== AXE_VIOLATIONS_START ===');
  console.log(JSON.stringify(detailedViolations, null, 2));
  console.log('=== AXE_VIOLATIONS_END ===');

  console.log('=== AXE_INCOMPLETE_START ===');
  console.log(JSON.stringify(detailedIncomplete, null, 2));
  console.log('=== AXE_INCOMPLETE_END ===');
}

main().catch(console.error);

