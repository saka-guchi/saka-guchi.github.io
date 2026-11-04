import { describe, it, expect } from 'vitest';
import fs from 'fs';
import path from 'path';
import { DEPRECATED_TERMS, APP_TERMS } from '../../src/constants/terms';

describe('再発防止: 用語統制＆旧定義名混入防止テスト (ルール③)', () => {
  it('4大医療活動の正式名称が正しく定義されていること', () => {
    expect(APP_TERMS.DAILY_CONSULTATION).toBe('本日の診察');
    expect(APP_TERMS.PRESCRIPTION).toBe('知識の処方箋');
    expect(APP_TERMS.CASE_STUDY).toBe('症例スタディ');
    expect(APP_TERMS.VET_CHALLENGE).toBe('獣医師チャレンジ');
    expect(APP_TERMS.VET_CHALLENGE_WITH_ICON).toBe('🏆 獣医師チャレンジ');
  });

  it('src/ 配下の全ソースコードに廃止用語（合格ドクター認定試験、獣医師認定試験）が混入していないこと', () => {
    const srcDir = path.resolve(__dirname, '../../src');
    const violations: { file: string; line: number; term: string; snippet: string }[] = [];

    function scanDir(dir: string) {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const fullPath = path.join(dir, entry.name);
        if (entry.isDirectory()) {
          scanDir(fullPath);
        } else if (entry.isFile() && (entry.name.endsWith('.ts') || entry.name.endsWith('.tsx'))) {
          // terms.ts 自体は除外（DEPRECATED_TERMS の定義元のため）
          if (entry.name === 'terms.ts') continue;

          const content = fs.readFileSync(fullPath, 'utf8');
          const lines = content.split('\n');

          lines.forEach((lineText, idx) => {
            for (const term of DEPRECATED_TERMS) {
              if (lineText.includes(term)) {
                violations.push({
                  file: path.relative(srcDir, fullPath),
                  line: idx + 1,
                  term,
                  snippet: lineText.trim(),
                });
              }
            }
          });
        }
      }
    }

    scanDir(srcDir);

    if (violations.length > 0) {
      const message = violations
        .map(v => `[${v.file}:${v.line}] 廃止用語「${v.term}」を検出: ${v.snippet}`)
        .join('\n');
      expect.fail(`ソースコード内に廃止された旧名称が残っています。正式名称「${APP_TERMS.VET_CHALLENGE}」に統一してください:\n${message}`);
    }

    expect(violations).toHaveLength(0);
  });
});

