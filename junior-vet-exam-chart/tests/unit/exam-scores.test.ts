import { describe, it, expect } from 'vitest';
import { getExamScoreSummary, getAllExamScoreSummaries, getExamBadgeTier, getExamBadgeInfo } from '../../src/utils/exam-scores';
import type { FinalChallengeResult } from '../../src/types';

describe('exam-scores utility tests & 報酬ランク検証', () => {
  it('得点に応じた報酬バッジのランク判定が正確であること', () => {
    expect(getExamBadgeTier(null)).toBeNull();
    expect(getExamBadgeTier(59)).toBeNull();
    expect(getExamBadgeTier(60)).toBe('certificate'); // 60点以上: 獣医学部 合格証
    expect(getExamBadgeTier(79)).toBe('certificate');
    expect(getExamBadgeTier(80)).toBe('bronze'); // 80点以上: 獣医師国家試験 合格証
    expect(getExamBadgeTier(89)).toBe('bronze');
    expect(getExamBadgeTier(90)).toBe('silver'); // 90点以上: 動物診療施設 開設許可証
    expect(getExamBadgeTier(99)).toBe('silver');
    expect(getExamBadgeTier(100)).toBe('gold'); // 100点: 世界獣医師会 会長賞

    expect(getExamBadgeInfo('gold')?.label).toBe('世界獣医師会 会長賞');
    expect(getExamBadgeInfo('silver')?.label).toBe('動物診療施設 開設許可証');
    expect(getExamBadgeInfo('bronze')?.label).toBe('獣医師国家試験 合格証');
    expect(getExamBadgeInfo('certificate')?.label).toBe('獣医学部 合格証');
  });

  it('未受験の年度・科目は bestScore が null で isPerfect が false であること', () => {
    const history: FinalChallengeResult[] = [];
    const summary = getExamScoreSummary(history, 2026, 'rika');

    expect(summary.bestScore).toBeNull();
    expect(summary.passed).toBe(false);
    expect(summary.isPerfect).toBe(false);
    expect(summary.badgeTier).toBeNull();
    expect(summary.attemptCount).toBe(0);
  });

  it('受験履歴がある場合、該当年度・科目の最高点とランクを正確に算出すること', () => {
    const history: FinalChallengeResult[] = [
      {
        id: 1,
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 65,
        totalScore: 100,
        passed: true,
        timestamp: 1000,
        questionScores: {},
      },
      {
        id: 2,
        examId: 'yasuda-2026-rika',
        stage: 1,
        score: 85,
        totalScore: 100,
        passed: true,
        timestamp: 2000,
        questionScores: {},
      },
      {
        id: 3,
        examId: 'yasuda-2026-sansu',
        stage: 1,
        score: 95,
        totalScore: 100,
        passed: true,
        timestamp: 3000,
        questionScores: {},
      },
      {
        id: 4,
        examId: 'yasuda-2025-rika',
        stage: 1,
        score: 100,
        totalScore: 100,
        passed: true,
        timestamp: 4000,
        questionScores: {},
      },
    ];

    const rika2026 = getExamScoreSummary(history, 2026, 'rika');
    expect(rika2026.bestScore).toBe(85);
    expect(rika2026.passed).toBe(true);
    expect(rika2026.badgeTier).toBe('bronze'); // 85点 -> 銅
    expect(rika2026.isPerfect).toBe(false);

    const sansu2026 = getExamScoreSummary(history, 2026, 'sansu');
    expect(sansu2026.bestScore).toBe(95);
    expect(sansu2026.badgeTier).toBe('silver'); // 95点 -> 銀

    const rika2025 = getExamScoreSummary(history, 2025, 'rika');
    expect(rika2025.bestScore).toBe(100);
    expect(rika2025.badgeTier).toBe('gold'); // 100点 -> 金
    expect(rika2025.isPerfect).toBe(true);
  });

  it('getAllExamScoreSummaries で全年度・全科目のサマリーが一括取得できること', () => {
    const history: FinalChallengeResult[] = [
      {
        id: 1,
        examId: 'yasuda-2026-kokugo',
        stage: 1,
        score: 100,
        totalScore: 100,
        passed: true,
        timestamp: 1000,
        questionScores: {},
      },
    ];

    const all = getAllExamScoreSummaries(history);
    expect(all[2026].kokugo.bestScore).toBe(100);
    expect(all[2026].kokugo.badgeTier).toBe('gold');
    expect(all[2026].rika.bestScore).toBeNull();
    expect(all[2024].sansu.bestScore).toBeNull();
  });
});
