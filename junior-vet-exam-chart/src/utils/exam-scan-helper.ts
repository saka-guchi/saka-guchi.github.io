import type { Subject } from '../types';
import type { SampleQuestion, OriginalScanRef } from '../data/sample-data';

export interface ScanPageInfo {
  totalProblemPages: number;
  totalAnswerPages: number;
}

// 各年度・教科ごとの問題および解答原本の総ページ数テーブル
export const SCAN_PAGE_COUNTS: Record<number, Record<Subject, ScanPageInfo>> = {
  2022: {
    rika: { totalProblemPages: 4, totalAnswerPages: 2 },
    sansu: { totalProblemPages: 3, totalAnswerPages: 3 },
    shakai: { totalProblemPages: 10, totalAnswerPages: 3 },
    kokugo: { totalProblemPages: 14, totalAnswerPages: 3 },
  },
  2023: {
    rika: { totalProblemPages: 5, totalAnswerPages: 1 },
    sansu: { totalProblemPages: 8, totalAnswerPages: 1 },
    shakai: { totalProblemPages: 6, totalAnswerPages: 1 },
    kokugo: { totalProblemPages: 10, totalAnswerPages: 2 },
  },
  2024: {
    rika: { totalProblemPages: 7, totalAnswerPages: 2 },
    sansu: { totalProblemPages: 10, totalAnswerPages: 3 },
    shakai: { totalProblemPages: 10, totalAnswerPages: 3 },
    kokugo: { totalProblemPages: 14, totalAnswerPages: 2 },
  },
  2025: {
    rika: { totalProblemPages: 8, totalAnswerPages: 2 },
    sansu: { totalProblemPages: 8, totalAnswerPages: 3 },
    shakai: { totalProblemPages: 10, totalAnswerPages: 3 },
    kokugo: { totalProblemPages: 12, totalAnswerPages: 3 },
  },
  2026: {
    rika: { totalProblemPages: 6, totalAnswerPages: 2 },
    sansu: { totalProblemPages: 5, totalAnswerPages: 4 },
    shakai: { totalProblemPages: 10, totalAnswerPages: 2 },
    kokugo: { totalProblemPages: 13, totalAnswerPages: 3 },
  },
};

/**
 * 原本スキャン画像のURLを安全に解決
 */
export function getExamScanImageUrl(
  type: 'mondai' | 'kaito',
  year: number,
  subject: Subject,
  pageNumber: number,
  storedImages?: Record<string, string>
): string {
  const pad = String(pageNumber).padStart(3, '0');
  const base = typeof import.meta !== 'undefined' && import.meta.env?.BASE_URL ? import.meta.env.BASE_URL : '/';

  // 1. 年度付きキー
  const yearKey = `images/pages/${year}/${subject}/${type}_p${pad}.webp`;
  const yearAltKey = `images/pages/${year}/${subject}/${type}_p${pad}.png`;
  if (storedImages?.[yearKey]) return storedImages[yearKey];
  if (storedImages?.[yearAltKey]) return storedImages[yearAltKey];

  // 2. 年度なしキー（旧互換）
  const legacyKey = `images/pages/${subject}/${type}_p${pad}.webp`;
  if (storedImages?.[legacyKey]) return storedImages[legacyKey];

  // 3. public フォールバック
  return `${base}pages/${year}/${subject}/${type}_p${pad}.webp`;
}

/**
 * 原本スキャンの総ページ数を取得
 */
export function getExamScanPageCount(
  type: 'mondai' | 'kaito',
  year: number,
  subject: Subject
): number {
  const yearData = SCAN_PAGE_COUNTS[year] || SCAN_PAGE_COUNTS[2024];
  const info = yearData[subject] || { totalProblemPages: 7, totalAnswerPages: 2 };
  return type === 'mondai' ? info.totalProblemPages : info.totalAnswerPages;
}

/**
 * 設問データから原本スキャンのメタデータを安全に導出する
 * 過去問だけでなく、各年度準拠の特訓カリキュラム問題からも原本（年度・教科・ページ）を解決可能にする
 */
export function resolveQuestionScanMeta(
  question?: Partial<SampleQuestion> | null
): OriginalScanRef | null {
  if (!question) return null;

  // 1. データ内に直接原本スキャン指定がある場合は最優先
  if (question.originalScan) {
    return question.originalScan;
  }

  const id = question.id || '';

  // 2. 過去問ID形式: past-exam-YYYY-subject-...
  const match = id.match(/^past-exam-(\d{4})-([a-z]+)-(.*)$/);
  if (match) {
    return {
      year: parseInt(match[1], 10),
      subject: match[2] as Subject,
      pageNumber: 1,
      slotId: match[3],
    };
  }

  // 3. IDまたは教科から準拠年度を導出
  let year = 2024;
  if (id.includes('2026')) year = 2026;
  else if (id.includes('2025')) year = 2025;
  else if (id.includes('2024')) year = 2024;
  else if (id.includes('2023')) year = 2023;
  else if (id.includes('2022')) year = 2022;
  else if (question.subject === 'kokugo' || id.includes('kokugo')) year = 2022;

  const subject: Subject = question.subject || 'sansu';

  return {
    year,
    subject,
    pageNumber: 1,
    slotId: id,
  };
}
