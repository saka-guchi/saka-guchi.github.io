import fs from 'node:fs';
import path from 'node:path';

function getArg(flag: string): string | undefined {
  const idx = process.argv.indexOf(flag);
  return idx !== -1 && idx < process.argv.length - 1 ? process.argv[idx + 1] : undefined;
}

const subject = getArg('--subject') || 'rika';
const rootDir = process.cwd();
const privateDir = path.join(rootDir, 'content-private');
const inventoryPath = path.join(privateDir, 'inventory', `${subject}.csv`);
const reviewHtmlPath = path.join(privateDir, 'inventory', `${subject}-review.html`);

if (!fs.existsSync(inventoryPath)) {
  console.error(`Inventory file not found: ${inventoryPath}`);
  process.exit(1);
}

// CSVの簡易パース
function parseCsv(content: string) {
  const lines = content.trim().split('\n');
  const headers = lines[0].split(',');
  const rows: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line) continue;
    // クオート対応の正規表現
    const matches = line.match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
    // 簡易分割（クオート内外考慮）
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
      row[h.trim()] = values[idx] || '';
    });
    rows.push(row);
  }
  return rows;
}

const csvContent = fs.readFileSync(inventoryPath, 'utf-8');
const rows = parseCsv(csvContent);

// HTML生成
const html = `<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <title>${subject.toUpperCase()} - 回答欄一覧 確認レビュー (K1)</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; margin: 20px; background: #F5F7FB; color: #172033; }
    h1 { color: #2563EB; }
    .card { background: white; border-radius: 12px; padding: 20px; margin-bottom: 24px; box-shadow: 0 4px 18px rgba(15,23,42,0.07); }
    table { width: 100%; border-collapse: collapse; margin-top: 12px; font-size: 14px; }
    th, td { border: 1px solid #DCE3EE; padding: 8px 12px; text-align: left; }
    th { background: #EFF6FF; color: #1D4ED8; }
    tr:nth-child(even) { background: #F8FAFC; }
    .badge { display: inline-block; padding: 2px 8px; border-radius: 4px; font-weight: bold; font-size: 12px; }
    .badge-ok { background: #ECFDF5; color: #16A34A; }
    .badge-type { background: #EFF6FF; color: #2563EB; }
    .img-preview { max-width: 100%; height: auto; border: 1px solid #DCE3EE; border-radius: 8px; margin-top: 8px; }
    .approval-box { background: #ECFDF5; border: 2px solid #16A34A; padding: 16px; border-radius: 8px; margin-top: 16px; }
    pre { background: #172033; color: #F8FAFC; padding: 12px; border-radius: 6px; overflow-x: auto; }
  </style>
</head>
<body>
  <h1>${subject === 'rika' ? '理科' : subject} 回答欄一覧（Inventory）確認レビュー</h1>
  <p>本書手順 14.5 ステップ3 に基づき、解答用紙・解答PDFと設問回答欄の対応を確認します。</p>

  <div class="card">
    <h2>1. 収録回答欄一覧（全 ${rows.length} 件）</h2>
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>大問</th>
          <th>小問</th>
          <th>枝問</th>
          <th>回答欄ラベル</th>
          <th>模範解答 (answerText)</th>
          <th>回答形式</th>
          <th>状態</th>
          <th>問題P</th>
          <th>備考</th>
        </tr>
      </thead>
      <tbody>
        ${rows
          .map(
            (r, idx) => `
          <tr>
            <td>${idx + 1}</td>
            <td><strong>[${r.section}]</strong></td>
            <td>問${r.question}</td>
            <td>${r.part || '-'}</td>
            <td><code>${r.answerSlotLabel}</code></td>
            <td><strong>${r.answerText}</strong></td>
            <td><span class="badge badge-type">${r.answerType}</span></td>
            <td><span class="badge badge-ok">${r.status}</span></td>
            <td>p.${r.page}</td>
            <td>${r.note}</td>
          </tr>
        `
          )
          .join('')}
      </tbody>
    </table>
  </div>

  <div class="card">
    <h2>2. 解答PDFの確認（一次資料）</h2>
    <p>解答PDF: <code>content-private/source-pdf/${subject}-kaito.pdf</code></p>
    <img src="../pages/${subject}/kaito_p001.png" class="img-preview" alt="解答ページ">
  </div>

  <div class="card">
    <h2>3. 解答用紙の確認（一次資料）</h2>
    <p>問題冊子 末尾ページ: <code>mondai_p007.png</code>（理科 解答用紙）</p>
    <img src="../pages/${subject}/mondai_p007.png" class="img-preview" alt="解答用紙">
  </div>

  <div class="card approval-box">
    <h2>4. 承認記録（Approvals）</h2>
    <p>確認が完了したら、<code>content-private/approvals/${subject}-inventory.json</code> に以下の内容を記録してください：</p>
    <pre>{
  "subject": "${subject}",
  "totalSlots": ${rows.length},
  "approved": true,
  "approvedAt": "${new Date().toISOString()}",
  "approvedBy": "USER"
}</pre>
  </div>
</body>
</html>
`;

fs.writeFileSync(reviewHtmlPath, html, 'utf-8');
console.log(`Review page generated at: ${reviewHtmlPath}`);

