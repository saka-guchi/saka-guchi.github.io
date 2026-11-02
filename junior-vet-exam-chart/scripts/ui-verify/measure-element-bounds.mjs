import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..', '..');

const outputFile = process.argv[2] || 'docs/element_bounds_current.json';

// 35 key element selectors on HomePage
const SELECTORS = [
  { id: 'header', name: 'ヘッダー全体', selector: 'header' },
  { id: 'header_title', name: 'タイトル（みならい獣医さん）', selector: 'header h1, header [class*="title"]' },
  { id: 'badge_countdown', name: '試験カウントダウンバッジ', selector: '[data-testid="exam-countdown-badge"], header [class*="badge"]:has-text("日")' },
  { id: 'badge_streak', name: '連続学習日数バッジ', selector: '[data-testid="streak-badge"], header [class*="badge"]:has-text("日連続")' },
  { id: 'btn_mental', name: 'こころ相談室ボタン', selector: 'button:has-text("こころの相談室"), a:has-text("こころの相談室")' },
  { id: 'btn_parent', name: '指導医ログボタン', selector: 'button:has-text("保護者・指導医"), button:has-text("指導医ログ")' },
  { id: 'card_chart_progress', name: 'カルテ進度ボックス', selector: '[data-testid="chart-progress-card"], section:has-text("カルテ進度"), div:has-text("カルテ進度")' },
  { id: 'pill_mastered', name: 'マスター数ピル', selector: '[data-testid="mastered-count"], div:has-text("マスター達成")' },
  { id: 'pill_retention', name: '記憶キープ率ピル', selector: '[data-testid="retention-rate"], div:has-text("記憶キープ")' },
  { id: 'card_today_study', name: 'メイン診察カード（本日の診察）', selector: '[data-testid="today-study-card"], section:has-text("本日の診察"), div:has-text("本日の診察")' },
  { id: 'btn_start_study', name: '診察開始メインCTA', selector: 'button:has-text("本日の診察を開始"), button:has-text("今日のカルテ学習を開始")' },
  { id: 'btn_flashcard', name: 'サクッと暗記カードボタン', selector: 'button:has-text("暗記カード")' },
  { id: 'btn_stamps', name: '動物シール帳ボタン', selector: 'button:has-text("動物シール帳")' },
  { id: 'card_exam', name: '合格ドクター認定試験カード', selector: 'section:has-text("認定試験"), div:has-text("認定試験")' },
  { id: 'btn_start_exam', name: '認定試験開始ボタン', selector: 'button:has-text("認定試験に挑戦"), button:has-text("試験を開始")' },
  { id: 'tray_tabs', name: '科目切替トレイ', selector: '[role="tablist"], div:has(> button:has-text("理科"))' },
  { id: 'tab_science', name: '理科タブ', selector: 'button:has-text("理科")' },
  { id: 'tab_math', name: '算数タブ', selector: 'button:has-text("算数")' },
  { id: 'tab_social', name: '社会タブ', selector: 'button:has-text("社会")' },
  { id: 'sec_extra', name: '追加学習セクション', selector: 'section:has-text("弱点"), div:has-text("もっと診察する")' },
  { id: 'btn_mistake_retry', name: 'まちがえた問題復習ボタン', selector: 'button:has-text("まちがえた問題")' },
  { id: 'btn_weak_skill', name: '弱点特訓ボタン', selector: 'button:has-text("弱点"), button:has-text("特訓")' },
  { id: 'btn_print', name: 'A4シート印刷ボタン', selector: 'button:has-text("印刷")' },
  { id: 'acc_cases', name: '症例カルテアコーディオン', selector: 'details, section:has-text("症例一覧"), div:has-text("症例一覧")' },
  { id: 'footer', name: 'フッター領域', selector: 'footer' }
];

async function measurePage(page, theme, viewport) {
  await page.setViewportSize(viewport);
  await page.goto('http://localhost:3000/#/');

  await page.evaluate((t) => {
    localStorage.setItem('junior_vet_theme', t);
    document.documentElement.setAttribute('data-theme', t);
  }, theme);
  await page.reload();
  await page.waitForTimeout(600);

  const results = {};
  for (const item of SELECTORS) {
    try {
      const el = await page.$(item.selector);
      if (el) {
        const box = await el.boundingBox();
        if (box) {
          results[item.id] = {
            name: item.name,
            top: Math.round(box.y),
            left: Math.round(box.x),
            width: Math.round(box.width),
            height: Math.round(box.height)
          };
        }
      }
    } catch (e) {}
  }
  return results;
}

async function main() {
  const browser = await chromium.launch({ headless: true, channel: 'chrome' });
  const context = await browser.newContext({ reducedMotion: 'reduce' });
  const page = await context.newPage();

  const configs = [
    { name: 'default_1280', theme: 'default', viewport: { width: 1280, height: 800 } },
    { name: 'default_375', theme: 'default', viewport: { width: 375, height: 667 } },
    { name: 'night_1280', theme: 'night', viewport: { width: 1280, height: 800 } },
    { name: 'night_375', theme: 'night', viewport: { width: 375, height: 667 } }
  ];

  const currentData = {};
  for (const c of configs) {
    currentData[c.name] = await measurePage(page, c.theme, c.viewport);
  }

  await browser.close();

  const out = path.resolve(projectRoot, outputFile);
  fs.writeFileSync(out, JSON.stringify(currentData, null, 2), 'utf-8');
  console.log(`Measured bounds saved to ${out}`);
}

main().catch(console.error);
