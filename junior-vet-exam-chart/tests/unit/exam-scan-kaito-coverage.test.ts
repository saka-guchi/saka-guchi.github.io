import { describe, it, expect } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import { SCAN_PAGE_COUNTS, getExamScanPageCount, getExamScanImageUrl } from '../../src/utils/exam-scan-helper';

describe('2026年度 模範解答原本（解答枠・大問1問1〜）網羅性テスト', () => {
  it('2026年度社会の模範解答総ページ数が3ページ（解説解答4, 5, 6）として登録されていること', () => {
    expect(SCAN_PAGE_COUNTS[2026].shakai.totalAnswerPages).toBe(3);
    expect(getExamScanPageCount('kaito', 2026, 'shakai')).toBe(3);
  });

  it('2026年度国語の模範解答総ページ数が4ページ（解説解答8, 9, 10, 11）として登録されていること', () => {
    expect(SCAN_PAGE_COUNTS[2026].kokugo.totalAnswerPages).toBe(4);
    expect(getExamScanPageCount('kaito', 2026, 'kokugo')).toBe(4);
  });

  it('2026年度社会の解答WebP画像（kaito_p001〜p003）が実体ファイルとして存在すること', () => {
    const publicDir = path.resolve(__dirname, '../../public/pages/2026/shakai');
    expect(fs.existsSync(path.join(publicDir, 'kaito_p001.webp'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'kaito_p002.webp'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'kaito_p003.webp'))).toBe(true);
  });

  it('2026年度国語の解答WebP画像（kaito_p001〜p004）が実体ファイルとして存在すること', () => {
    const publicDir = path.resolve(__dirname, '../../public/pages/2026/kokugo');
    expect(fs.existsSync(path.join(publicDir, 'kaito_p001.webp'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'kaito_p002.webp'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'kaito_p003.webp'))).toBe(true);
    expect(fs.existsSync(path.join(publicDir, 'kaito_p004.webp'))).toBe(true);
  });

  it('2026年度社会の1ページ目URLが kaito_p001.webp を指すこと', () => {
    const url = getExamScanImageUrl('kaito', 2026, 'shakai', 1);
    expect(url).toContain('pages/2026/shakai/kaito_p001.webp');
  });
});
