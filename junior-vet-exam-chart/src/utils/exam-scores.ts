import type { Subject, FinalChallengeResult } from '../types';
import { SUPPORTED_EXAM_YEARS, type ExamYear } from '../data/final-challenge-data';

export type ExamBadgeTier = 'gold' | 'silver' | 'bronze' | 'certificate' | null;

export interface SubjectScoreSummary {
  year: ExamYear;
  subject: Subject;
  bestScore: number | null; // 未受験の場合は null
  passed: boolean; // 60点以上で合格（認定証獲得）
  isPerfect: boolean; // 100点満点
  badgeTier: ExamBadgeTier;
  attemptCount: number;
  lastAttemptTimestamp: number | null;
}

/**
 * 点数に応じた報酬バッジのランクを判定する
 * 60点以上: 獣医学部 合格証
 * 80点以上: 獣医師国家試験 合格証
 * 90点以上: 動物診療施設 開設許可証
 * 100点: 世界獣医師会 会長賞
 */
export function getExamBadgeTier(score: number | null): ExamBadgeTier {
  if (score === null || score < 60) return null;
  if (score === 100) return 'gold';
  if (score >= 90) return 'silver';
  if (score >= 80) return 'bronze';
  return 'certificate'; // 60〜79点
}

export function getExamBadgeInfo(tier: ExamBadgeTier): { label: string; icon: string; color: string } | null {
  switch (tier) {
    case 'gold':
      return { label: '世界獣医師会 会長賞', icon: '🥇', color: '#eab308' };
    case 'silver':
      return { label: '動物診療施設 開設許可証', icon: '🥈', color: '#94a3b8' };
    case 'bronze':
      return { label: '獣医師国家試験 合格証', icon: '🥉', color: '#d97706' };
    case 'certificate':
      return { label: '獣医学部 合格証', icon: '📜', color: '#10b981' };
    default:
      return null;
  }
}

/**
 * 過去の試験履歴から、指定された年度・科目の最高点と受験状況を集計する
 */
export function getExamScoreSummary(
  history: FinalChallengeResult[],
  year: ExamYear,
  subject: Subject
): SubjectScoreSummary {
  const matched = history.filter(r => {
    const id = r.examId || '';
    const hasSubject = id.includes(subject);
    if (!hasSubject) return false;

    const yearStr = String(year);
    if (id.includes(yearStr)) return true;

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
      badgeTier: null,
      attemptCount: 0,
      lastAttemptTimestamp: null,
    };
  }

  const bestScore = Math.max(...matched.map(m => m.score));
  // 報酬ルール: 60点以上で合格（獣医学部 合格証）
  const passed = bestScore >= 60;
  const isPerfect = bestScore === 100;
  const badgeTier = getExamBadgeTier(bestScore);
  const lastAttemptTimestamp = Math.max(...matched.map(m => m.timestamp));

  return {
    year,
    subject,
    bestScore,
    passed,
    isPerfect,
    badgeTier,
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
