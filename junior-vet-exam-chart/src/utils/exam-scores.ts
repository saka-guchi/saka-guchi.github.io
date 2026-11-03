import type { Subject, FinalChallengeResult } from '../types';
import { SUPPORTED_EXAM_YEARS, type ExamYear } from '../data/final-challenge-data';

export interface SubjectScoreSummary {
  year: ExamYear;
  subject: Subject;
  bestScore: number | null; // 未受験の場合は null
  passed: boolean;
  isPerfect: boolean; // 100点満点
  attemptCount: number;
  lastAttemptTimestamp: number | null;
}

/**
 * 過去の試験履歴から、指定された年度・科目の最高点と受験状況を集計する
 */
export function getExamScoreSummary(
  history: FinalChallengeResult[],
  year: ExamYear,
  subject: Subject
): SubjectScoreSummary {
  // examId から特定年度と科目にマッチする結果を抽出
  // 想定パターン: 'yasuda-2026-rika', 'yasuda-2024-kokugo', 'pack-yasuda-2024-sansu' など
  const matched = history.filter(r => {
    const id = r.examId || '';
    const hasSubject = id.includes(subject);
    if (!hasSubject) return false;

    // 年度の判定
    const yearStr = String(year);
    if (id.includes(yearStr)) return true;

    // 2024年の後方互換: 他の年度文字列(2022, 2023, 2025, 2026)が含まれていない場合
    if (year === 2024 && !id.match(/2022|2023|2025|2026/)) {
      return true;
    }

    return false;
  });

  if (matched.length === 0) {
    return {
      year,
      subject,
      bestScore: null,
      passed: false,
      isPerfect: false,
      attemptCount: 0,
      lastAttemptTimestamp: null,
    };
  }

  const bestScore = Math.max(...matched.map(m => m.score));
  const passed = matched.some(m => m.passed || m.score >= 80);
  const isPerfect = bestScore === 100;
  const lastAttemptTimestamp = Math.max(...matched.map(m => m.timestamp));

  return {
    year,
    subject,
    bestScore,
    passed,
    isPerfect,
    attemptCount: matched.length,
    lastAttemptTimestamp,
  };
}

/**
 * 全年度・全科目のスコアサマリーを一括集計する
 */
export function getAllExamScoreSummaries(
  history: FinalChallengeResult[]
): Record<ExamYear, Record<Subject, SubjectScoreSummary>> {
  const result = {} as Record<ExamYear, Record<Subject, SubjectScoreSummary>>;
  const subjects: Subject[] = ['rika', 'sansu', 'shakai', 'kokugo'];

  for (const yr of SUPPORTED_EXAM_YEARS) {
    result[yr] = {} as Record<Subject, SubjectScoreSummary>;
    for (const sub of subjects) {
      result[yr][sub] = getExamScoreSummary(history, yr, sub);
    }
  }

  return result;
}
