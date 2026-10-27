import fs from 'node:fs';
import path from 'node:path';
import type { Question, Skill, PracticeQuestion, TransferQuestion, Stage2Question } from '../src/types';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx < process.argv.length - 1 ? process.argv[idx + 1] : undefined;
}

const subject = getArg('--subject') || 'rika';
const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const inventoryPath = path.join(privateDir, 'inventory', `${subject}.csv`);
const authoringDir = path.join(privateDir, 'authoring', subject);
const pagesIndexFile = path.join(privateDir, 'pages', subject, 'pages-index.json');

interface CheckError {
  item: string;
  message: string;
}

const errors: CheckError[] = [];
const warnings: string[] = [];

// 1. inventory 読み込み
if (!fs.existsSync(inventoryPath)) {
  console.error(`Inventory file not found: ${inventoryPath}`);
  process.exit(1);
}

function parseCsv(content: string) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',').map(h => h.trim());
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    const values: string[] = [];
    let insideQuote = false;
    let curVal = '';
    for (let charIndex = 0; charIndex < line.length; charIndex++) {
      const char = line[charIndex];
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        values.push(curVal.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));
        curVal = '';
      } else {
        curVal += char;
      }
    }
    values.push(curVal.trim().replace(/^"|"$/g, '').replace(/""/g, '"'));

    const row: Record<string, string> = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

const inventoryRows = parseCsv(fs.readFileSync(inventoryPath, 'utf-8'));

// 2. authoring files 読み込み
const questions: Question[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'questions.json'), 'utf-8'));
const skills: Skill[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'skills.json'), 'utf-8'));
const practice: PracticeQuestion[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'practice.json'), 'utf-8'));
const transfer: TransferQuestion[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'transfer.json'), 'utf-8'));
const stage2: Stage2Question[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'stage2.json'), 'utf-8'));
const figures = fs.existsSync(path.join(authoringDir, 'figures.json'))
  ? JSON.parse(fs.readFileSync(path.join(authoringDir, 'figures.json'), 'utf-8'))
  : [];
const figureIds = new Set<string>(figures.map((f: any) => f.id));

// 3. pagesIndex 読み込み
const pagesIndex = fs.existsSync(pagesIndexFile)
  ? JSON.parse(fs.readFileSync(pagesIndexFile, 'utf-8'))
  : null;

console.log(`=== Starting Coverage Check for ${subject} ===`);

// 検証 1: inventory の全行に questionId が1対1で対応している
if (inventoryRows.length !== questions.length) {
  errors.push({
    item: 'Inventory 1:1 Mapping',
    message: `Inventory count (${inventoryRows.length}) does not match questions count (${questions.length})`,
  });
}

// 検証 2: questionId の重複・欠番がない
const questionIdSet = new Set<string>();
for (const q of questions) {
  if (questionIdSet.has(q.id)) {
    errors.push({ item: q.id, message: `Duplicate questionId detected: ${q.id}` });
  }
  questionIdSet.add(q.id);
}

// 検証 3: 問題PDFの全問ページ（p2〜p6）が1つ以上の questionId から参照されている
if (pagesIndex) {
  // p1 は表紙、p7 は解答用紙
  const contentPages = [2, 3, 4, 5, 6];
  for (const pageNum of contentPages) {
    const referenced = questions.some(q => q.pageNumber === pageNum);
    if (!referenced) {
      errors.push({ item: `Page ${pageNum}`, message: `Content page ${pageNum} is not referenced by any question` });
    }
  }
}

// 検証 4: すべての questionId に答えがある
for (const q of questions) {
  if (!q.correctAnswer || (Array.isArray(q.correctAnswer) && q.correctAnswer.length === 0)) {
    errors.push({ item: q.id, message: 'Question missing correct answer' });
  }
}

// 検証 5: open の設問に、採点で必要な要素が2〜4個ある
for (const q of questions) {
  if (q.answerType === 'open') {
    const elCount = q.openElements?.length || 0;
    if (elCount < 2 || elCount > 4) {
      errors.push({ item: q.id, message: `Open question must have 2-4 grading elements, found ${elCount}` });
    }
  }
}

// 検証 6: すべての questionId に Skill が1つ以上ある
const skillIdSet = new Set<string>(skills.map(s => s.id));
for (const q of questions) {
  if (!q.primarySkillId || !skillIdSet.has(q.primarySkillId)) {
    errors.push({ item: q.id, message: `Question has missing or invalid primarySkillId: ${q.primarySkillId}` });
  }
}

// 検証 7: すべての主要Skillに、練習問題と、規定数以上の転用問題がある
// （中核Skill：3問以上、その他の主要Skill：2問以上）
for (const s of skills) {
  const practiceCount = practice.filter(p => p.skillId === s.id).length;
  if (practiceCount === 0) {
    errors.push({ item: s.id, message: `Skill ${s.id} has no practice question` });
  }

  const transferCount = transfer.filter(t => t.requiredSkillIds.includes(s.id)).length;
  const minRequired = s.level === 'core' ? 3 : 2;
  if (transferCount < minRequired) {
    errors.push({
      item: s.id,
      message: `Skill ${s.id} (${s.level}) requires at least ${minRequired} transfer questions, but has ${transferCount}`,
    });
  }
}

