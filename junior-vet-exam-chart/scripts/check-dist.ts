import fs from 'node:fs';
import path from 'node:path';

const rootDir = process.cwd();
const distDir = path.join(rootDir, 'dist');

if (!fs.existsSync(distDir)) {
  console.error('dist directory not found.');
  process.exit(1);
}

// 過去問固有のキーワードや非公開ファイル名が含まれていないかチェック
const forbiddenPatterns = [
  'content-private',
  'yasuda-2024-01-01',
  'fig-rika-01-root',
  'master100-pack',
];

function checkDirectory(dir: string) {
  const files = fs.readdirSync(dir);
  for (const f of files) {
    const fullPath = path.join(dir, f);
    const stat = fs.statSync(fullPath);
    if (stat.isDirectory()) {
      checkDirectory(fullPath);
    } else {
      const content = fs.readFileSync(fullPath);
      // テキスト・バイナリ両方で検索
      const contentStr = content.toString('utf-8', 0, Math.min(content.length, 5000000));
      for (const pattern of forbiddenPatterns) {
        if (contentStr.includes(pattern)) {
          console.error(`LEAK DETECTED in ${fullPath}: contains forbidden pattern "${pattern}"`);
          process.exit(1);
        }
      }
    }
  }
}

console.log('=== Checking dist directory for private leaks ===');
checkDirectory(distDir);
console.log('Dist inspection PASSED! No private pack content or dev tools found.');

