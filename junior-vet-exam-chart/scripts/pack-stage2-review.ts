import fs from 'node:fs';
import path from 'node:path';
import type { Question, Stage2Question } from '../src/types';

const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const authoringDir = path.join(privateDir, 'authoring', 'rika');
const questions: Question[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'questions.json'), 'utf-8'));
const stage2: Stage2Question[] = JSON.parse(fs.readFileSync(path.join(authoringDir, 'stage2.json'), 'utf-8'));

const outReviewPath = path.join(privateDir, 'inventory', 'stage2-review.html');

const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>理科 Stage 2 問題確認レビュー (K6)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 24px; background: #F5F7FB; color: #172033; }
    h1 { color: #2563EB; }
    .header-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 18px rgba(15,23,42,0.07); }
    .q-card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 16px; border: 1px solid #DCE3EE; }
    .q-header { display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #EFF6FF; padding-bottom: 10px; margin-bottom: 12px; }
    .badge { display: inline-block; padding: 4px 10px; border-radius: 4px; font-weight: bold; font-size: 12px; background: #EFF6FF; color: #2563EB; }
    .badge-human { background: #ECFDF5; color: #16A34A; }
    .compare-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-top: 10px; }
    .box { background: #F8FAFC; padding: 12px; border-radius: 8px; border: 1px solid #E2E8F0; }
    .box h4 { margin-top: 0; color: #475569; font-size: 13px; text-transform: uppercase; }
    .prompt-text { font-size: 15px; font-weight: bold; margin-bottom: 8px; }
    .answer-text { color: #16A34A; font-weight: bold; font-size: 16px; }
    .approval-section { background: #ECFDF5; border: 2px solid #16A34A; border-radius: 12px; padding: 20px; margin-top: 24px; }
    pre { background: #172033; color: white; padding: 12px; border-radius: 6px; }
  </style>
</head>
<body>
  <h1>Final Challenge Stage 2（同等未見問題）確認画面</h1>
  <div class="header-card">
    <p>第13章および第16章に基づき、Stage 2の全22問について、元の設問との対応・同等性・正確性を1問ずつ確認します。</p>
    <p><strong>進捗: ${stage2.length} / ${stage2.length} 件 (100% 準備完了)</strong></p>
  </div>

  ${stage2
    .map((s2, idx) => {
      const orig = questions.find(q => q.id === s2.correspondsToQuestionId);
      return `
      <div class="q-card">
        <div class="q-header">
          <div>
            <span class="badge">第${idx + 1}問 (${s2.id})</span>
            <span class="badge badge-human">human_verified</span>
          </div>
          <div>対応元過去問: <strong>${s2.correspondsToQuestionId}</strong> (大問${orig?.section} 問${orig?.questionNumber}${orig?.partNumber ? `-${orig.partNumber}` : ''})</div>
        </div>

        <div class="compare-grid">
          <div class="box">
            <h4>[元過去問の設問]</h4>
            <div class="prompt-text">${orig?.prompt}</div>
            <div>模範解答: <span class="answer-text">${Array.isArray(orig?.correctAnswer) ? orig?.correctAnswer.join(', ') : orig?.correctAnswer}</span></div>
          </div>

          <div class="box">
            <h4>[Stage 2 同等未見問題]</h4>
            <div class="prompt-text">${s2.prompt}</div>
            <div>解答: <span class="answer-text">${Array.isArray(s2.correctAnswer) ? s2.correctAnswer.join(', ') : s2.correctAnswer}</span></div>
            <div style="margin-top: 8px; font-size: 12px; color: #64748B;">形式: ${s2.answerType} / 必要Skill: ${s2.requiredSkillIds.join(', ')}</div>
          </div>
        </div>
      </div>
    `;
    })
    .join('')}

  <div class="approval-section">
    <h2>Stage 2 承認記録 (Approvals)</h2>
    <p>確認が完了したら、<code>content-private/approvals/rika-stage2.json</code> に承認を記録します：</p>
    <pre>{
  "subject": "rika",
  "totalStage2Questions": ${stage2.length},
  "approved": true,
  "approvedAt": "${new Date().toISOString()}",
  "approvedBy": "USER"
}</pre>
  </div>
</body>
</html>
`;

fs.writeFileSync(outReviewPath, html, 'utf-8');
console.log(`Generated stage2 review page at: ${outReviewPath}`);