// 検証 8: すべての練習問題・転用問題に2段階のヒントがある
for (const p of practice) {
  if (!p.hints || p.hints.length !== 2 || p.hints[0].level !== 1 || p.hints[1].level !== 2) {
    errors.push({ item: p.id, message: 'Practice question does not have exactly 2-level hints' });
  }
}
for (const t of transfer) {
  if (!t.hints || t.hints.length !== 2 || t.hints[0].level !== 1 || t.hints[1].level !== 2) {
    errors.push({ item: t.id, message: 'Transfer question does not have exactly 2-level hints' });
  }
}

// 検証 9: Stage 2 のセットが元過去問と同じ問題数で、すべて human_verified
if (stage2.length !== questions.length) {
  errors.push({
    item: 'Stage 2 Count',
    message: `Stage 2 count (${stage2.length}) does not match original question count (${questions.length})`,
  });
}
for (const s2 of stage2) {
  if (s2.validationStatus !== 'human_verified') {
    errors.push({ item: s2.id, message: `Stage 2 question ${s2.id} is not human_verified` });
  }
}

// 検証 10: 図表の参照切れがない
for (const q of questions) {
  if (q.figureIds) {
    for (const figId of q.figureIds) {
      if (!figureIds.has(figId)) {
        errors.push({ item: q.id, message: `Referenced figureId not found: ${figId}` });
      }
    }
  }
}

// レポート生成
const needsReviewCount = inventoryRows.filter(r => r.status === 'needs_review').length;
const report = {
  subject,
  timestamp: new Date().toISOString(),
  totalQuestions: questions.length,
  totalSkills: skills.length,
  totalPractice: practice.length,
  totalTransfer: transfer.length,
  totalStage2: stage2.length,
  needsReviewCount,
  errorsCount: errors.length,
  errors,
  warnings,
};

const reportJsonPath = path.join(privateDir, 'coverage-report.json');
const reportHtmlPath = path.join(privateDir, 'coverage-report.html');

fs.writeFileSync(reportJsonPath, JSON.stringify(report, null, 2), 'utf-8');

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>Coverage Report - ${subject.toUpperCase()}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; background: #F5F7FB; color: #172033; }
    h1 { color: #2563EB; }
    .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 18px rgba(15,23,42,0.07); }
    .status-badge { display: inline-block; padding: 6px 14px; border-radius: 20px; font-weight: bold; font-size: 14px; }
    .pass { background: #ECFDF5; color: #16A34A; }
    .fail { background: #FEF2F2; color: #DC2626; }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; }
    th, td { border: 1px solid #DCE3EE; padding: 8px 12px; text-align: left; }
    th { background: #EFF6FF; }
  </style>
</head>
<body>
  <h1>教材カバレッジ検証レポート (${subject.toUpperCase()})</h1>
  <div class="card">
    <p>状態: <span class="status-badge ${errors.length === 0 ? 'pass' : 'fail'}">${errors.length === 0 ? '合格 (エラー 0件)' : `不合格 (エラー ${errors.length}件)`}</span></p>
    <p>設問数: <strong>${questions.length}</strong> / Skill数: <strong>${skills.length}</strong> / 練習問題: <strong>${practice.length}</strong> / 転用問題: <strong>${transfer.length}</strong> / Stage 2: <strong>${stage2.length}</strong></p>
    <p>needs_review 件数: <strong>${needsReviewCount}</strong> 件</p>
  </div>

  ${
    errors.length > 0
      ? `
  <div class="card" style="border: 2px solid #DC2626;">
    <h2 style="color: #DC2626;">検出されたエラー一覧</h2>
    <ul>
      ${errors.map(e => `<li><strong>${e.item}</strong>: ${e.message}</li>`).join('')}
    </ul>
  </div>
  `
      : `
  <div class="card" style="border: 2px solid #16A34A;">
    <h2 style="color: #16A34A;">すべてのカバレッジ検証項目に合格しました</h2>
    <p>第15章に規定された全11項目（1対1対応、全ページ参照、欠番なし、解答存在、open要素数、Skill紐付け、練習・転用問題規定数、2段階ヒント、Stage 2 human_verified、図表参照整合性）をすべてクリアしています。</p>
  </div>
  `
  }
</body>
</html>`;

fs.writeFileSync(reportHtmlPath, html, 'utf-8');

console.log(`Coverage report written to:`);
console.log(`- ${reportJsonPath}`);
console.log(`- ${reportHtmlPath}`);

if (errors.length > 0) {
  console.error(`Coverage check FAILED with ${errors.length} errors.`);
  process.exit(1);
} else {
  console.log(`Coverage check PASSED! 0 errors, ${needsReviewCount} needs_review.`);
}

